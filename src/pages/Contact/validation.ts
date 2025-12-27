import * as Yup from 'yup';
import { isValidEmail } from '@/utils/validators';
import { digitsOnly } from '@/utils/masks';

export const contactFormSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  email: Yup.string()
    .required('Email é obrigatório')
    .test('valid-email', 'Email inválido', (val) => isValidEmail(val)),
  telefone: Yup.string()
    .required('Telefone é obrigatório')
    .test('valid-phone', 'Telefone inválido (ex.: (11) 91234-5678)', (val) => {
      const digits = digitsOnly(val);
      if (digits.startsWith("55")) return digits.length === 12 || digits.length === 13;
      return digits.length === 10 || digits.length === 11;
    }),
  mensagem: Yup.string()
    .required('Mensagem é obrigatória')
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});
