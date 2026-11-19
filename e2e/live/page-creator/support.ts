import type { APIRequestContext, Page } from "@playwright/test";
import { API_URL } from "../../../playwright.live.config";
import { authHeaders, loginAs } from "../support/live";

export { PNG_1X1 } from "../support/media-scenarios";

export const FAKE_MP4 = Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex");

export interface CapturedForm {
  fields: Record<string, string>;
  files: string[];
}

/** Registra o último FormData enviado por XHR (o Playwright não expõe corpo multipart com arquivo). */
export async function captureFormData(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function patched(body?: Document | XMLHttpRequestBodyInit | null) {
      if (body instanceof FormData) {
        const form: { fields: Record<string, string>; files: string[] } = { fields: {}, files: [] };
        body.forEach((value, key) => {
          if (typeof value === "string") form.fields[key] = value;
          else form.files.push(key);
        });
        (window as unknown as { __capturedForm: typeof form }).__capturedForm = form;
      }
      return original.call(this, body);
    };
  });
}

export async function readCapturedForm(page: Page): Promise<CapturedForm> {
  return page.evaluate(
    () => (window as unknown as { __capturedForm: CapturedForm }).__capturedForm,
  );
}

export const parseJsonField = <T>(form: CapturedForm, field: string): T =>
  JSON.parse(form.fields[field]) as T;

export async function openCreator(page: Page, cardTestId: string): Promise<void> {
  await page.goto("/adm/criar-pagina");
  await page.getByTestId(cardTestId).click();
}

export async function deletePage(
  request: APIRequestContext,
  resource: string,
  id: string,
): Promise<void> {
  const admin = await loginAs(request, "admin");
  await request.delete(`${API_URL}/${resource}/${id}`, { headers: authHeaders(admin.accessToken) });
}
