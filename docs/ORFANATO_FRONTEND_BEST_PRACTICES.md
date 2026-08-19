# Orfanato NIB Frontend Best Practices & Engineering Guidelines

## 1. Purpose and Scope

This document defines the mandatory engineering standards for `orfanatonib-app`. AI coding assistants and human developers MUST read it before creating, fixing, or refactoring frontend code.

Current stack: React 19, strict TypeScript, Vite, React Router, Material UI/Emotion, Redux Toolkit with persistence, Axios, React Hook Form/Yup, Vitest, and Testing Library.

Core principles:

- Inspect the current implementation and preserve existing contracts before changing behavior.
- Prefer small, cohesive changes that follow the repository's current architecture.
- Do not copy patterns that are specific to Next.js, Tailwind, a backend service, or another product.
- Do not turn a local fix into an unrelated repository-wide refactor.
- Do not modify environment, infrastructure, or deployment files unless explicitly requested.

## 2. Mandatory Pre-Change Workflow

Before implementing a change:

1. Read `package.json`, `tsconfig.json`, `vite.config.ts`, and every directly affected file.
2. Search for equivalent components, hooks, types, utilities, and API operations already in the repository.
3. Verify the API contract in `orfanatonib-api` and its documentation. Never infer a payload from the UI alone.
4. Identify affected routes, authentication rules, roles, feature flags, and persisted state.
5. Locate the tests and documentation that must change with the behavior.
6. Preserve unrelated local changes and avoid formatting files outside the task scope.

### 2.1 AI Instruction Discovery and Execution Protocol

The canonical entrypoint is the repository-root `AGENTS.md`. Tool-specific files (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, and `.cursor/rules/`) redirect assistants to this guide. They MUST remain short adapters; detailed rules belong here so the tools cannot drift apart.

For every implementation task, the assistant MUST:

1. Restate the requested outcome internally as observable acceptance criteria.
2. Inspect the complete affected path, including route, guard, page, hook, API client, DTO, backend endpoint, and tests.
3. Separate verified facts from assumptions. Resolve assumptions from the repository whenever possible.
4. Identify failure modes before coding: slow request, empty response, expired session, forbidden role, stale component, duplicate submission, and mobile overflow.
5. Implement only the requested behavior and necessary supporting changes.
6. Verify the narrowest relevant scope first, then run broader checks proportional to risk.
7. Review the final diff for accidental formatting, dead code, secrets, generated artifacts, and unrelated changes.
8. Report what changed, what was verified, and any remaining risk or pre-existing failure.

Existing code is evidence of current behavior, not automatic permission to reproduce technical debt. Follow this guide for new code while avoiding unrelated mass refactors.

## 3. Feature-Driven Architecture and Layer Separation

Domain code belongs in `src/features/<feature>/`. Truly reusable UI belongs in `src/components/common/`; routed screens and layout composition belong in `src/pages/`.

Recommended structure for new or substantially expanded features:

```text
src/features/<feature>/
├── api.ts                 # HTTP calls and contract mapping
├── types.ts               # DTOs, domain models, enums, and props
├── hooks.ts               # State, queries, mutations, and UI orchestration
├── components/            # Feature-specific UI
├── pages/                 # Routed screens, when applicable
├── schemas.ts             # Form validation, when applicable
├── utils.ts               # Pure domain helpers
└── index.ts               # Optional public feature API
```

Do not create empty directories. A small feature may use single files; split a file into directories only when its responsibilities genuinely grow, and preserve stable imports where practical.

Mandatory responsibilities:

- `api`: owns URLs, HTTP methods, query parameters, request payloads, and response mapping; it MUST use `src/config/axiosConfig.ts`.
- `hooks`: orchestrates loading, errors, state transitions, API calls, and UI events.
- `components`: renders typed data and emits events; it MUST NOT build endpoints or access Axios directly.
- `pages`: composes features, layout, route parameters, and guards; it MUST NOT accumulate business rules.
- `types`: fully models the incoming and outgoing contracts.
- `utils`: contains deterministic functions without React, store access, network calls, or argument mutation.

Do not create hybrid components driven by many flags for unrelated workflows. When business rules, permissions, or state machines diverge, create dedicated components and hooks.

## 4. State, API, and Contracts

### 4.1 State Ownership

- Keep ephemeral UI state in `useState` or a feature hook.
- Keep session and genuinely shared application state in Redux Toolkit.
- Do not place derivable values in Redux.
- Use typed selectors with `RootState` and typed dispatch with `AppDispatch`.
- Persist only the minimum necessary data. Never add personal or sensitive records to `redux-persist` without a documented requirement.

### 4.2 API Access

