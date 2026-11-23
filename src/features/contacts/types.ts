export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt?: string;
};

export type SnackbarKind = 'success' | 'error';

/** Valores do filtro de situação, na forma que a API recebe em `read`. */
export enum ContactReadFilter {
  READ = 'true',
  UNREAD = 'false',
}
