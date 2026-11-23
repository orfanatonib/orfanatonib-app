import { Avatar, Box, Link, Stack, Typography } from '@mui/material';
import { AlternateEmail, PhoneIphone } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import type { AdminCardAction } from '@/components/common/admin-shell';
import { initials } from '@/utils/textUtils';
import { PERSON_LABELS, PERSON_TOUCH_TARGET_PX } from './constants';
import PersonCopyButton from './PersonCopyButton';
import PersonWhatsAppButton from './PersonWhatsAppButton';
import type { PersonCardProps } from './types';

const ROW_SX = { minHeight: PERSON_TOUCH_TARGET_PX, minWidth: 0 } as const;
const DELETE_KEY = 'delete';

/**
 * Cartão de pessoa do mobile, montado sobre o `AdminEntityCard` padrão: avatar + nome, selos,
 * contato com cópia e WhatsApp, conteúdo da entidade e ações com rótulo (44px).
 * A ação `delete` vira a lixeira do cabeçalho do cartão.
 */
export default function PersonCard({
  testIdPrefix,
  id,
  name,
  email,
  phone,
  avatarColor,
  badges,
  children,
  footnote,
  whatsappHref,
  actions,
}: PersonCardProps) {
  const del = actions.find((action) => action.key === DELETE_KEY);
  const cardActions: AdminCardAction[] = actions
    .filter((action) => action.key !== DELETE_KEY)
    .map((action) => ({
      key: action.key,
      label: action.label,
      ariaLabel: action.ariaLabel,
      icon: action.icon,
      onClick: action.onClick,
      testId: `${testIdPrefix}-${action.key}-${id}`,
      variant: 'outlined',
    }));

  return (
    <AdminEntityCard
      testId={`${testIdPrefix}-${id}`}
      title={name}
      titleTestId={`${testIdPrefix}-title-${id}`}
      avatar={
        <Avatar sx={{ bgcolor: avatarColor, color: 'white', fontWeight: 700, width: 48, height: 48 }}>
          {initials(name)}
        </Avatar>
      }
      onDelete={del?.onClick}
      deleteTestId={`${testIdPrefix}-${DELETE_KEY}-${id}`}
      deleteLabel={del?.label}
      actions={cardActions}
      meta={
        <Box>
          {badges ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              {badges}
            </Stack>
          ) : null}
          {email ? (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={ROW_SX}>
              <AlternateEmail sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
              <Typography
                variant="body2"
                title={email}
                data-testid={`${testIdPrefix}-email-${id}`}
                sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}
              >
                {email}
              </Typography>
              <PersonCopyButton value={email} title={PERSON_LABELS.COPY_EMAIL} testId={`${testIdPrefix}-copy-email-${id}`} />
            </Stack>
          ) : null}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={ROW_SX}>
            <PhoneIphone sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
            {phone ? (
              <Link
                href={`tel:${phone}`}
                underline="hover"
                color="text.primary"
                data-testid={`${testIdPrefix}-phone-${id}`}
                sx={{ flex: 1, minWidth: 0, fontSize: '0.875rem' }}
              >
                {phone}
              </Link>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {PERSON_LABELS.NO_PHONE}
              </Typography>
            )}
            {phone ? (
              <PersonCopyButton value={phone} title={PERSON_LABELS.COPY_PHONE} testId={`${testIdPrefix}-copy-phone-${id}`} />
            ) : null}
            <PersonWhatsAppButton href={whatsappHref} testId={`${testIdPrefix}-whatsapp-${id}`} />
          </Stack>
          {children ? <Box sx={{ pt: 0.5 }}>{children}</Box> : null}
          {footnote ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pt: 1 }}>
              {footnote}
            </Typography>
          ) : null}
        </Box>
      }
    />
  );
}
