import * as Yup from "yup";

import { digitsOnly } from "@/utils/masks";
import { isValidEmail, normalizeEmail } from "@/utils/validators";
import {
  REGISTER_VALIDATION,
  REGISTER_VALIDATION_MESSAGES,
} from "@/constants/errors";

export type RegisterRoleChoice = "" | "member" | "leader";

/** Esquema de validação do cadastro (cadastro comum exige confirmação de e-mail e senha). */
export const getRegisterSchema = (commonUser: boolean) =>
  Yup.object({
    name: Yup.string()
      .required(REGISTER_VALIDATION_MESSAGES.NAME_REQUIRED)
      .min(
        REGISTER_VALIDATION.MIN_NAME_LENGTH,
        REGISTER_VALIDATION_MESSAGES.NAME_MIN_LENGTH,
      ),
    email: Yup.string()
      .required(REGISTER_VALIDATION_MESSAGES.EMAIL_REQUIRED)
      .test("valid-email", REGISTER_VALIDATION_MESSAGES.EMAIL_INVALID, (val) =>
        isValidEmail(val),
      ),
    ...(commonUser && {
      confirmEmail: Yup.string()
        .required(REGISTER_VALIDATION_MESSAGES.CONFIRM_EMAIL_REQUIRED)
        .test(
          "emails-match",
          REGISTER_VALIDATION_MESSAGES.EMAILS_NOT_MATCH,
          function (val) {
            const email = (this.parent as { email?: string } | undefined)
              ?.email;
            return normalizeEmail(val) === normalizeEmail(email);
          },
        ),
      password: Yup.string()
        .min(
          REGISTER_VALIDATION.MIN_PASSWORD_LENGTH,
          REGISTER_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
        )
        .required(REGISTER_VALIDATION_MESSAGES.PASSWORD_REQUIRED),
      confirmPassword: Yup.string()
        .oneOf(
          [Yup.ref("password")],
          REGISTER_VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH,
        )
        .required(REGISTER_VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
    }),
    phone: Yup.string()
      .test("len", REGISTER_VALIDATION_MESSAGES.PHONE_INVALID, (val) => {
        const digits = digitsOnly(val);
        if (digits.startsWith("55"))
          return digits.length === 12 || digits.length === 13;
        return digits.length === 10 || digits.length === 11;
      })
      .required(REGISTER_VALIDATION_MESSAGES.PHONE_REQUIRED),
    role: Yup.mixed<RegisterRoleChoice>()
      .oneOf(["member", "leader"])
      .required(
        REGISTER_VALIDATION_MESSAGES.ROLE_REQUIRED,
      ) as Yup.Schema<RegisterRoleChoice>,
  });
