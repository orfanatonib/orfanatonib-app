import { useEffect, useState, type BaseSyntheticEvent } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
  type SubmitHandler,
  type UseFormSetValue,
} from "react-hook-form";
import { useSelector } from "react-redux";

import { REGISTER_ERROR_MESSAGES } from "@/constants/errors";
import type { RootState } from "@/store/slices";

import { apiCompleteRegister, apiRegister } from "./api";
import { cacheGoogleUser, clearGoogleUserCache, getGoogleUserCache } from "./googleUserCache";
import { REGISTER_DEFAULT_VALUES } from "./register.constants";
import type { RegisterFormData } from "./register.types";
import { getRegisterSchema } from "./registerSchema";
import {
  mapRegisterApiError,
  toCompleteRegisterRequest,
  toRegisterRequest,
} from "./registerUtils";
import type { RegisterResponse, ShelterTeamOption } from "./types";
import { useRegisterTeams } from "./useRegisterTeams";

export interface UseRegisterForm {
  control: Control<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  isValid: boolean;
  setValue: UseFormSetValue<RegisterFormData>;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
  loading: boolean;
  success: boolean;
  globalError: string | null;
  emailVerificationSent: boolean;
  isMemberSelected: boolean;
  teams: ShelterTeamOption[];
  loadingTeams: boolean;
}

/**
 * Estado e regras do cadastro: formulário validado, preenchimento vindo do Google,
 * lista de equipes e envio. A tela só desenha o que este hook devolve.
 */
export function useRegisterForm(commonUser: boolean): UseRegisterForm {
  const googleUser = useSelector((state: RootState) => state.auth.googleUser);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(getRegisterSchema(commonUser)) as unknown as Resolver<RegisterFormData>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: REGISTER_DEFAULT_VALUES,
  });

  const isMemberSelected = watch("role") === "member";
  const { teams, loading: loadingTeams } = useRegisterTeams(isMemberSelected);

  // Complemento do Google: nome e e-mail vêm da sessão do Google (ou do cache da aba).
  useEffect(() => {
    if (commonUser) return;

    if (googleUser?.email || googleUser?.name) {
      if (googleUser.email) setValue("email", googleUser.email);
      if (googleUser.name) setValue("name", googleUser.name);
      if (googleUser.email && googleUser.name) {
        cacheGoogleUser(googleUser.name, googleUser.email);
      }
      return;
    }

    const cached = getGoogleUserCache();
    if (cached) {
      setValue("email", cached.email);
      setValue("name", cached.name);
    }
  }, [googleUser, commonUser, setValue]);

  useEffect(() => {
    if (success && !commonUser) clearGoogleUserCache();
  }, [success, commonUser]);

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setLoading(true);
    setGlobalError(null);
    try {
      const request = toRegisterRequest(data, commonUser);
      let response: RegisterResponse;
      if (commonUser) {
        response = await apiRegister(request);
      } else {
        // O token só existe em memória: sem ele (recarregou a página) não há
        // como provar a posse da conta Google, e a API recusaria.
        const completionToken = googleUser?.completionToken;
        if (!completionToken) {
          setGlobalError(REGISTER_ERROR_MESSAGES.GOOGLE_SESSION_EXPIRED);
          return;
        }
        response = await apiCompleteRegister(toCompleteRegisterRequest(request, completionToken));
      }
      setEmailVerificationSent(Boolean(response.emailVerification?.verificationEmailSent));
      setSuccess(true);
    } catch (error: unknown) {
      setGlobalError(mapRegisterApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return {
    control,
    errors,
    isValid,
    setValue,
    submit: handleSubmit(onSubmit),
    loading,
    success,
    globalError,
    emailVerificationSent,
    isMemberSelected,
    teams,
    loadingTeams,
  };
}
