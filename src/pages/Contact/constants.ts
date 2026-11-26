/** Os mesmos limites do `CreateContactDto` da API: passar disso viraria um erro genérico no envio. */
export const CONTACT_LIMITS = {
  NAME_MAX: 255,
  EMAIL_MAX: 255,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 5000,
} as const;
