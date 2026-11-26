import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { CONTACTS_ENDPOINT } from './constants';
import type { Contact } from './types';

/** Página de contatos filtrada, ordenada e paginada no servidor. */
export const fetchContactsPage: AdminListFetcher<Contact> = (params, signal) =>
  fetchAdminPage<Contact>(CONTACTS_ENDPOINT, params, signal);

export async function apiDeleteContact(id: string) {
  await api.delete(`${CONTACTS_ENDPOINT}/${id}`);
}

export async function apiMarkAsRead(id: string) {
  await api.patch(`${CONTACTS_ENDPOINT}/${id}/read`);
}
