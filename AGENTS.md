# Repository Instructions — Orfanato NIB Frontend

## Scope

These instructions apply to the entire `orfanatonib-app` repository.

## Mandatory Source of Truth

Before modifying any source, test, configuration, or documentation file, read and comply with:

- [`docs/ORFANATO_FRONTEND_BEST_PRACTICES.md`](docs/ORFANATO_FRONTEND_BEST_PRACTICES.md)

That document is the canonical detailed guide for architecture, API access, state ownership, Material UI, responsive design, accessibility, authentication, privacy, tests, and verification. This file is the always-loaded entrypoint and does not replace the detailed guide.

## Repository Context

- Application: Orfanato NIB frontend.
- Stack: React 19, strict TypeScript, Vite, React Router, Material UI/Emotion, Redux Toolkit, Axios, React Hook Form/Yup, Vitest, and Testing Library.
- Backend contract: sibling repository `../orfanatonib-api`.
- User-facing language: Portuguese. Engineering documentation and code identifiers: English.

## Non-Negotiable Rules

1. Use `src/config/axiosConfig.ts` for every HTTP operation. Do not duplicate Axios instances, authentication headers, token refresh, retry, or global error handling.
2. Keep domain code under `src/features/<feature>/`; keep shared UI under `src/components/common/`; keep routed composition under `src/pages/`.
3. Components must not call Axios directly or own backend business rules.
4. Do not add `any`. Model request DTOs, response DTOs, props, state, errors, roles, and status values explicitly.
5. Reuse Material UI, the project theme, shared components, route guards, and existing error utilities before creating alternatives.
6. Every screen and interaction must be mobile-first, keyboard-accessible, and usable with 44 × 44 px touch targets.
7. The API is the authorization authority. UI guards and hidden buttons do not replace backend permission checks.
8. Never log or persist secrets or unnecessary personal data about sheltered people, guardians, contacts, or ministry participants.
9. Every behavior change requires tests. Bug fixes require a regression test.
10. Do not modify environment, deployment, or infrastructure files unless the task explicitly requires it.
11. Preserve unrelated user changes and keep the final diff limited to the requested outcome.

## Required Implementation Workflow

1. Inspect the current code and the complete affected flow.
2. Verify the endpoint and DTO contract in the NestJS API.
3. Search for reusable components, hooks, types, and utilities.
4. Implement the smallest cohesive change with loading, empty, success, error, and permission states.
5. Add or update tests and relevant documentation.
6. Run checks proportional to the change and inspect the final diff.

When existing code conflicts with the canonical guide, do not spread the inconsistency into new code and do not perform an unrelated mass refactor. Apply the standard within the task scope and report any remaining debt.

## Verification

Run from the repository root as applicable:

```bash
NODE_OPTIONS='--max-old-space-size=2048' npm run type-check
NODE_OPTIONS='--max-old-space-size=2048' npm run lint
NODE_OPTIONS='--max-old-space-size=2048' npm test -- --run
NODE_OPTIONS='--max-old-space-size=2048' npm run build
```

A change is incomplete if its relevant tests, type-check, lint, or build fail.
