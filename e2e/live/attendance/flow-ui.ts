import type { Page } from "@playwright/test";
import { expect } from "../support/live";
import { fillDatePickerGroup } from "../support/date-field";

/** Digita a data no seletor MUI X (grupo de partes dia/mês/ano): só dígitos, na ordem DD/MM/AAAA. */
export async function typeDate(page: Page, testId: string, br: string): Promise<void> {
  const [day, month, year] = br.split("/");
  await fillDatePickerGroup(page.getByTestId(testId), `${year}-${month}-${day}`);
}

/** Abre o formulário de novo agendamento (botão do desktop ou FAB do celular). */
export async function openNewSchedule(page: Page, mobile: boolean): Promise<void> {
  await page.getByTestId(mobile ? "schedule-new-fab" : "schedule-new").click();
  await expect(page.getByTestId("schedule-form-dialog")).toBeVisible();
}

/** Preenche e envia o formulário de agendamento; a equipe é escolhida pelo texto da opção, se houver mais de uma. */
export async function fillSchedule(
  page: Page,
  input: { teamLabel?: RegExp; visitNumber: number; lesson: string; visitBr: string; meetingBr: string },
): Promise<void> {
  if (input.teamLabel) {
    await page.getByTestId("schedule-form-team").click();
    await page.getByRole("option", { name: input.teamLabel }).click();
    await expect(page.getByRole("listbox")).toBeHidden();
  }
  const number = page.getByTestId("schedule-form-visit-number");
  await number.fill(String(input.visitNumber));
  await page.getByTestId("schedule-form-lesson").fill(input.lesson);
  await typeDate(page, "schedule-form-meeting-date", input.meetingBr);
  await typeDate(page, "schedule-form-visit-date", input.visitBr);
  await page.getByTestId("schedule-form-submit").click();
  await expect(page.getByTestId("schedule-form-dialog")).toBeHidden({ timeout: 20_000 });
}
