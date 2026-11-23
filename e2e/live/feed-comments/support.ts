import type { APIRequestContext } from "@playwright/test";

import { postComment } from "../shelter-feed/comments-moderation-helpers";

const RATE_WINDOW_MS = 62_000;

/** O envio é limitado a 5 por autor por minuto (429): espera a janela passar e tenta de novo, uma vez. */
export async function postCommentPaced(
  request: APIRequestContext,
  token: string,
  sectionId: string,
  content: string,
): Promise<string> {
  try {
    return await postComment(request, token, sectionId, content);
  } catch (error) {
    if (!String(error).includes("429")) throw error;
    await new Promise((resolve) => setTimeout(resolve, RATE_WINDOW_MS));
    return postComment(request, token, sectionId, content);
  }
}
