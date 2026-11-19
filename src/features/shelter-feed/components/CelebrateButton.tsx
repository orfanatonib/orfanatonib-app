import { Box, Button, Typography } from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import { FEED_MESSAGES, FEED_MIN_TOUCH_TARGET_PX } from '../constants';
import { useCelebration } from '../hooks';
import { formatCelebrationCount } from '../utils';

interface CelebrateButtonProps {
  sectionId: string;
  initialCount: number;
  initialCelebratedByMe: boolean;
  viewerId: string;
}

/** Reação de um clique: alterna a celebração do usuário, com contagem e rollback em erro. */
export default function CelebrateButton({
  sectionId,
  initialCount,
  initialCelebratedByMe,
  viewerId,
}: CelebrateButtonProps) {
  const { state, toggle, isPending, hasError } = useCelebration(
    { sectionId, count: initialCount, celebratedByMe: initialCelebratedByMe },
    viewerId,
  );

  return (
    <Box>
      <Button
        data-testid="shelter-feed-celebrate-button"
        variant={state.celebratedByMe ? 'contained' : 'outlined'}
        color="success"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={state.celebratedByMe}
        aria-busy={isPending}
        aria-label={`${
          state.celebratedByMe ? FEED_MESSAGES.uncelebrateAria : FEED_MESSAGES.celebrateAria
        }. ${formatCelebrationCount(state.count)}`}
        startIcon={state.celebratedByMe ? <CelebrationIcon /> : <CelebrationOutlinedIcon />}
        sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX, minWidth: FEED_MIN_TOUCH_TARGET_PX }}
      >
        {state.celebratedByMe ? FEED_MESSAGES.celebratedState : FEED_MESSAGES.celebrateAction}
        <Box
          component="span"
          data-testid="shelter-feed-celebration-count"
          sx={{ ml: 1, fontWeight: 'bold' }}
        >
          {state.count}
        </Box>
      </Button>
      {hasError && (
        <Typography
          data-testid="shelter-feed-celebrate-error"
          role="alert"
          variant="caption"
          color="error"
          display="block"
          mt={0.5}
        >
          {FEED_MESSAGES.celebrateError}
        </Typography>
      )}
    </Box>
  );
}
