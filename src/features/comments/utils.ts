export const debounce = <TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 300,
) => {
  let t: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: TArgs) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => { if (t) clearTimeout(t); t = undefined; };
  return debounced;
};
