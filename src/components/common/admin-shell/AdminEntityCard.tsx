import { Box, Button, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Delete, Lock, Public } from '@mui/icons-material';
import { ADMIN_DELETE_COLOR, ADMIN_LABELS, ADMIN_TOUCH_TARGET_PX } from './constants';
import type { AdminEntityCardProps } from './types';
import { resolveCardTitle } from './utils';

const CLAMP_SX = (lines: number) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

/** Cartão padrão: selo + lixeira no topo, capa, texto e ações empilhadas no mobile. */
export default function AdminEntityCard({
  testId,
  title,
  titleTestId,
  subtitle,
  description,
  cover,
  visibility,
  meta,
  onDelete,
  deleteTestId,
  deleteLabel = ADMIN_LABELS.DELETE,
  actions = [],
}: AdminEntityCardProps) {
  const shownTitle = resolveCardTitle(title);
  const hasHeader = Boolean(visibility) || Boolean(onDelete);

  return (
    <Card
      data-testid={testId}
      variant="outlined"
      sx={{
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
        transition: 'transform .2s, box-shadow .2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
      }}
    >
      {hasHeader ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pl: 1.5,
            pr: 0.5,
            minHeight: ADMIN_TOUCH_TARGET_PX + 4,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          {visibility ? (
            <Chip
              data-testid={visibility.testId}
              icon={visibility.isPublic ? <Public fontSize="small" /> : <Lock fontSize="small" />}
              label={visibility.label}
              size="small"
              color={visibility.isPublic ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <span />
          )}
          {onDelete ? (
            <Tooltip title={deleteLabel}>
              <IconButton
                data-testid={deleteTestId}
                aria-label={`${deleteLabel}: ${shownTitle}`}
                onClick={onDelete}
                sx={{
                  width: ADMIN_TOUCH_TARGET_PX,
                  height: ADMIN_TOUCH_TARGET_PX,
                  color: ADMIN_DELETE_COLOR,
                  flexShrink: 0,
                }}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      ) : null}

      {cover ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {cover}
        </Box>
      ) : null}

      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1.5 }}>
        <Typography
          data-testid={titleTestId}
          variant="subtitle1"
          fontWeight={700}
          title={shownTitle}
          gutterBottom
          sx={{ ...CLAMP_SX(2), overflowWrap: 'anywhere' }}
        >
          {shownTitle}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ ...CLAMP_SX(1), mb: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
        {description ? (
          <Typography variant="body2" color="text.secondary" title={description} sx={CLAMP_SX(3)}>
            {description}
          </Typography>
        ) : null}
        {meta ? <Box sx={{ mt: 1 }}>{meta}</Box> : null}
      </CardContent>

      {actions.length > 0 ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ p: 2, pt: 0, width: '100%', '& .MuiButton-root': { minHeight: ADMIN_TOUCH_TARGET_PX } }}
        >
          {actions.map((action) => (
            <Button
              key={action.key}
              data-testid={action.testId}
              aria-label={action.ariaLabel}
              variant={action.variant ?? 'contained'}
              startIcon={action.icon}
              onClick={action.onClick}
              fullWidth
              sx={{ flex: 1, ml: 0 }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      ) : null}
    </Card>
  );
}
