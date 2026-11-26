import type { Locator } from "@playwright/test";

/**
 * Preenche o campo de data da toolbar (seletor MUI em português, DD/MM/AAAA).
 * Recebe e entrega `AAAA-MM-DD`, como a API; `""` limpa o campo.
 * O `<input>` é mascarado: seleciona tudo e digita só os dígitos (`DDMMAAAA`).
 */
export async function fillDate(input: Locator, iso: string): Promise<void> {
  await input.click();
  await input.press("Control+A");
  if (!iso) {
    await input.press("Backspace");
    return;
  }
  const [year, month, day] = iso.split("-");
  await input.pressSequentially(`${day}${month}${year}`);
}

/**
 * Preenche um `BRDatePicker` (campo MUI X v8 com estrutura acessível: grupo de partes dia/mês/ano,
 * sem `textbox`). Recebe e entrega `AAAA-MM-DD`; `""` limpa. O foco avança sozinho entre as partes.
 */
export async function fillDatePickerGroup(group: Locator, iso: string): Promise<void> {
  const first = group.getByRole("spinbutton").first();
  await first.click();
  if (!iso) {
    await first.press("Control+A");
    await first.press("Backspace");
    return;
  }
  const [year, month, day] = iso.split("-");
  await first.page().keyboard.type(`${day}${month}${year}`);
}
