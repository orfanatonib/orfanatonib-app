import { PersonOutline, Save } from "@mui/icons-material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import GppGood from "@mui/icons-material/GppGood";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import UnsavedChangesDialog from "@/components/common/modal/UnsavedChangesDialog";
import { readStudioSnapshot, resolveStudioStorage } from "@/features/ai-lessons/draftStorage";
import { usePersistedStudioState, useStudioUserId } from "@/features/ai-lessons/usePersistedStudioState";
import { useStudioUnsavedChanges } from "@/features/ai-lessons/useStudioUnsavedChanges";
import type { RootState } from "@/store/slices";
import { getHttpStatus } from "@/utils/apiError";

import { CONTENT_STUDIO_SAFETY_GUIDELINES, CONTENT_STAGE_TYPE_LABELS } from "../constants";
import { PromptResetDialog } from "../guidelines/components/PromptResetDialog";
import { PromptStageEditor } from "../guidelines/components/PromptStageEditor";
import { PromptStageTabs } from "../guidelines/components/PromptStageTabs";
import { getPromptPreferences, resetPromptPreference, savePromptPreference } from "../guidelines/api";
import { PROMPT_STALE_TIME_MS, PROMPT_STORAGE_PREFIX, PROMPT_STORAGE_SCOPE, PROMPT_TEXTS } from "../guidelines/constants";
import {
  acknowledgePromptDraft,
  editPromptDraft,
  hasDuplicatedBasePrompt,
  isPersistedPromptDrafts,
  isPromptDraftOutdated,
  isValidComplementaryPrompt,
  rebasePromptDraft,
  resolveEffectivePromptPreview,
  resolvePromptDraftValue,
  restorePromptDrafts,
  toPersistedPromptDrafts,
} from "../guidelines/drafts";
import {
  PromptFeedbackSeverity,
  type PersistedPromptDrafts,
  type PromptAudienceDrafts,
  type PromptFeedback,
  type PromptLocalDrafts,
  type PromptPreference,
  type SavePromptVariables,
} from "../guidelines/types";
import { firstName, isClearingSavedPrompt, promptCustomisationSummary, promptSavedLabel, promptSummaryLabel, promptValidationMessage } from "../guidelines/utils";
import { useContentStudioCatalog } from "../hooks/useContentStudioCatalog";
import { ContentAudience, ContentStageType } from "../types";
import { formatAudienceAgeRange } from "../utils";

const preferencesKey = (userId: string, audience: ContentAudience) => ["content-studio", "prompt-preferences", userId, audience] as const;

/**
 * Orientações de criação (`/adm/estudio/orientacoes`).
 *
 * Cada administrador escreve, por faixa etária e por etapa, o que quer acrescentar às regras oficiais que a IA
 * recebe. A personalização é de quem está logado: a API a guarda por usuário e a aplica às gerações que ele dispara.
 */
