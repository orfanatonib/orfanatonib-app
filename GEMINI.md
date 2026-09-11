# Gemini Project Instructions — Orfanato NIB Frontend

Before making changes, read and follow:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/ORFANATO_FRONTEND_BEST_PRACTICES.md`](docs/ORFANATO_FRONTEND_BEST_PRACTICES.md)
3. The applicable domain document under `docs/`

Use the existing React/Vite/MUI architecture, shared Axios client, deliberate state ownership, mandatory input and output DTOs for all API operations, mandatory dedicated files for `types` and `constants`, mandatory domain enums for finite sets (no magic strings), mandatory dedicated `utils` files for pure logic, strict typed contracts with NEVER any `any` under any circumstances, responsive accessible UI, API-enforced permission assumptions, and tests for every behavior change. Preserve privacy and unrelated local changes.
