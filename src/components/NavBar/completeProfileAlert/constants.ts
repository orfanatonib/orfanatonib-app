import type { SxProps, Theme } from '@mui/material';

export const NOTIFICATION_COLOR = '#FFD600';
export const NOTIFICATION_MUTED_COLOR = 'rgba(255, 255, 0, 0.7)';
export const NOTIFICATION_FAINT_COLOR = 'rgba(255, 255, 0, 0.5)';

export const LEADER_PENDINGS_ROUTE = '/adm/presenca/pendencias';
export const VISIT_REPORT_PENDINGS_ROUTE = '/adm/relatorios/pendencias';

/** Intervalo antes de fechar o diálogo após registrar (o usuário lê a confirmação). */
export const FEEDBACK_CLOSE_DELAY_MS = 2000;

export const ALERT_TEXTS = {
  tooltipWithAlerts: 'Você tem notificações',
  tooltipEmpty: 'Notificações',
  menuTitle: 'Notificações',
  empty: 'Nenhuma notificação',
  pendingsTitle: 'Pendências de presença',
  pendingsDialogTitleMobile: 'Pendências',
  visitReportsTitle: 'Relatórios pendentes',
  clickToView: 'Clique para visualizar',
  selectEvent: 'Selecione um evento para registrar sua presença:',
  registerTitle: 'Registrar presença',
  present: 'Presente',
  absent: 'Falta',
  absenceReasonLabel: 'Motivo da falta',
  absenceReasonPlaceholder: 'Descreva o motivo (opcional)',
  cancel: 'Cancelar',
  noDate: 'Data a definir',
  visit: 'Visita',
  meeting: 'Reunião',
} as const;

export const NOTIFICATION_ITEM_SX: SxProps<Theme> = {
  px: 2,
  py: 1.5,
  color: NOTIFICATION_COLOR,
  borderLeft: '3px solid transparent',
  whiteSpace: 'normal',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  maxWidth: '100%',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 0, 0.1)',
    borderLeftColor: NOTIFICATION_COLOR,
  },
};

export const NOTIFICATION_SCROLLBAR_SX = {
  '&::-webkit-scrollbar': { width: '10px' },
  '&::-webkit-scrollbar-track': { background: 'rgba(255, 255, 0, 0.05)' },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 0, 0.2)',
    borderRadius: '5px',
    '&:hover': { background: 'rgba(255, 255, 0, 0.4)' },
  },
} as const;

export const MENU_PAPER_SX = {
  mt: 1.5,
  minWidth: 320,
  maxWidth: 380,
  maxHeight: '75vh',
  bgcolor: '#1a1a1a',
  border: '1px solid rgba(255, 255, 0, 0.3)',
  borderRadius: 2,
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  ...NOTIFICATION_SCROLLBAR_SX,
} as const;
