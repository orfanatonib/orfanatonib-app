import { useState } from 'react';
import api from '@/config/axiosConfig';
import { ContactFormData } from './types';
import { digitsOnly } from '@/utils/masks';
import { normalizeEmail } from '@/utils/validators';
import { CONTACT_ERROR_MESSAGES } from '@/constants/errors';

export const useContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const onSubmit = async (data: ContactFormData): Promise<boolean> => {
    setLoading(true);
    setSubmitted(false);
    setGlobalError(null);
    try {
      await api.post('/contact', {
        name: data.name,
        email: normalizeEmail(data.email),
        phone: digitsOnly(data.telefone),
        message: data.mensagem,
        website: data.website ?? '',
      });
      setSubmitted(true);
      return true;
    } catch (error) {
      setGlobalError(CONTACT_ERROR_MESSAGES.SUBMIT_GENERIC);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitted,
    globalError,
    onSubmit,
  };
};
