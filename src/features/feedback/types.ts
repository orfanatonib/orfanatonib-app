export type SnackbarKind = 'success' | 'error';

/** Valores do filtro de situação, na forma que a API recebe em `read`. */
export enum FeedbackReadFilter {
  READ = 'true',
  UNREAD = 'false',
}
