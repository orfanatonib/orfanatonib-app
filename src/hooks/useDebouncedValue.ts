import { useEffect, useState } from "react";

/** O valor só "assenta" depois de `delayMs` sem mudar (busca que dispara a consulta ao parar de digitar). */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
