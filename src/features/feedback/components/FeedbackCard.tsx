import { Box, Rating, Stack, Typography } from '@mui/material';
import { Category, CheckCircle, MarkEmailRead, RadioButtonUnchecked, Schedule, Visibility } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import type { AdminCardAction } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import { FeedbackData } from '@/store/slices/feedback/feedbackSlice';
import { FeedbackCategory, FeedbackCategoryLabels } from '@/store/slices/types';
import { FEEDBACK_MAX_RATING, FEEDBACKS_LABELS, FEEDBACKS_TEST_ID_PREFIX } from '../constants';

const P = FEEDBACKS_TEST_ID_PREFIX;

interface Props {
  feedback: FeedbackData;
  onView: (feedback: FeedbackData) => void;
  onMarkRead: (feedback: FeedbackData) => void;
  onDelete: (feedback: FeedbackData) => void;
}

/** Cartão da avaliação: nota em estrelas, tipo (categoria), situação, comentário e data de recebimento. */
export default function FeedbackCard({ feedback, onView, onMarkRead, onDelete }: Props) {
  const id = feedback.id ?? '';
  const categoryLabel = FeedbackCategoryLabels[feedback.category as FeedbackCategory] ?? feedback.category;

  const chips: AdminChipRowItem[] = [
    {
      key: 'status',
      label: feedback.read ? FEEDBACKS_LABELS.READ : FEEDBACKS_LABELS.UNREAD,
      testId: `${P}-card-status-${id}`,
      color: feedback.read ? 'success' : 'warning',
      icon: feedback.read ? <CheckCircle /> : <RadioButtonUnchecked />,
    },
    { key: 'category', label: categoryLabel, testId: `${P}-card-category-${id}`, icon: <Category /> },
    {
      key: 'created',
      label: `${FEEDBACKS_LABELS.RECEIVED_AT} ${formatCreatedDate(feedback.createdAt)}`,
      testId: `${P}-card-created-${id}`,
      icon: <Schedule />,
    },
  ];

  const actions: AdminCardAction[] = [
    {
      key: 'view',
      label: FEEDBACKS_LABELS.VIEW,
      testId: `${P}-card-view-${id}`,
      icon: <Visibility />,
      variant: 'outlined',
      onClick: () => onView(feedback),
    },
  ];
  if (!feedback.read) {
    actions.push({
      key: 'read',
      label: FEEDBACKS_LABELS.MARK_READ,
      testId: `${P}-card-read-${id}`,
      icon: <MarkEmailRead />,
      onClick: () => onMarkRead(feedback),
    });
  }

  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={feedback.name}
      titleTestId={`${P}-card-title-${id}`}
      subtitle={feedback.email || FEEDBACKS_LABELS.NO_EMAIL}
      description={feedback.comment}
      onDelete={() => onDelete(feedback)}
      deleteTestId={`${P}-card-delete-${id}`}
      deleteLabel={FEEDBACKS_LABELS.DELETE}
      meta={
        <Stack spacing={1}>
          <Box data-testid={`${P}-card-rating-${id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={feedback.rating} max={FEEDBACK_MAX_RATING} readOnly size="small" />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {feedback.rating}/{FEEDBACK_MAX_RATING}
            </Typography>
          </Box>
          <AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />
        </Stack>
      }
      actions={actions}
    />
  );
}
