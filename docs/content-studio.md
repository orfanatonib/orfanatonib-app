# Estúdio Orfanato

Production follows the Clubinho workspace pattern: a material list, creation in a
modal, one active stage, collapsible stage navigation, a field editor, document
preview, generation instructions and explicit save/complete/review actions.

New materials choose one audience (`BABY`, `CHILD`, `TEEN`, `ADULT`). The API keeps
legacy requests without `audience` compatible by creating all four tracks.
Existing multi-track packages expose category tabs; no data migration is needed.
The server catalog still owns age ranges, stage order and dependencies.

`ContentStageEditor` edits the structured fields already supported by the worker.
Nested objects and arrays preserve their shape. Administrators no longer need to
write JSON. Preview renders text through React, never raw HTML.
Generation requests use `TEXT_STRUCTURED`, including visual plans, because the
current worker does not persist generated images. This is not image-generation
parity with Clubinho. Publication/PDF and Clubinho's specialized meditation,
cutout and visual editors are not implemented by this change.

Drafts remain separate per stage and are recovered from tab-scoped session
storage. Storage failures are visible. A recovered draft based on a different
server version cannot be saved until discarded/reconciled. Pending generation
refreshes the package periodically without removing the editor from the screen.
The API remains the authority for roles, feature flags and workflow transitions.

Verification: component tests cover structured editing and preview; pure tests
cover parsing and draft recovery. `e2e/live/content-studio/content-studio.ui.spec.ts`
creates an adult material through the real UI, edits a stage, switches stages,
checks persistence through the API and archives its package afterward. It does
not call a paid AI provider.
