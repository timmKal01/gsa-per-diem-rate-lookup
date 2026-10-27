# GSA Per Diem Rates: Lodging & Meals by City

Official U.S. government travel per diem rates for corporate travel,
expense and government contracting teams. Enter a city and state or a zip
code and a fiscal year, and get the GSA lodging rate for each month plus
the daily meals and incidental expenses (M&IE) rate.

## What you get

One row per location:

- The lodging rate for each month of the fiscal year
- The daily meals and incidental expenses (M&IE) rate
- City, county, state and zip, and whether the standard rate applies

## Who this is for

- **Corporate travel and expense compliance teams** checking the official GSA rate before approving a travel expense report.
- **Government contractors** who must bill travel expenses at GSA per diem rates under their contract terms.
- **Relocation and HR teams** budgeting travel or temporary housing costs against the federal standard.

## Input

| Field | Type | Description |
|---|---|---|
| `locations` | array | `[{ "city": "Austin", "state": "TX" }]` or `[{ "zip": "78701" }]`. Cities not on GSA's specific list automatically return the standard CONUS rate. |
| `year` | integer (default `2026`) | Federal fiscal year to look up. |
| `apiKey` | string (optional) | Your own free key from api.gsa.gov. Falls back to the public `DEMO_KEY`, which works but may be rate-limited under heavy batch use. |

```json
{
  "locations": [
    { "city": "Austin", "state": "TX" },
    { "zip": "10001" }
  ],
  "year": 2026
}
```

### Getting your own free API key

The built-in `DEMO_KEY` works out of the box for testing and light use. For
larger batches, get a free key in a couple of minutes at
[open.gsa.gov/api/perdiem](https://open.gsa.gov/api/perdiem/) and pass it as
`apiKey`.

## Output

One record per location per rate period found:

```json
{
  "rowType": "rate",
  "location": { "city": "Austin", "state": "TX" },
  "city": "Austin",
  "county": "Travis",
  "state": "TX",
  "zip": null,
  "year": 2026,
  "isStandardRate": false,
  "mealsRate": 80,
  "monthlyLodgingRates": [
    { "month": "January", "lodgingRate": 187 },
    { "month": "February", "lodgingRate": 187 },
    { "month": "March", "lodgingRate": 187 }
  ]
}
```

`rowType` is `"rate"`, or `"error"` for a location that couldn't be looked up. A location GSA has no rate for comes back as a `"rate"` row with `found: false`.

`isStandardRate` is `true` when the location isn't on GSA's list of
specifically-priced cities and got the standard CONUS rate instead, so you
can tell the two cases apart in bulk lookups.

## How it works

Direct calls to the official GSA Travel Per Diem API (`api.gsa.gov`), the
same data behind GSA's own per diem lookup tool. No scraping, no proxy.

## Pricing note

Billed per **location checked**, not per monthly rate row returned — one
charge per location whether it resolves to a specifically-priced city
with 12 monthly lodging rates or the flat standard CONUS rate.

## Related products

- [Federal Contract Awards](https://apify.com/m_ctim/federal-contract-award-tracker): for GovCon teams tracking federal contract awards rather than travel billing rates
