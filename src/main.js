import { Actor, log } from 'apify';
import { lookupPerDiem } from './gsa.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { locations = [], year = 2026, apiKey } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const LOCATION_CHECKED_EVENT = 'location-checked';

if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error('Input "locations" must be a non-empty array, e.g. [{ "city": "Austin", "state": "TX" }].');
}

for (const location of locations) {
    log.info('Looking up per diem rate', { location, year });

    let outcome;
    try {
        outcome = await lookupPerDiem({ location, year, apiKey });
    } catch (err) {
        log.warning('Per diem lookup failed', { location, error: err.message });
        await Actor.pushData({ location, year, found: false, error: err.message });
        continue;
    }

    if (!outcome.found) {
        await Actor.pushData({ location, year, found: false, error: outcome.error ?? null });
        await Actor.charge({ eventName: LOCATION_CHECKED_EVENT });
        continue;
    }

    for (const rate of outcome.rates) {
        await Actor.pushData({ location, ...rate });
    }
    await Actor.charge({ eventName: LOCATION_CHECKED_EVENT });
}

log.info(`Checked ${locations.length} location(s)`);

await Actor.exit();
