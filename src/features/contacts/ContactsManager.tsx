import { useCallback, useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { ContactPhone } from '@mui/icons-material';
import { useRefreshPendingCounts } from '@/features/admin-pending-counts';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import ContactCard from './components/ContactCard';
import ContactDetailsModal from './components/ContactDetailsModal';
import { fetchContactsPage } from './api';
import {
  CONTACTS_DEFAULT_SORT,
  CONTACTS_LABELS,
  CONTACTS_TEST_ID_PREFIX,
  CONTACT_FILTER_KEYS,
  CONTACT_SORT_OPTIONS,
} from './constants';
import { useContactMutations } from './hooks';
import { ContactReadFilter } from './types';
import type { Contact, SnackbarKind } from './types';

const P = CONTACTS_TEST_ID_PREFIX;
const K = CONTACT_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.READ,
    label: CONTACTS_LABELS.FILTER_STATUS,
    allLabel: CONTACTS_LABELS.FILTER_STATUS_ALL,
    options: [
      { value: ContactReadFilter.UNREAD, label: CONTACTS_LABELS.UNREAD },
      { value: ContactReadFilter.READ, label: CONTACTS_LABELS.READ },
    ],
  },
  { kind: 'date', key: K.CREATED_FROM, label: CONTACTS_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: CONTACTS_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: CONTACTS_LABELS.FILTER_SORT,
    allLabel: null,
    options: CONTACT_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: CONTACTS_DEFAULT_SORT };

export default function ContactsManager() {
  const list = useAdminList<Contact>({
    fetcher: fetchContactsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: CONTACTS_LABELS.LOAD_ERROR,
  });
  const refreshPending = useRefreshPendingCounts();
  const { reload } = list;

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const refetchAll = useCallback(() => {
    reload();
    void refreshPending();
  }, [reload, refreshPending]);
  const { remove, markAsRead } = useContactMutations(refetchAll);

  const [selected, setSelected] = useState<Contact | null>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: SnackbarKind }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: SnackbarKind) =>
    setSnackbar({ open: true, message, severity });

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      showSnackbar(CONTACTS_LABELS.DELETED_OK, 'success');
    } catch {
      showSnackbar(CONTACTS_LABELS.DELETE_ERROR, 'error');
    } finally {
      setToDelete(null);
    }
  };

  const handleMarkAsRead = async (contact: Contact) => {
    try {
      await markAsRead(contact.id);
      showSnackbar(CONTACTS_LABELS.MARKED_OK, 'success');
    } catch {
      showSnackbar(CONTACTS_LABELS.MARK_ERROR, 'error');
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={CONTACTS_LABELS.TITLE}
      searchLabel={CONTACTS_LABELS.SEARCH}
      searchPlaceholder={CONTACTS_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={CONTACTS_LABELS.EMPTY}
      emptyIcon={<ContactPhone sx={{ fontSize: 64, color: 'text.secondary' }} />}
      overlays={
        <>
          <ContactDetailsModal
            contact={selected}
            onClose={() => setSelected(null)}
            onMarkAsRead={() => selected && handleMarkAsRead(selected)}
            onDelete={() => {
              if (selected) setToDelete(selected);
              setSelected(null);
            }}
          />

          <DeleteConfirmDialog
            testId={`${P}-delete-dialog`}
            open={!!toDelete}
            title={toDelete?.name || ''}
            onClose={() => setToDelete(null)}
            onConfirm={handleDelete}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              data-testid={`${P}-snackbar`}
              severity={snackbar.severity}
              variant="filled"
              sx={{ borderRadius: 2 }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onView={setSelected}
            onMarkRead={handleMarkAsRead}
            onDelete={setToDelete}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
