# KOYOMI Bazi Test Policy

Phase 1 tests cover:

- calendar boundary contract
- year/month/day/hour pillar existence
- unknown birth time behavior
- true solar time correction
- required result domains
- school comparison
- rule evidence lookup
- validation schema
- browser module loading through GitHub Pages

The browser test page is:

`src/bazi/validation/bazi-test.html`

Automated tests are:

- `npm run test:static`
- `npm run test:bazi`
- `npm run test:mobile`

Phase 2 tests also cover:

- strength structure
- pattern candidate structure
- yongshen method separation
- favorable element classification
- luck cycle direction and cycle generation
- phase2 validation schema

GitHub Actions workflows:

- `validate.yml`
- `bazi-tests.yml`
- `mobile-regression.yml`
- `deploy-pages.yml`

Phase 2 must add larger verified case tables and astronomical solar-term precision tests.
