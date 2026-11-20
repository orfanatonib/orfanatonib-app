# Claude Project Instructions — Orfanato NIB Frontend

Read and comply with [`AGENTS.md`](AGENTS.md), [`docs/ORFANATO_FRONTEND_BEST_PRACTICES.md`](docs/ORFANATO_FRONTEND_BEST_PRACTICES.md), and the applicable domain document before modifying this repository.

Mandatory summary:

- Use the shared Axios client and keep API, hooks, components, pages, and types separated.
- Choose one owner for each state value: local React, Redux, or cache.
- Use explicit input DTOs and output DTOs for all API calls and operations.
- ALWAYS create dedicated files for `types` and `constants`, ALWAYS use domain enums for finite sets (no magic strings), and ALWAYS create dedicated `utils` files for pure logic.
- Use strict TypeScript and NEVER use `any` under any circumstances.
- Reuse Material UI, shared components, guards, query-key patterns, and error utilities.
- E2E: every run starts with ALL e-mail dispatch flags off (Playwright `setup` project, none left out); a feature that needs an e-mail notification creates it WITH its own per-type flag in the same delivery (API side).
- Cover mobile, accessibility, role/shelter permissions, privacy, tests, and docs.

If this summary and the detailed guide differ, the detailed guide controls.