- Every HTTP call MUST use the shared client in `src/config/axiosConfig.ts`.
- Do not create feature-level Axios instances or duplicate authorization and token refresh logic.
- The shared interceptor owns authentication headers, refresh, retry, circuit-breaker behavior, and global error handling.
- Use internal error-handling opt-outs only when the calling flow provides complete local handling; document the reason at the call site.
- For `FormData`, do not set `Content-Type` manually; allow the browser to provide the multipart boundary.
- Never retry a non-idempotent mutation automatically without an idempotency guarantee.
- Avoid request waterfalls when calls can be executed independently or derived from an existing response.

### 4.3 Contract Typing

```ts
export interface CreateShelterRequest {
  name: string;
  addressId?: string;
}

export interface ShelterResponse {
  id: string;
  name: string;
  active: boolean;
}
```

- Adding `any` is prohibited. Use explicit types; use `unknown` only at untrusted boundaries and narrow it immediately.
- Do not use a loose dictionary as a permanent substitute for a known DTO.
- Use `interface` for object shapes and component props; use `type` for unions and utility types.
- Roles, statuses, and domain categories MUST use shared enums or unions instead of scattered magic strings.
- Keep API dates as ISO strings in transport DTOs and format them for `pt-BR` only in the presentation layer.
- A component MUST consume the same domain type returned by the hook unless an explicit view model transformation is needed.

## 5. Components, Material UI, and Design System

Material UI and the repository theme are the visual foundation. Before adding custom CSS or `sx`, inspect `src/theme/`, `src/components/common/`, and equivalent feature components.

- Prefer MUI primitives such as `Button`, `TextField`, `Select`, `Dialog`, `Card`, `Alert`, and `Snackbar`.
- Use `theme.palette`, `theme.spacing`, `theme.shape`, and theme breakpoints. Do not spread arbitrary hex colors, shadows, spacing values, or z-index values through components.
- Put reusable brand colors and recurring values in the theme.
- Async actions MUST disable their trigger and expose a visible progress state.
- Native buttons MUST explicitly use `type="button"` or `type="submit"`.
- Interactive controls require an accessible name, visible focus, and keyboard operation.
- Meaningful images require useful `alt` text; decorative images use `alt=""`.
- Icon-only actions require an `aria-label` and a tooltip when their purpose is not obvious.
- Reuse an existing component before creating another variant with only cosmetic differences.

Recommended component file order:

1. React and third-party imports;
2. shared UI imports;
3. feature imports;
4. types and props;
5. exported component;
6. hooks and local state;
7. derived values;
8. event handlers;
9. render guards;
10. JSX.

## 6. Mobile-First and Accessibility Standards

Every screen MUST work on mobile first and progressively enhance through MUI breakpoints (`xs`, `sm`, `md`, `lg`, `xl`).

- Use responsive values such as `sx={{ flexDirection: { xs: 'column', md: 'row' } }}`.
- Interactive touch targets MUST be at least 44 × 44 px.
- Tables need a contained scroll region, responsive columns, or a card alternative; they MUST NOT make the entire page scroll horizontally.
- Dialogs must fit mobile width, respect the available height, and scroll internally.
- Fixed controls must account for `env(safe-area-inset-bottom)` where relevant.
- Essential actions cannot be available only on hover.
- Preserve sufficient contrast, a logical focus order, field labels, and semantic heading order.
- Loading and empty states must not cause major layout shifts.

## 7. Forms and Modals

- Use React Hook Form with Yup and `@hookform/resolvers` for non-trivial forms.
- Frontend validation improves the experience but never replaces API validation.
- Show field errors beside their controls and non-field failures in a clear alert or notification.
- Input masks are presentation only; normalize values before submission.
- Prevent duplicate submissions and preserve entered data when a request fails.
- Reuse modals in `src/components/common/modal/` or `src/components/Modal/` before creating another modal system.
- A modal requires an accessible title, managed focus, keyboard close behavior, a cancel action, and a loading state.
- Do not close a modal during a mutation unless the operation is cancelled or late results are safely ignored.

## 8. Authentication, Authorization, and Feature Flags

- The authentication slice and shared Axios interceptor are the session source of truth.
- A 401 outside an authentication endpoint MUST use the single refresh flow; components MUST NOT implement parallel refresh logic.
- A failed refresh MUST clear the session and redirect predictably to `/login`.
- Reuse `ProtectedRoute`, `RequireAdmin`, `RequireAdminOrLeader`, and existing role guards.
- Hiding a button is not authorization. The API remains responsible for enforcing every protected operation.
- A feature flag must consistently protect its route, navigation entry, and related actions.
- Never log access tokens, refresh tokens, passwords, or personal data about sheltered children, guardians, contacts, criminal records, or ministry participants.

