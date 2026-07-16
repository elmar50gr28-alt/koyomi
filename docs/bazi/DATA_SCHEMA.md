# KOYOMI Bazi Data Schema

## Rule

Required fields:

- `ruleId`
- `name`
- `category`
- `conditions`
- `exclusions`
- `priority`
- `result`
- `schoolIds`
- `sourceIds`
- `confidence`
- `reviewStatus`
- `version`
- `notes`

## Classical Source

Required fields:

- `sourceId`
- `title`
- `author`
- `era`
- `chapter`
- `section`
- `originalText`
- `normalizedText`
- `japaneseSummary`
- `conceptIds`
- `schoolIds`
- `sourceType`
- `copyrightStatus`
- `reviewStatus`

## Source Separation

Classical source data is separate from modern interpretation and KOYOMI rules. AI-generated prose must not be stored as a classical source.
