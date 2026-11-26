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
  
  try {
    e.currentTarget.removeAttribute('src');
  } catch (err) {
    
    // eslint-disable-next-line no-param-reassign
    e.currentTarget.src = '';
  }
};

type AddressParts = {
  street: string;
  number?: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  complement?: string;
};

/** Duas linhas legíveis do endereço: "Rua, nº" e "Bairro · Cidade - UF". */
export const buildAddressLines = (address: AddressParts) => ({
  line1: [address.street, address.number].filter(Boolean).join(', '),
  line2: [address.district, [address.city, address.state].filter(Boolean).join(' - ')].filter(Boolean).join(' · '),
  postalCode: address.postalCode?.trim() || '',
  complement: address.complement?.trim() || '',
});

/** Link de busca no Google Maps com o endereço completo. */
export const buildMapsUrl = (address: AddressParts): string => {
  const query = [address.street, address.number, address.district, address.city, address.state]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
