import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { CheckCircleOutline, SendOutlined } from '@mui/icons-material';

import {
  SHELTER_FEED_ROUTE,
  SHELTER_UPLOAD_MESSAGES,
  MyImageSectionsList,
  ShelterMediaEditor,
  TOUCH_TARGET_PX,
  buildSectionFormData,
  buildSectionUpload,
  submitImageSection,
  useMyImageSections,
  validateShelterDraft,
} from '@/features/image-sections';
import type { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { extractErrorMessage } from '@/utils/apiError';

import { MEMBER_AREA_HOME_PATH, MEMBER_CARD_SX } from '../constants/navigation';

const EMPTY_DRAFT: SectionData = { caption: '', description: '', public: false, mediaItems: [] };

/**
 * Envio de fotos e/ou vídeo de um abrigo. O post entra na fila de revisão
 * (nunca publica direto); em caso de erro os arquivos continuam na tela.
 */
export default function ImageSectionPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<SectionData>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mine = useMyImageSections();

  const handleSave = async () => {
    if (isSaving) return;
    const validation = validateShelterDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const { payload, uploads } = buildSectionUpload({
        caption: draft.caption.trim(),
        description: draft.description.trim(),
        mediaItems: draft.mediaItems,
      });
      await submitImageSection(buildSectionFormData(payload, uploads));
      setSubmitted(true);
      setDraft(EMPTY_DRAFT);
      void mine.reload();
    } catch (failure: unknown) {
      setError(extractErrorMessage(failure, SHELTER_UPLOAD_MESSAGES.SEND_FAILED));
    } finally {
      setIsSaving(false);
    }
  };

  if (submitted) {
    return (
      <Stack data-testid="member-photos-page" spacing={2}>
        <Paper
          data-testid="shelter-upload-success"
          variant="outlined"
          sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 3 }}
        >
          <CheckCircleOutline color="success" sx={{ fontSize: 56 }} />
          <Typography component="h2" variant="h5" mt={2} fontWeight={700}>
            Seu momento foi enviado!
          </Typography>
          <Typography color="text.secondary" mt={1}>
            A equipe vai revisar sua publicação. Após a aprovação, ela aparecerá no feed dos abrigos
            com seu nome.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={2} mt={3}>
            <Button
              data-testid="shelter-upload-go-feed"
              type="button"
              variant="contained"
              onClick={() => navigate(SHELTER_FEED_ROUTE)}
              sx={{ minHeight: TOUCH_TARGET_PX }}
            >
              Ir para o feed
            </Button>
            <Button
              data-testid="shelter-upload-send-another"
              type="button"
              variant="outlined"
              onClick={() => setSubmitted(false)}
              sx={{ minHeight: TOUCH_TARGET_PX }}
            >
              Enviar outro momento
            </Button>
          </Stack>
        </Paper>
        <MyImageSectionsList items={mine.items} loading={mine.loading} failed={mine.failed} />
      </Stack>
    );
  }

  return (
    <Stack data-testid="member-photos-page" spacing={{ xs: 2, md: 3 }}>
      <ShelterMediaEditor
        initialCaption={draft.caption}
        initialDescription={draft.description}
        initialMediaItems={draft.mediaItems}
        disabled={isSaving}
        onChange={(changes) => {
          setDraft((current) => ({ ...current, ...changes }));
          setError('');
        }}
      />
      {error && (
        <Alert data-testid="shelter-upload-error" severity="error" role="alert">
          {error}
        </Alert>
      )}
      <Paper
        data-testid="member-photos-actions"
        elevation={0}
        sx={{
          ...MEMBER_CARD_SX,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary" role="status" data-testid="shelter-upload-status">
          {isSaving
            ? 'Enviando arquivos. Aguarde até a confirmação.'
            : 'Tudo pronto? Envie seu registro para a equipe.'}
        </Typography>
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} gap={1.5}>
          <Button
            data-testid="member-photos-cancel"
            variant="outlined"
            color="inherit"
            onClick={() => navigate(MEMBER_AREA_HOME_PATH)}
            disabled={isSaving}
            sx={{ minHeight: TOUCH_TARGET_PX, textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            data-testid="member-photos-submit"
            variant="contained"
            disabled={isSaving}
            onClick={() => void handleSave()}
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SendOutlined />}
            sx={{ minHeight: 48, px: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {isSaving ? 'Enviando…' : 'Enviar para revisão'}
          </Button>
        </Stack>
      </Paper>
      <MyImageSectionsList items={mine.items} loading={mine.loading} failed={mine.failed} />
    </Stack>
  );
}
