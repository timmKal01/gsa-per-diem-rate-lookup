const BASE_URL = 'https://api.gsa.gov/travel/perdiem/v2/rates';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url) {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const res = await fetch(url, { signal: controller.signal });
            const body = await res.json().catch(() => null);
            if (res.ok && body) return body;
            const retryable = res.status === 429 || res.status >= 500 || body === null;
            lastErr = new Error(`GSA per diem API request failed: ${res.status} ${res.statusText}`);
            if (!retryable) throw lastErr;
        } catch (err) {
            lastErr = err.name === 'AbortError' ? new Error(`GSA per diem API request timed out (attempt ${attempt}/${MAX_ATTEMPTS})`) : err;
        } finally {
            clearTimeout(timer);
        }
        if (attempt < MAX_ATTEMPTS) await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
    throw lastErr;
}

function mapRateEntry(entry, state, year) {
    return {
        city: entry.city ?? null,
        county: entry.county ?? null,
        state: state ?? null,
        zip: entry.zip ?? null,
        year,
        isStandardRate: entry.standardRate === 'true' || entry.standardRate === true,
        mealsRate: entry.meals ?? null,
        monthlyLodgingRates: (entry.months?.month ?? []).map((m) => ({ month: m.long, lodgingRate: m.value })),
    };
}

export async function lookupPerDiem({ location, year, apiKey }) {
    const key = apiKey || 'DEMO_KEY';
    let url;
    let state = location.state ?? null;
    if (location.zip) {
        url = `${BASE_URL}/zip/${encodeURIComponent(location.zip)}/year/${year}?api_key=${encodeURIComponent(key)}`;
    } else if (location.city && location.state) {
        url = `${BASE_URL}/city/${encodeURIComponent(location.city)}/state/${encodeURIComponent(location.state)}/year/${year}?api_key=${encodeURIComponent(key)}`;
    } else {
        return { found: false, error: 'Each location needs either "zip", or both "city" and "state".' };
    }

    const body = await fetchWithRetry(url);
    const rateGroups = body.rates ?? [];
    if (rateGroups.length === 0) return { found: false };

    const entries = rateGroups.flatMap((group) => (group.rate ?? []).map((entry) => mapRateEntry(entry, group.state ?? state, group.year ?? year)));
    return { found: true, rates: entries };
}
