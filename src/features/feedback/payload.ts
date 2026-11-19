/** Corpo aceito por `POST /site-feedbacks` (a API recusa qualquer outro campo com 400). */
export interface SiteFeedbackPayload {
  name: string;
  email?: string;
  rating: number;
  comment: string;
  category: string;
}

export interface SiteFeedbackFormValues {
  name: string;
  email: string;
  rating: number;
  comment: string;
  category: string;
}

/** Só os campos do contrato; e-mail em branco vira ausente (a API o valida como e-mail quando existe). */
export function buildSiteFeedbackPayload(values: SiteFeedbackFormValues): SiteFeedbackPayload {
  const email = values.email.trim();
  return {
    name: values.name.trim(),
    ...(email ? { email } : {}),
    rating: values.rating,
    comment: values.comment,
    category: values.category,
  };
}
