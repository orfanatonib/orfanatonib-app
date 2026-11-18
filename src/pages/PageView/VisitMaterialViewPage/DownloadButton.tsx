import { Button, useTheme, useMediaQuery } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface DownloadButtonProps {
  url: string;
  filename?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export default function DownloadButton({ 
  url, 
  filename, 
  disabled = false, 
  size = 'medium',
  fullWidth = false 
}: DownloadButtonProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          py: { xs: 0.5, md: 0.75 },
          px: { xs: 1.5, md: 2 },
          fontSize: { xs: '0.75rem', md: '0.8rem' },
          minHeight: { xs: 32, md: 36 },
        };
      case 'large':
        return {
          py: { xs: 1.5, md: 2 },
          px: { xs: 3, md: 4 },
          fontSize: { xs: '1rem', md: '1.1rem' },
          minHeight: { xs: 44, md: 48 },
        };
      default: 
        return {
          py: { xs: 1, md: 1.25 },
          px: { xs: 2, md: 2.5 },
          fontSize: { xs: '0.9rem', md: '1rem' },
          minHeight: { xs: 40, md: 44 },
        };
    }
  };

  return (
    <Button
      data-testid="visit-media-download"
      variant="outlined"
      startIcon={<DownloadIcon sx={{ fontSize: { xs: '1rem', md: '1.2rem' } }} />}
      href={url}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      disabled={disabled}
      fullWidth={fullWidth}
      sx={{ ...getSizeStyles(), textTransform: 'none', fontWeight: 600 }}
    >
      Baixar
    </Button>
  );
}
