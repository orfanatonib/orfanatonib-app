// Utilitários locais do ShelterPageView (avatars, fallback de imagem)
export const safeImgUrl = (url?: string | null) => {
  const u = (url || '').trim();
  return u.length ? u : undefined;
};

export const getInitials2 = (fullName?: string | null) => {
  const name = (fullName || '').trim();
  if (!name) return '';
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (first + last).toUpperCase();
};

export const makeImgErrorHandler = () => (e: React.SyntheticEvent<HTMLImageElement>) => {
  // remove src attribute so Avatar renders children (iniciais)
  try {
    e.currentTarget.removeAttribute('src');
  } catch (err) {
    // fallback: clear src string
    // eslint-disable-next-line no-param-reassign
    e.currentTarget.src = '';
  }
};
