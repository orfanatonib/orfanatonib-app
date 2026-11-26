import { Backdrop, CircularProgress } from '@mui/material';

interface LoadingProps {
  open: boolean;
}

export function LoadingSpinner({ open }: LoadingProps) {
  return (
    <Backdrop data-testid="image-page-saving" open={open} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
