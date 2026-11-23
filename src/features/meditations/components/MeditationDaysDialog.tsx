import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { type DayItem, type MeditationData, type WeekDay, WeekDayLabel } from '@/store/slices/meditation/meditationSlice';
import { MEDITATIONS_LABELS, MEDITATIONS_TEST_ID_PREFIX } from '../constants';

interface Props {
  meditation: MeditationData | null;
  onClose: () => void;
  onDayClick: (day: DayItem) => void;
}

const WEEK_ORDER = Object.keys(WeekDayLabel);
const orderOf = (day: string) => WEEK_ORDER.indexOf(day);

const ID = `${MEDITATIONS_TEST_ID_PREFIX}-days-dialog`;

/** Dias da meditação num diálogo (em vez do cartão que expandia por cima da grade). */
export default function MeditationDaysDialog({ meditation, onClose, onDayClick }: Props) {
  return (
    <Dialog data-testid={ID} open={!!meditation} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle data-testid={`${ID}-title`} fontWeight={700}>
        {MEDITATIONS_LABELS.DAYS_DIALOG_TITLE}
        <Typography variant="body2" color="text.secondary">{meditation?.topic}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          {[...(meditation?.days ?? [])].sort((a, b) => orderOf(String(a.day)) - orderOf(String(b.day))).map((day) => (
            <Box
              key={day.id}
              data-testid={`${ID}-day-${day.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                p: 1,
                pl: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={600}>{WeekDayLabel[day.day as WeekDay] ?? day.day}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{day.topic}</Typography>
              </Box>
              <Tooltip title={MEDITATIONS_LABELS.DAY_DETAIL}>
                <IconButton
                  data-testid={`${ID}-view-${day.id}`}
                  aria-label={`${MEDITATIONS_LABELS.DAY_DETAIL}: ${WeekDayLabel[day.day as WeekDay] ?? day.day}`}
                  onClick={() => onDayClick(day)}
                  sx={{ width: 44, height: 44 }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button data-testid={`${ID}-close`} onClick={onClose}>{MEDITATIONS_LABELS.CLOSE}</Button>
      </DialogActions>
    </Dialog>
  );
}
