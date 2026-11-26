import { IconButton, Tooltip } from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { PERSON_LABELS, PERSON_TOUCH_TARGET_PX } from './constants';

interface Props {
  href: string | null;
  testId: string;
}

/** Abre a conversa no WhatsApp; desabilitado quando a pessoa não tem telefone. */
export default function PersonWhatsAppButton({ href, testId }: Props) {
  return (
    <Tooltip title={href ? PERSON_LABELS.WHATSAPP : PERSON_LABELS.NO_PHONE}>
      <span>
        <IconButton
          color="success"
          component="a"
          href={href || undefined}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!href}
          aria-label={PERSON_LABELS.WHATSAPP_ARIA}
          data-testid={testId}
          sx={{ width: PERSON_TOUCH_TARGET_PX, height: PERSON_TOUCH_TARGET_PX }}
        >
          <WhatsApp />
        </IconButton>
      </span>
    </Tooltip>
  );
}
