import { createTheme } from '@mui/material/styles';
import { gradients } from './gradients';

// Cores personalizadas
const colors = {
  primary: '#FFFF00',    // Amarelo
  secondary: '#000000',  // Preto
  success: '#009933',    // Verde
  error: '#FF0000',      // Vermelho
  warning: '#FFFF00',    // Amarelo
  info: '#009933',       // Verde
  background: {
    default: '#FFFFFF',  // Branco
    paper: '#FFFFFF',    // Branco
  },
  text: {
    primary: '#000000',  // Preto
    secondary: '#666666', // Cinza escuro
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      light: '#FFFF66',
      dark: '#CCCC00',
      contrastText: colors.secondary,
    },
    secondary: {
      main: colors.secondary,
      light: '#333333',
      dark: '#000000',
      contrastText: colors.primary,
    },
    success: {
      main: colors.success,
      light: '#33CC66',
      dark: '#006600',
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.error,
      light: '#FF6666',
      dark: '#CC0000',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colors.warning,
      light: '#FFFF66',
      dark: '#CCCC00',
      contrastText: colors.secondary,
    },
    info: {
      main: colors.info,
      light: '#33CC66',
      dark: '#006600',
      contrastText: '#FFFFFF',
    },
    background: colors.background,
    text: colors.text,
    grey: colors.grey,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: colors.secondary,
      fontWeight: 700,
    },
    h2: {
      color: colors.secondary,
      fontWeight: 600,
    },
    h3: {
      color: colors.secondary,
      fontWeight: 600,
    },
    h4: {
      color: colors.secondary,
      fontWeight: 600,
    },
    h5: {
      color: colors.secondary,
      fontWeight: 600,
    },
    h6: {
      color: colors.secondary,
      fontWeight: 600,
    },
    body1: {
      color: colors.text.primary,
    },
    body2: {
      color: colors.text.secondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        containedPrimary: {
          backgroundColor: colors.primary,
          color: colors.secondary,
          '&:hover': {
            backgroundColor: '#CCCC00',
            boxShadow: '0 4px 12px rgba(255, 255, 0, 0.3)',
          },
        },
        containedSecondary: {
          backgroundColor: colors.secondary,
          color: colors.primary,
          '&:hover': {
            backgroundColor: '#333333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          },
        },
        containedSuccess: {
          backgroundColor: colors.success,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#006600',
            boxShadow: '0 4px 12px rgba(0, 153, 51, 0.3)',
          },
        },
        containedError: {
          backgroundColor: colors.error,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#CC0000',
            boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
          },
        },
        containedWarning: {
          backgroundColor: colors.warning,
          color: colors.secondary,
          '&:hover': {
            backgroundColor: '#CCCC00',
            boxShadow: '0 4px 12px rgba(255, 255, 0, 0.3)',
          },
        },
        containedInfo: {
          backgroundColor: colors.info,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#006600',
            boxShadow: '0 4px 12px rgba(0, 153, 51, 0.3)',
          },
        },
        outlinedPrimary: {
          borderColor: colors.primary,
          color: colors.primary,
          '&:hover': {
            borderColor: '#CCCC00',
            backgroundColor: 'rgba(255, 255, 0, 0.08)',
          },
        },
        outlinedSecondary: {
          borderColor: colors.secondary,
          color: colors.secondary,
          '&:hover': {
            borderColor: '#333333',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
        textPrimary: {
          color: colors.primary,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 0, 0.08)',
          },
        },
        textSecondary: {
          color: colors.secondary,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
        colorPrimary: {
          backgroundColor: colors.primary,
          color: colors.secondary,
        },
        colorSecondary: {
          backgroundColor: colors.secondary,
          color: colors.primary,
        },
        colorSuccess: {
          backgroundColor: colors.success,
          color: '#FFFFFF',
        },
        colorError: {
          backgroundColor: colors.error,
          color: '#FFFFFF',
        },
        colorWarning: {
          backgroundColor: colors.warning,
          color: colors.secondary,
        },
        colorInfo: {
          backgroundColor: colors.info,
          color: '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.secondary,
          color: colors.primary,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.grey[200]}`,
          '&:hover': {
            boxShadow: `0 4px 20px rgba(255, 255, 0, 0.15)`,
            borderColor: colors.primary,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
        },
        elevation1: {
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
        },
        elevation2: {
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.15)`,
        },
        elevation3: {
          boxShadow: `0 6px 24px rgba(0, 0, 0, 0.2)`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: colors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
            },
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: colors.primary,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: colors.primary,
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: colors.primary,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: colors.primary,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: colors.primary,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root.Mui-selected': {
            color: colors.primary,
          },
          '& .MuiTabs-indicator': {
            backgroundColor: colors.primary,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 0, 0.2)',
        },
        bar: {
          backgroundColor: colors.primary,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.primary,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 0, 0.08)',
          },
        },
        colorPrimary: {
          color: colors.primary,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 0, 0.12)',
          },
        },
        colorSecondary: {
          color: colors.secondary,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          backgroundColor: colors.primary,
          color: colors.secondary,
          '&:hover': {
            backgroundColor: '#CCCC00',
            boxShadow: '0 6px 16px rgba(255, 255, 0, 0.4)',
          },
        },
        secondary: {
          backgroundColor: colors.secondary,
          color: colors.primary,
          '&:hover': {
            backgroundColor: '#333333',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: 'rgba(0, 153, 51, 0.1)',
          color: colors.success,
          border: `1px solid ${colors.success}`,
        },
        standardError: {
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: colors.error,
          border: `1px solid ${colors.error}`,
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 255, 0, 0.1)',
          color: colors.secondary,
          border: `1px solid ${colors.warning}`,
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 153, 51, 0.1)',
          color: colors.info,
          border: `1px solid ${colors.info}`,
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            backgroundColor: colors.secondary,
            color: colors.primary,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: `1px solid ${colors.primary}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: colors.primary,
          color: colors.secondary,
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.grey[100],
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 0, 0.04)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: colors.secondary,
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            '&.Mui-selected': {
              backgroundColor: colors.primary,
              color: colors.secondary,
              '&:hover': {
                backgroundColor: '#CCCC00',
              },
            },
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          '& .MuiBreadcrumbs-separator': {
            color: colors.primary,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: colors.primary,
          '&:hover': {
            color: '#CCCC00',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.grey[200]}`,
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          '&.Mui-expanded': {
            backgroundColor: 'rgba(255, 255, 0, 0.04)',
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-root.Mui-active': {
            color: colors.primary,
          },
          '& .MuiStepIcon-root.Mui-completed': {
            color: colors.success,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-thumb': {
            '&:hover': {
              boxShadow: `0 0 0 8px rgba(255, 255, 0, 0.16)`,
            },
          },
          '& .MuiSlider-track': {
            backgroundColor: colors.primary,
          },
          '& .MuiSlider-rail': {
            backgroundColor: colors.grey[300],
          },
        },
      },
    },
  },
});

export default theme;
export { gradients };
