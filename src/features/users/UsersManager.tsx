import React from "react";
import { Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { SearchOff } from "@mui/icons-material";

import { AdminTableListScreen, useAdminList } from "@/components/common/admin-shell";
import UserCard from "./components/UserCard";
import { buildUsersColumns } from "./components/usersColumns";
import UserViewDialog from "./components/UserViewDialog";
import UserCreateDialog from "./components/UserCreateDialog";
import UserEditDialog from "./components/UserEditDialog";

import { CreateUserForm, UserRow, UpadateUserForm } from "./types";
import { useUserMutations } from "./hooks";
import { UserRole } from "@/store/slices/auth/authSlice";
import { apiGetUserProfile } from "./api";
import { normalizeName } from "@/utils/textUtils";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import {
  USERS_DEFAULT_SORT,
  USERS_FILTER_FIELDS,
  USERS_FILTER_KEYS,
  USERS_LABELS,
  USERS_TEST_ID_PREFIX,
} from "./constants";
import { fetchUsersPage } from "./utils";

export default function UsersManager() {
  const loggedName = useSelector((state: RootState) => state.auth.user?.name);

  const list = useAdminList<UserRow>({
    fetcher: fetchUsersPage,
    defaultFilters: { [USERS_FILTER_KEYS.SORT]: USERS_DEFAULT_SORT },
    errorMessage: USERS_LABELS.LOAD_ERROR,
  });

  const { dialogLoading, dialogError, setDialogError, createUser, updateUser, deleteUser } =
    useUserMutations(list.reload);

  const [viewing, setViewing] = React.useState<UserRow | null>(null);

  const [editing, setEditing] = React.useState<
    (UpadateUserForm & { id: string; confirmPassword?: string; editPassword?: boolean }) | null
  >(null);

  const [creating, setCreating] = React.useState<CreateUserForm | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<UserRow | null>(null);

  const onCreateConfirm = async () => {
    if (!creating) return;
    if (creating.password !== (creating.confirmPassword || "")) {
      setDialogError("As senhas não coincidem.");
      return;
    }
    await createUser({ ...creating, name: normalizeName(creating.name || "") });
    setCreating(null);
  };

  const onEditConfirm = async () => {
    if (!editing?.id) return;

    const wantsPassword = !!editing.editPassword;

    if (wantsPassword) {
      if (!editing.password) {
        setDialogError("Informe a nova senha.");
        return;
      }
      if (editing.password !== editing.confirmPassword) {
        setDialogError("As senhas não coincidem.");
        return;
      }
    }

    const { id, confirmPassword, editPassword, ...rest } = editing;

    // `password` é opcional no envio: só vai quando o admin quis trocá-la.
    const payload: Omit<UpadateUserForm, "password"> & { password?: string } = {
      ...rest,
      name: rest.name != null ? normalizeName(rest.name || "") : rest.name,
    };
    if (!wantsPassword || !payload.password) {
      delete payload.password;
    }

    await updateUser(id, payload);
    setEditing(null);
  };

  const onDeleteConfirm = async () => {
    if (!confirmDelete?.id) return;
    await deleteUser(confirmDelete.id);
    setConfirmDelete(null);
  };

  const openEdit = (user: UserRow) => {
      setEditing({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        active: user.active,
        completed: user.completed,
        commonUser: user.commonUser,
        password: "",
        confirmPassword: "",
        editPassword: false,
      });

      if (user.role === UserRole.MEMBER) {
        (async () => {
          try {
            const profile = await apiGetUserProfile(user.id);
            const team = profile.memberProfile?.team;
            const label = team
              ? `Equipe ${team.numberTeam} - ${team.shelter?.name ?? "—"}`
              : null;

            setEditing((prev) =>
              prev && prev.id === user.id
                ? {
                  ...prev,
                  memberTeamId: team?.id ?? null,
                  initialMemberTeamId: team?.id ?? null,
                  memberTeamLabel: label,
                }
                : prev
            );
          } catch {
            // falha em carregar equipe não deve impedir edição do usuário
          }
        })();
      }
  };

  const columns = React.useMemo(
    () => buildUsersColumns({ loggedName, onView: setViewing, onEdit: openEdit, onDelete: setConfirmDelete }),
    // openEdit só usa setters estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedName],
  );

  return (
    <AdminTableListScreen
      testIdPrefix={USERS_TEST_ID_PREFIX}
      title={USERS_LABELS.TITLE}
      searchLabel={USERS_LABELS.SEARCH}
      searchPlaceholder={USERS_LABELS.SEARCH_PLACEHOLDER}
      fields={USERS_FILTER_FIELDS}
      list={list}
      emptyMessage={USERS_LABELS.EMPTY}
      emptyIcon={<SearchOff sx={{ fontSize: 56, color: "text.disabled" }} />}
      columns={columns}
      rowKey={(u) => u.id}
      renderCard={(u) => (
        <UserCard user={u} loggedName={loggedName} onView={setViewing} onEdit={openEdit} onDelete={setConfirmDelete} />
      )}
      primaryAction={
        <Button
          variant="contained"
          startIcon={<Add />}
          fullWidth
          data-testid="users-create-button"
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
          onClick={() =>
            setCreating({
              name: "",
              email: "",
              password: "",
              confirmPassword: "",
              phone: "",
              role: UserRole.MEMBER,
            })
          }
        >
          {USERS_LABELS.CREATE}
        </Button>
      }
      overlays={
        <>
          <UserViewDialog open={!!viewing} user={viewing} onClose={() => setViewing(null)} />

          <UserCreateDialog
            open={!!creating}
            value={creating}
            onChange={(v) => setCreating(v)}
            loading={dialogLoading}
            error={dialogError}
            onCancel={() => { setCreating(null); setDialogError(""); }}
            onConfirm={onCreateConfirm}
          />

          <UserEditDialog
            open={!!editing}
            value={editing}
            onChange={(v) => setEditing((prev) => (prev ? { ...prev, ...v } : null))}
            loading={dialogLoading}
            error={dialogError}
            onCancel={() => { setEditing(null); setDialogError(""); }}
            onConfirm={onEditConfirm}
          />

          <DeleteConfirmDialog
            open={!!confirmDelete}
            title={confirmDelete?.name || "Usuário"}
            onClose={() => setConfirmDelete(null)}
            onConfirm={onDeleteConfirm}
          />
        </>
      }
    />
  );
}