export function ContentStudioGuidelinesPage() {
  const client = useQueryClient();
  const { catalog, loading: catalogLoading, error: catalogError, reload: reloadCatalog } = useContentStudioCatalog();
  const sessionUserId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const userName = useSelector((state: RootState) => state.auth.user?.name ?? "");
  // Fixo: sessão expirada não pode parecer "outro usuário" e apagar os rascunhos.
  const userId = useStudioUserId() || sessionUserId || "";

  const audiences = catalog?.audiences ?? [];
  const [audienceChoice, setAudienceChoice] = useState<ContentAudience | null>(null);
  const audience = audienceChoice ?? audiences[0]?.audience ?? ContentAudience.CHILD;
  const audienceInfo = audiences.find((item) => item.audience === audience);
  const [stage, setStage] = useState<ContentStageType>(ContentStageType.LESSON);
  const [audienceDrafts, setAudienceDrafts] = useState<PromptAudienceDrafts>({});
  const drafts = audienceDrafts[audience] ?? {};
  const setDrafts = (update: (current: PromptLocalDrafts) => PromptLocalDrafts) => setAudienceDrafts((all) => ({ ...all, [audience]: update(all[audience] ?? {}) }));
  const [resetOpen, setResetOpen] = useState(false);
  const [feedback, setFeedback] = useState<PromptFeedback | null>(null);

  // Rascunhos guardados no navegador: só o texto digitado; são reconstruídos quando as orientações carregam.
  const storageKey = userId ? `${PROMPT_STORAGE_PREFIX}:${userId}:${PROMPT_STORAGE_SCOPE}` : "";
  const [persisted, setPersisted] = useState<PersistedPromptDrafts | null>(null);
  const [restoredAudiences, setRestoredAudiences] = useState<ContentAudience[]>([]);
  const [loadedKey, setLoadedKey] = useState("");
  const [recovered, setRecovered] = useState(false);
  useEffect(() => {
    setAudienceDrafts({});
    setFeedback(null);
    setRestoredAudiences([]);
    setRecovered(false);
    setPersisted(storageKey ? readStudioSnapshot(resolveStudioStorage(), storageKey, isPersistedPromptDrafts) : null);
    setLoadedKey(storageKey);
  }, [storageKey]);

  const query = useQuery({
    queryKey: preferencesKey(userId, audience),
    queryFn: ({ signal }) => getPromptPreferences(audience, signal),
    staleTime: PROMPT_STALE_TIME_MS,
    enabled: Boolean(catalog),
  });

  useEffect(() => {
    if (!query.data || loadedKey !== storageKey || restoredAudiences.includes(audience)) return;
    const restored = restorePromptDrafts(persisted?.[audience], query.data);
    if (Object.keys(restored).length) {
      setAudienceDrafts((all) => ({ ...all, [audience]: { ...restored, ...all[audience] } }));
      setRecovered(true);
    }
    setRestoredAudiences((current) => [...current, audience]);
  }, [audience, loadedKey, persisted, query.data, restoredAudiences, storageKey]);

  const persistedDrafts = useMemo(() => {
    const live = toPersistedPromptDrafts(audienceDrafts);
    const result: PersistedPromptDrafts = {};
    for (const item of Object.values(ContentAudience)) {
      // Faixa já reconstruída na tela pertence aos rascunhos vivos, não ao que estava guardado.
      const source = restoredAudiences.includes(item) ? live[item] : persisted?.[item];
      if (source && Object.keys(source).length) result[item] = source;
    }
    return result;
  }, [audienceDrafts, persisted, restoredAudiences]);
  usePersistedStudioState(loadedKey === storageKey && restoredAudiences.includes(audience) ? storageKey : "", persistedDrafts);

  const preference = query.data?.find((item) => item.stage === stage);
  const value = resolvePromptDraftValue(drafts[stage], preference);
  const dirty = Boolean(drafts[stage]);
  const dirtyCount = Object.values(audienceDrafts).reduce((total, items) => total + Object.keys(items ?? {}).length, 0);
  const leaveGuard = useStudioUnsavedChanges(dirtyCount > 0);
  const draftOutdated = isPromptDraftOutdated(drafts[stage], preference);

  const updateList = (saved: PromptPreference) =>
    client.setQueryData<PromptPreference[]>(preferencesKey(userId, audience), (items = []) => items.map((item) => (item.stage === saved.stage ? saved : item)));

  const save = useMutation({
    mutationFn: ({ item, draft }: SavePromptVariables) => savePromptPreference(audience, item.stage, draft.value.trim(), draft.base.lockVersion),
    onSuccess: (saved, sent) => {
      updateList(saved);
      setDrafts((current) => acknowledgePromptDraft(current, sent.draft, saved));
      setFeedback({ severity: PromptFeedbackSeverity.SUCCESS, text: PROMPT_TEXTS.saved });
    },
    onError: (error) => {
      const conflict = getHttpStatus(error) === 409;
      if (conflict) void client.invalidateQueries({ queryKey: preferencesKey(userId, audience) });
      setFeedback({ severity: PromptFeedbackSeverity.ERROR, text: conflict ? PROMPT_TEXTS.conflict : PROMPT_TEXTS.saveError });
    },
  });

  const reset = useMutation({
    mutationFn: ({ item, draft }: SavePromptVariables) => resetPromptPreference(audience, item.stage, draft.base.lockVersion),
    onSuccess: (saved, sent) => {
      updateList(saved);
      // Voltar ao padrão também descarta o texto digitado e não salvo desta etapa.
      setDrafts((current) => {
        const next = { ...acknowledgePromptDraft(current, sent.draft, saved) };
        delete next[saved.stage];
        return next;
      });
      setResetOpen(false);
      setFeedback({ severity: PromptFeedbackSeverity.SUCCESS, text: PROMPT_TEXTS.restored });
    },
    onError: (error) => {
      setResetOpen(false);
      const conflict = getHttpStatus(error) === 409;
      if (conflict) void client.invalidateQueries({ queryKey: preferencesKey(userId, audience) });
      setFeedback({ severity: PromptFeedbackSeverity.ERROR, text: conflict ? PROMPT_TEXTS.resetConflict : PROMPT_TEXTS.resetError });
    },
  });

  const changePrompt = (text: string) => {
    if (!preference) return;
    setDrafts((current) => ({ ...current, [stage]: editPromptDraft(current[stage], preference, text) }));
    setFeedback(null);
  };
  const discardCurrentDraft = () => {
    setDrafts((current) => {
      const next = { ...current };
      delete next[stage];
      return next;
    });
    setFeedback(null);
    save.reset();
  };
  const rebaseCurrentDraft = () => {
    if (!preference) return;
    setDrafts((current) => (current[stage] ? { ...current, [stage]: rebasePromptDraft(current[stage]!, preference) } : current));
    setFeedback(null);
    save.reset();
  };
  const insertPreset = (presetText: string) => {
    const separator = value && !value.endsWith("\n") && !presetText.startsWith("\n") ? "\n" : "";
    changePrompt(`${value}${separator}${presetText}`);
  };

  const otherAudience = audiences.find((item) => item.audience !== audience)?.audience;
  const busy = save.isPending || reset.isPending;
  const clearing = isClearingSavedPrompt(value, preference);
  const validationMessage = promptValidationMessage(value);
  const canSave = dirty && isValidComplementaryPrompt(value) && !draftOutdated && !busy;
  const savedLabel = preference?.customPrompt ? promptSavedLabel(preference.updatedAt) : "";
  const summary = promptCustomisationSummary(query.data);

  const saveCurrentPrompt = () => {
    const draft = drafts[stage];
    if (preference && draft && isValidComplementaryPrompt(draft.value)) save.mutate({ item: preference, draft });
  };

  // Ctrl+S (ou ⌘S) salva a etapa aberta, como em qualquer editor.
  const saveShortcut = useRef(() => {});
  saveShortcut.current = () => {
    if (canSave) saveCurrentPrompt();
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveShortcut.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectAudience = (next: ContentAudience) => {
    setAudienceChoice(next);
    setStage(ContentStageType.LESSON);
    setFeedback(null);
    setResetOpen(false);
  };

  return (
    <Box component="section" data-testid="content-studio-guidelines-page" sx={{ pb: { xs: 10, sm: 0 } }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1.5}>
          {/* O ponto que mais confunde: a personalização é de quem está logado, não do sistema. */}
          <Alert data-testid="admin-prompts-personal-notice" severity="info" icon={<PersonOutline />} sx={{ borderRadius: 2.5, flex: 1 }}>
            <AlertTitle sx={{ fontWeight: 800 }}>
              {PROMPT_TEXTS.personalTitle}
              {firstName(userName) ? `, ${firstName(userName)}` : ""}
            </AlertTitle>
            {PROMPT_TEXTS.personalBody}
          </Alert>
          {dirtyCount > 0 && (
            <Chip
              data-testid="admin-prompts-pending-count"
              color="warning"
              label={`${dirtyCount} ${dirtyCount === 1 ? "etapa com texto não salvo" : "etapas com texto não salvo"}`}
              sx={{ fontWeight: 800, borderRadius: 2, flexShrink: 0 }}
            />
          )}
        </Stack>

        {catalogLoading && (
          <Stack data-testid="content-studio-guidelines-loading" alignItems="center" spacing={2} py={4}>
            <CircularProgress />
            <Typography color="text.secondary">Carregando faixas etárias…</Typography>
          </Stack>
        )}
        {!catalogLoading && catalogError && (
          <Alert
            severity="error"
            data-testid="content-studio-guidelines-error"
            action={
              <Button color="inherit" onClick={() => void reloadCatalog()} sx={{ minHeight: 44 }}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar as faixas editoriais.
          </Alert>
        )}

        {catalog && (
          <>
            <Box>
              <ToggleButtonGroup
                data-testid="admin-prompts-category-selector"
                aria-label="Faixa etária das orientações"
                exclusive
                value={audience}
                disabled={busy}
                onChange={(_, next: ContentAudience | null) => {
                  if (next) selectAudience(next);
                }}
                sx={{ flexWrap: "wrap" }}
              >
                {audiences.map((item) => (
                  <ToggleButton
                    key={item.audience}
                    value={item.audience}
                    data-testid={`admin-prompts-category-${item.audience.toLowerCase()}`}
                    sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}
                  >
                    {item.name}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {audienceInfo && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  {formatAudienceAgeRange(audienceInfo)}
                  {otherAudience ? " · as orientações são separadas por faixa etária" : ""}
                </Typography>
              )}
            </Box>

            {query.isLoading ? (
              <Box data-testid="admin-prompts-loading" aria-busy="true" aria-label="Carregando orientações">
                <Skeleton variant="rounded" height={48} sx={{ borderRadius: 3, mb: 2 }} />
                <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />
              </Box>
            ) : query.isError ? (
              <Alert
                data-testid="admin-prompts-error"
                severity="error"
                sx={{ borderRadius: 3 }}
                action={
                  <Button color="inherit" size="small" onClick={() => void query.refetch()}>
                    Tentar novamente
                  </Button>
                }
              >
                {PROMPT_TEXTS.loadError}
              </Alert>
            ) : (
              <Stack gap={2}>
                <Box>
                  <PromptStageTabs
                    stage={stage}
                    preferences={query.data ?? []}
                    drafts={drafts}
                    onChange={(next) => {
                      setStage(next);
                      setFeedback(null);
                    }}
                  />
                  <Typography data-testid="admin-prompts-summary" variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, px: 0.5 }}>
                    {promptSummaryLabel(summary)}
                  </Typography>
                </Box>
                {preference && (
                  <PromptStageEditor
                    stage={stage}
                    audienceLabel={audienceInfo?.name ?? audience}
                    preference={preference}
                    value={value}
                    effectivePreview={resolveEffectivePromptPreview(preference, value)}
                    dirty={dirty}
                    clearing={clearing}
                    canSave={canSave}
                    busy={busy}
                    saving={save.isPending}
                    resetting={reset.isPending}
                    validationMessage={validationMessage}
                    savedLabel={savedLabel}
                    hasBaseDuplication={hasDuplicatedBasePrompt(value, preference.basePrompt)}
                    recovered={recovered}
                    draftOutdated={draftOutdated}
                    feedback={feedback}
                    onChange={changePrompt}
                    onInsertPreset={insertPreset}
                    onSave={saveCurrentPrompt}
                    onDiscard={discardCurrentDraft}
                    onRebase={rebaseCurrentDraft}
                    onOpenReset={() => setResetOpen(true)}
                    onDismissRecovered={() => setRecovered(false)}
                  />
                )}
              </Stack>
            )}
          </>
        )}

        <Accordion variant="outlined" disableGutters data-testid="content-studio-safety-guidelines" sx={{ borderRadius: 3, "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <GppGood color="success" fontSize="small" />
              <Typography fontWeight={700}>Segurança em todo material (regras fixas)</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {CONTENT_STUDIO_SAFETY_GUIDELINES.map((guideline) => (
                <ListItem key={guideline} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <GppGood color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={guideline} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* No celular o botão de salvar acompanha a rolagem enquanto há texto não salvo. */}
      {preference && dirty && !clearing && (
        <Paper
          elevation={4}
          sx={{
            display: { xs: "flex", sm: "none" },
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            p: 1.5,
            px: 2,
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
            borderTop: "1px solid",
            borderColor: "divider",
            zIndex: 1100,
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="warning.main" textAlign="center">
            {validationMessage ?? PROMPT_TEXTS.pending}
          </Typography>
          <Button
            data-testid="admin-prompts-save-mobile"
            variant="contained"
            startIcon={<Save />}
            disabled={!canSave}
            onClick={saveCurrentPrompt}
            fullWidth
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", minHeight: 44 }}
          >
            {save.isPending ? PROMPT_TEXTS.saving : PROMPT_TEXTS.save}
          </Button>
        </Paper>
      )}

      <PromptResetDialog
        open={resetOpen}
        stageLabel={`${CONTENT_STAGE_TYPE_LABELS[stage]} (${audienceInfo?.name ?? audience})`}
        hasUnsavedText={dirty && !clearing}
        pending={reset.isPending}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          if (preference) reset.mutate({ item: preference, draft: drafts[stage] ?? { base: preference, value } });
        }}
      />
      <UnsavedChangesDialog {...leaveGuard.dialog} />
    </Box>
  );
}
