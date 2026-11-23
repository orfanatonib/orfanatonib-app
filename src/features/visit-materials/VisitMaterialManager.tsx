import { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { Inventory2 } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AppDispatch } from '@/store/slices';
import { setVisitMaterialData } from 'store/slices/visit-material/visitMaterialSlice';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

import { deleteVisitMaterial, fetchVisitMaterialsPage, setCurrentMaterial } from './api';
import VisitMaterialDetailsModal from './components/VisitMaterialDetailsModal';
import SetCurrentMaterialConfirmDialog from './components/SetCurrentMaterialConfirmDialog';
import VisitMaterialCard from './components/VisitMaterialCard';
import {
  VISIT_MATERIALS_DEFAULT_SORT,
  VISIT_MATERIALS_LABELS,
  VISIT_MATERIALS_TEST_ID_PREFIX,
  VISIT_MATERIAL_ADMIN_SORT_OPTIONS,
  VISIT_MATERIAL_CATEGORY_LABELS,
  VISIT_MATERIAL_CURRENT_OPTIONS,
  VISIT_MATERIAL_FILTER_KEYS,
  VISIT_MATERIAL_MESSAGES,
  VISIT_MATERIAL_PUBLIC_OPTIONS,
  VISIT_MATERIAL_SECTION_CATEGORIES,
  VISIT_MATERIAL_TESTAMENT_LABELS,
} from './constants';
import { visitMaterialErrorMessage } from './errors';
import { TestamentType, VisitMaterialMutation, VisitMaterialPageResponseDto } from './types';

const P = VISIT_MATERIALS_TEST_ID_PREFIX;
const K = VISIT_MATERIAL_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.TESTAMENT,
    label: VISIT_MATERIALS_LABELS.FILTER_TESTAMENT,
    allLabel: VISIT_MATERIALS_LABELS.FILTER_TESTAMENT_ALL,
    options: Object.values(TestamentType).map((value) => ({ value, label: VISIT_MATERIAL_TESTAMENT_LABELS[value] })),
  },
  {
    kind: 'select',
    key: K.CATEGORY,
    label: VISIT_MATERIALS_LABELS.FILTER_CATEGORY,
    allLabel: VISIT_MATERIALS_LABELS.FILTER_CATEGORY_ALL,
    options: VISIT_MATERIAL_SECTION_CATEGORIES.map((value) => ({ value, label: VISIT_MATERIAL_CATEGORY_LABELS[value] })),
  },
  {
    kind: 'select',
    key: K.PUBLIC,
    label: VISIT_MATERIALS_LABELS.FILTER_PUBLIC,
    allLabel: VISIT_MATERIALS_LABELS.FILTER_PUBLIC_ALL,
    options: VISIT_MATERIAL_PUBLIC_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  {
    kind: 'select',
    key: K.CURRENT_WEEK,
    label: VISIT_MATERIALS_LABELS.FILTER_CURRENT,
    allLabel: VISIT_MATERIALS_LABELS.FILTER_CURRENT_ALL,
    options: VISIT_MATERIAL_CURRENT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  { kind: 'date', key: K.CREATED_FROM, label: VISIT_MATERIALS_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: VISIT_MATERIALS_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: VISIT_MATERIALS_LABELS.FILTER_SORT,
    allLabel: null,
    options: VISIT_MATERIAL_ADMIN_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: VISIT_MATERIALS_DEFAULT_SORT };

export default function VisitMaterialManager() {
  const list = useAdminList<VisitMaterialPageResponseDto>({
    fetcher: fetchVisitMaterialsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: VISIT_MATERIAL_MESSAGES.LIST_ERROR,
  });

  const [materialToDelete, setMaterialToDelete] = useState<VisitMaterialPageResponseDto | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<VisitMaterialPageResponseDto | null>(null);
  const [materialToSetAsCurrent, setMaterialToSetAsCurrent] = useState<VisitMaterialPageResponseDto | null>(null);
  const [pendingMutation, setPendingMutation] = useState<VisitMaterialMutation | null>(null);
  const [actionError, setActionError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleEdit = (material: VisitMaterialPageResponseDto) => {
    dispatch(setVisitMaterialData(material));
    navigate(`/adm/editar-pagina-visita?id=${material.id}`);
  };

  const handleDelete = async () => {
    if (!materialToDelete || pendingMutation) return;
    setPendingMutation(VisitMaterialMutation.DELETE);
    setActionError('');
    try {
      await deleteVisitMaterial({ id: materialToDelete.id });
      setMaterialToDelete(null);
      list.reload();
    } catch (caught: unknown) {
      setActionError(visitMaterialErrorMessage(caught, VISIT_MATERIAL_MESSAGES.DELETE_ERROR));
      setMaterialToDelete(null);
    } finally {
      setPendingMutation(null);
    }
  };

  const handleSetAsCurrentMaterial = async () => {
    if (!materialToSetAsCurrent || pendingMutation) return;
    setPendingMutation(VisitMaterialMutation.SET_CURRENT);
    setActionError('');
    try {
      await setCurrentMaterial({ id: materialToSetAsCurrent.id });
      setMaterialToSetAsCurrent(null);
      list.reload();
      await dispatch(fetchRoutes());
    } catch (caught: unknown) {
      setActionError(visitMaterialErrorMessage(caught, VISIT_MATERIAL_MESSAGES.SET_CURRENT_ERROR));
      setMaterialToSetAsCurrent(null);
    } finally {
      setPendingMutation(null);
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={VISIT_MATERIALS_LABELS.TITLE}
      searchLabel={VISIT_MATERIALS_LABELS.SEARCH}
      searchPlaceholder={VISIT_MATERIALS_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={VISIT_MATERIALS_LABELS.EMPTY}
      emptyIcon={<Inventory2 sx={{ fontSize: 64, color: 'text.secondary' }} />}
      overlays={
        <>
          <DeleteConfirmDialog
            open={!!materialToDelete}
            title={materialToDelete?.title}
            onClose={() => setMaterialToDelete(null)}
            onConfirm={handleDelete}
            loading={pendingMutation === VisitMaterialMutation.DELETE}
            testId="visit-material-delete-dialog"
          />

          <VisitMaterialDetailsModal
            material={selectedMaterial}
            open={!!selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
          />

          <SetCurrentMaterialConfirmDialog
            open={!!materialToSetAsCurrent}
            materialTitle={materialToSetAsCurrent?.title || ''}
            onClose={() => setMaterialToSetAsCurrent(null)}
            onConfirm={handleSetAsCurrentMaterial}
            loading={pendingMutation === VisitMaterialMutation.SET_CURRENT}
          />

          <Snackbar
            open={!!actionError}
            autoHideDuration={6000}
            onClose={() => setActionError('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              data-testid={`${P}-action-error`}
              severity="error"
              variant="filled"
              onClose={() => setActionError('')}
              sx={{ borderRadius: 2 }}
            >
              {actionError}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((material) => (
          <VisitMaterialCard
            key={material.id}
            material={material}
            onView={() => setSelectedMaterial(material)}
            onEdit={() => handleEdit(material)}
            onDelete={() => setMaterialToDelete(material)}
            onSetAsCurrent={() => setMaterialToSetAsCurrent(material)}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
