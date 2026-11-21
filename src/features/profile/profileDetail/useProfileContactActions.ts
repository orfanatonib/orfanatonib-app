import { useEffect, useRef, useState } from 'react';
import { COPIED_FEEDBACK_MS } from './constants';
import type { ProfileCopyField } from './types';
import { buildMailtoUrl, buildWhatsAppUrl } from './utils';

/** Copiar/abrir contato do perfil; o "Copiado!" some sozinho. */
export function useProfileContactActions() {
  const [copied, setCopied] = useState<ProfileCopyField | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = (text: string, field: ProfileCopyField) => {
    void navigator.clipboard.writeText(text);
    setCopied(field);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS);
  };

  const openWhatsApp = (phone?: string) => {
    if (phone) window.open(buildWhatsAppUrl(phone), '_blank');
  };

  const openEmail = (email?: string) => {
    if (email) window.location.href = buildMailtoUrl(email);
  };

  return { copied, copy, openWhatsApp, openEmail };
}
