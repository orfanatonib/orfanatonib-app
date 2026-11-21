import type { Page } from "@playwright/test";

import { expect } from "./live";

/** Viewport mínimo (px) para que o botão de ação de um card ocupe a largura útil em 375px. */
export const MOBILE_CARD_ACTION_MIN_WIDTH = 280;

/**
 * Prova que os botões de ação de um card (ex.: Ver/Editar) ficam alinhados no mobile:
 * mesmo x, mesma largura, empilhados e com alvo de toque >= 44px.
 */
export const expectCardActionsAligned = async (page: Page, testIds: readonly string[]): Promise<void> => {
  const boxes = [];
  for (const id of testIds) {
    const locator = page.getByTestId(id);
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    expect(box, `${id} sem caixa`).not.toBeNull();
    expect(box!.height, `${id} abaixo de 44px`).toBeGreaterThanOrEqual(44);
    boxes.push(box!);
  }
  for (const box of boxes) {
    expect(Math.abs(box.x - boxes[0].x), "ações com x desalinhado").toBeLessThanOrEqual(1);
    expect(Math.abs(box.width - boxes[0].width), "ações com larguras diferentes").toBeLessThanOrEqual(1);
    expect(box.width, "ação deve ocupar a largura do card").toBeGreaterThan(MOBILE_CARD_ACTION_MIN_WIDTH);
  }
};
