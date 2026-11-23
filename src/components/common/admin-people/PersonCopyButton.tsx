import { IconButton, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { logger } from '@/utils/logger';
import { PERSON_TOUCH_TARGET_PX } from './constants';

interface Props {
  value?: string;
  title: string;
  testId: string;
}

/** Copia o valor para a área de transferência (alvo de toque de 44px). */
export default function PersonCopyButton({ value, title, testId }: Props) {
  const copy = () => {
    if (!value) return;
    navigator.clipboard
      ?.writeText(String(value))
      .catch((error: unknown) => logger.warn('Clipboard write failed', undefined, error));
  };

  return (
    <Tooltip title={title}>
      <IconButton
        size="small"
        onClick={copy}
        aria-label={title}
        data-testid={testId}
        sx={{ width: PERSON_TOUCH_TARGET_PX, height: PERSON_TOUCH_TARGET_PX, flexShrink: 0 }}
      >
        <ContentCopy fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
