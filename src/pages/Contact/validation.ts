import * as Yup from 'yup';
import { isValidEmail } from '@/utils/validators';
import { digitsOnly } from '@/utils/masks';
import { CONTACT_LIMITS } from './constants';

export const contactFormSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(CONTACT_LIMITS.NAME_MAX, `Nome deve ter no máximo ${CONTACT_LIMITS.NAME_MAX} caracteres`)
    .matches(/^[A-Za-zÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  email: Yup.string()
    .required('Email é obrigatório')
    .max(CONTACT_LIMITS.EMAIL_MAX, `Email deve ter no máximo ${CONTACT_LIMITS.EMAIL_MAX} caracteres`)
    .test('valid-email', 'Email inválido', (val) => isValidEmail(val)),
  telefone: Yup.string()
    .required('Telefone é obrigatório')
    .test('valid-phone', 'Telefone inválido (ex.: (11) 91234-5678)', (val) => {
      const digits = digitsOnly(val);
      if (digits.startsWith("55")) return digits.length === 12 || digits.length === 13;
      return digits.length === 10 || digits.length === 11;
    }),
  mensagem: Yup.string()
    .trim()
    .required('Mensagem é obrigatória')
    .min(CONTACT_LIMITS.MESSAGE_MIN, `Mensagem deve ter pelo menos ${CONTACT_LIMITS.MESSAGE_MIN} caracteres`)
    .max(CONTACT_LIMITS.MESSAGE_MAX, `Mensagem deve ter no máximo ${CONTACT_LIMITS.MESSAGE_MAX} caracteres`),
});
