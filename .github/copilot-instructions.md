# GitHub Copilot Instructions — Orfanato NIB Frontend

These instructions apply to all suggestions and edits in this repository.

Read and follow [`AGENTS.md`](../AGENTS.md) and [`docs/ORFANATO_FRONTEND_BEST_PRACTICES.md`](../docs/ORFANATO_FRONTEND_BEST_PRACTICES.md).

- Follow the existing React 19, Vite, strict TypeScript, Material UI, Redux Toolkit, and Axios architecture.
- Keep HTTP calls in feature API modules and use `src/config/axiosConfig.ts`.
- Keep domain orchestration in hooks and rendering in components/pages.
- Do not introduce `any`, duplicate session logic, arbitrary design tokens, inaccessible controls, or sensitive logging.
- Include loading, empty, success, error, mobile, permission, and test coverage for changed behavior.
- Keep changes focused and preserve unrelated work.
