import { useCallback, useState } from "react";
import {
  apiCreateUser,
  apiDeleteUser,
  apiUpdateUser,
} from "./api";
import {
  CreateUserForm,
  UserRow,
  UpadateUserForm,
} from "./types";
import { digitsOnly } from "@/utils/masks";
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

export function useUserMutations(refreshPage: () => Promise<void> | void) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const createUser = useCallback(async (form: CreateUserForm) => {
    setDialogLoading(true);
    setDialogError("");

    try {
      const { confirmPassword, ...payload } = form;
      await apiCreateUser({ ...payload, phone: digitsOnly(payload.phone) });
      await refreshPage();
    } catch (err: unknown) {
      setDialogError(
        getApiErrorMessage(err, "Erro ao criar usuário")
      );
      throw err;
    } finally {
      setDialogLoading(false);
    }
  }, [refreshPage]);

  const updateUser = useCallback(
    async (id: string, form: Omit<UpadateUserForm, "password"> & { password?: string; confirmPassword?: string }) => {
      setDialogLoading(true);
      setDialogError("");

      try {
        const { confirmPassword, ...payload } = form;
        await apiUpdateUser(id, { ...payload, phone: digitsOnly(payload.phone) });
        await refreshPage();
      } catch (err: unknown) {
        setDialogError(
          getApiErrorMessage(err, "Erro ao atualizar usuário")
        );
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [refreshPage]
  );

  const deleteUser = useCallback(async (id: string) => {
    setDialogLoading(true);
    setDialogError("");

    try {
      await apiDeleteUser(id);
      await refreshPage();
    } catch (err: unknown) {
      setDialogError(
        getApiErrorMessage(err, "Erro ao excluir usuário")
      );
      throw err;
    } finally {
      setDialogLoading(false);
    }
  }, [refreshPage]);

  return {
    dialogLoading,
    dialogError,
    setDialogError,
    createUser,
    updateUser,
    deleteUser,
  };
}