## 9. Errors, Observability, and Security

- Preserve the API error envelope and use the existing global error utilities.
- Do not expose stack traces, raw server responses, or technical exception text to end users.
- Expected failures need actionable feedback; unexpected failures need observable reporting without sensitive data.
- Never render untrusted content through `dangerouslySetInnerHTML` without an established sanitizer.
- `VITE_*` variables are embedded in the public bundle and MUST NOT contain secrets.
- Validate uploads and external URLs according to the backend contract, including type and size restrictions.
- Clean up timers, event listeners, subscriptions, and cancellable operations in `useEffect`.
- Do not silently swallow exceptions. Handle them locally or deliberately delegate them to the global handler.

## 10. Tests and Quality Gates

Every behavior change MUST add or update tests in the same delivery.

- Components: rendering, interaction, loading, empty, success, and error states.
- Hooks: state transitions, cleanup, and side effects.
- API modules: method, endpoint, query parameters, payload, and response mapping.
- Protected routes: anonymous user, allowed role, and denied role.
- Forms: valid payload, validation failures, and API failures.
- Bug fixes: add a regression test that fails before the fix.

Use Vitest and Testing Library. Test user-observable behavior instead of implementation details. Mock network, time, and external services; tests MUST NOT call live services. Avoid broad snapshots.

New or changed code should maintain at least 90% coverage in the affected scope, including meaningful branches.

### 10.1 Naming, Imports, and Public Feature APIs

- Feature directories use `kebab-case`.
- React component files use `PascalCase.tsx` and match the exported component name.
- Hooks use `use<Name>.ts`; pure helpers and type files use descriptive `camelCase.ts` names.
- Prefer named exports for feature code. A default export is acceptable where an existing route/page convention already depends on it.
- Use the configured `@/` alias for cross-feature and shared imports; use relative imports within a small feature boundary.
- Avoid deep imports into another feature's internals. Export the intended surface through its `index.ts` when cross-feature use is legitimate.
- Avoid circular barrel exports. Do not create an `index.ts` that imports back through itself.
- Constants must describe meaning and units, for example `AUTH_READY_TIMEOUT_MS`, not `TIMEOUT`.

### 10.2 Routing, Performance, and PWA Safety

- Define routes in the established router composition and apply the correct guard at the route boundary.
- Preserve deep-link and browser back/forward behavior; do not replace navigation with `window.location` except in the established session-failure path.
- Route parameters and query strings are untrusted input and must be parsed and validated before use.
- Lazy-load genuinely heavy route-level code where it improves the bundle; do not fragment small components into unnecessary chunks.
- Use `useMemo`, `useCallback`, and `React.memo` only for measured or structurally clear render costs, not by default.
- Debounce user-driven searches and cancel or ignore stale requests so older responses cannot overwrite newer state.
- Large lists need pagination, virtualization, or an explicit upper bound. Do not render unbounded API results.
- The Vite PWA service worker MUST NOT cache authenticated API responses, access tokens, personal records, or private uploaded content.
- Changes to the PWA manifest, update policy, or cache strategy require an offline/update-path test and explicit review of stale-content behavior.
- Avoid adding large dependencies for behavior that can be implemented safely with the existing stack. Check bundle impact for necessary additions.

### 10.3 Frontend Test Blueprint

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('ShelterAction', () => {
  it('prevents duplicate submissions while the action is pending', async () => {
    const onSubmit = vi.fn(() => new Promise<void>(() => undefined));

    render(<ShelterAction onSubmit={onSubmit} />);
    const button = screen.getByRole('button', { name: /save/i });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });
});
```

Test setup must render the same providers the production component requires. Build small provider helpers instead of copying store/router/theme setup into every test.

## 11. Verification Commands

Run from `orfanatonib-app`:

```bash
NODE_OPTIONS='--max-old-space-size=2048' npm run type-check
NODE_OPTIONS='--max-old-space-size=2048' npm run lint
NODE_OPTIONS='--max-old-space-size=2048' npm test -- --run
NODE_OPTIONS='--max-old-space-size=2048' npm run build
```

Focused checks are acceptable during implementation. Before delivery, run checks proportional to the change scope. Do not run `lint:fix` indiscriminately in a worktree containing unrelated changes.

## 12. Definition of Done

A frontend change is complete only when:

- architecture and API contracts are respected;
- loading, empty, error, success, and permission states are handled;
- mobile behavior and accessibility have been verified;
- no new `any`, secret, sensitive log, or avoidable magic value was introduced;
- applicable tests and documentation were updated;
- relevant type-check, lint, test, and build commands pass;
- the final diff contains only task-related changes.
