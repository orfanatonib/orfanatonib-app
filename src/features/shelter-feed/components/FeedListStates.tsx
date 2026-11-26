import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import type { FeedFilterEmptyStateProps, FeedPaginationFooterProps } from '../componentTypes';
import { FEED_MIN_TOUCH_TARGET_PX, FEED_PAGE_MESSAGES, FEED_PALETTE, FEED_TEST_IDS } from '../constants';

/** Busca sem resultados entre as publicações carregadas. */
export function FeedFilterEmptyState({ onClear }: FeedFilterEmptyStateProps) {
  return (
    <Paper
      data-testid={FEED_TEST_IDS.FILTER_EMPTY_STATE}
      elevation={0}
      sx={{
        maxWidth: 620,
        mx: 'auto',
        my: { xs: 3, md: 5 },
        p: { xs: 3.5, sm: 5 },
        textAlign: 'center',
        borderRadius: 4,
        bgcolor: FEED_PALETTE.canvasElevated,
        border: `1px dashed ${FEED_PALETTE.borderStrong}`,
      }}
    >
      <FilterAltOffOutlinedIcon sx={{ fontSize: 40, color: FEED_PALETTE.inkMuted, mb: 1 }} />
      <Typography component="h2" sx={{ fontSize: '1.2rem', fontWeight: 800, color: FEED_PALETTE.inkPrimary, mb: 0.75 }}>
        {FEED_PAGE_MESSAGES.FILTER_EMPTY_TITLE}
      </Typography>
      <Typography sx={{ color: FEED_PALETTE.inkSecondary, mb: 2.5 }}>
        {FEED_PAGE_MESSAGES.FILTER_EMPTY_DESCRIPTION}
      </Typography>
      <Button
        data-testid={FEED_TEST_IDS.FILTER_EMPTY_CLEAR}
        type="button"
        variant="contained"
        onClick={onClear}
        sx={{
          minHeight: FEED_MIN_TOUCH_TARGET_PX,
          px: 3,
          borderRadius: 99,
          textTransform: 'none',
          fontWeight: 700,
          bgcolor: FEED_PALETTE.brandForest,
          '&:hover': { bgcolor: FEED_PALETTE.brandForestDeep },
        }}
      >
        Limpar filtro
      </Button>
    </Paper>
  );
}

/** Rodapé da lista: erro da próxima página, "carregar mais" (+ sentinela) ou fim do feed. */
export function FeedPaginationFooter({
  hasNextPage,
  isFetchingNextPage,
  nextPageErrorMessage,
  showEnd,
  sentinelRef,
  onLoadMore,
}: FeedPaginationFooterProps) {
  return (
    <Box sx={{ mt: { xs: 4, md: 5 } }}>
      {nextPageErrorMessage && (
        <Alert
          data-testid={FEED_TEST_IDS.NEXT_PAGE_ERROR}
          role="alert"
          severity="warning"
          sx={{ maxWidth: 640, mx: 'auto', mb: 2, borderRadius: 3 }}
          action={
            <Button
              data-testid={FEED_TEST_IDS.NEXT_PAGE_RETRY}
              type="button"
              color="inherit"
              size="small"
              onClick={onLoadMore}
              sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX, fontWeight: 700, textTransform: 'none' }}
            >
              Tentar novamente
            </Button>
          }
        >
          {nextPageErrorMessage}
        </Alert>
      )}
      {hasNextPage && (
        <Stack alignItems="center" spacing={1.5}>
          <Box data-testid={FEED_TEST_IDS.SENTINEL} ref={sentinelRef} sx={{ width: '100%', height: 4 }} />
          <Button
            data-testid={FEED_TEST_IDS.LOAD_MORE_BUTTON}
            type="button"
            variant="outlined"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
            startIcon={isFetchingNextPage ? <CircularProgress size={18} color="inherit" /> : <ExpandMoreRoundedIcon />}
            sx={{
              minHeight: FEED_MIN_TOUCH_TARGET_PX,
              px: 3.5,
              borderRadius: 99,
              textTransform: 'none',
              fontWeight: 700,
              color: FEED_PALETTE.brandForest,
              borderColor: FEED_PALETTE.borderStrong,
              bgcolor: FEED_PALETTE.canvasElevated,
            }}
          >
            {isFetchingNextPage ? 'Carregando publicações...' : 'Carregar mais publicações'}
          </Button>
        </Stack>
      )}
      {showEnd && (
        <Stack
          data-testid={FEED_TEST_IDS.END_OF_FEED}
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ py: 2, opacity: 0.8 }}
        >
          <Box sx={{ width: 48, height: 1, bgcolor: FEED_PALETTE.borderStrong }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: FEED_PALETTE.inkMuted }}>
            {FEED_PAGE_MESSAGES.END_OF_FEED}
          </Typography>
          <Box sx={{ width: 48, height: 1, bgcolor: FEED_PALETTE.borderStrong }} />
        </Stack>
      )}
    </Box>
  );
}
