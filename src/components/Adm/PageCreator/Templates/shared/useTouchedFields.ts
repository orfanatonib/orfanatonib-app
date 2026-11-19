import { useCallback, useState } from 'react';
import type { PageBasicInfoTouched } from './types';

const UNTOUCHED: PageBasicInfoTouched = { title: false, subtitle: false, description: false };

/** Estado "tocado" dos campos comuns (título/descrição) do formulário. */
export function useTouchedFields() {
  const [touched, setTouched] = useState<PageBasicInfoTouched>(UNTOUCHED);

  const setField = useCallback((field: keyof PageBasicInfoTouched, value: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: value }));
  }, []);

  const touchAll = useCallback(() => setTouched({ title: true, subtitle: true, description: true }), []);
  const reset = useCallback(() => setTouched(UNTOUCHED), []);

  return { touched, setField, touchAll, reset };
}
