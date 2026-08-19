# Claude Project Instructions — Orfanato NIB Frontend

Read and comply with [`AGENTS.md`](AGENTS.md) and [`docs/ORFANATO_FRONTEND_BEST_PRACTICES.md`](docs/ORFANATO_FRONTEND_BEST_PRACTICES.md) before modifying this repository.

Mandatory summary:

- Use the shared Axios client; never duplicate authentication, refresh, retry, or global error handling.
- Keep API, hooks, components, pages, and types separated by responsibility.
- Use strict TypeScript without new `any` values.
- Reuse Material UI, the project theme, guards, and shared components.
- Cover mobile, accessibility, permissions, privacy, tests, and documentation in the same delivery.

If this summary and the detailed guide differ, the detailed guide controls.
