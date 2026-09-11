import { expect, type Locator, type Page } from "@playwright/test";

/**
 * MUI X v8 renders a sectioned date field: the visible value lives in three
 * `role=spinbutton` sections (Day/Month/Year) and the plain `<input>` behind
 * them is hidden and holds a different, unlocalized format. Always drive the
 * sections — never that input.
 */
export const dateFieldGroup = (page: Page, testId: string): Locator =>
  page.getByTestId(testId).getByRole("group");

/**
 * Types a date into a BRDatePicker. Focus has to land on the first section —
 * clicking the group itself can hit the legend or the calendar button.
 */
export const fillDateField = async (
  page: Page,
  testId: string,
  digits: string,
): Promise<void> => {
  await page.getByTestId(testId).getByRole("spinbutton").first().click();
  // Sem intervalo entre as teclas o campo perde os dígitos ao trocar de seção.
  await page.keyboard.type(digits, { delay: 60 });
};

/**
 * Asserts the date the picker is actually holding, reading the sections
 * instead of the hidden input, in `DD/MM/AAAA` order.
 */
export const expectDateField = async (
  page: Page,
  testId: string,
  expected: string,
): Promise<void> => {
  const sections = page.getByTestId(testId).getByRole("spinbutton");
  await expect(sections).toHaveText(expected.split("/"));
};

/** The `<input>` rendered by a plain MUI TextField. */
export const textInput = (page: Page, testId: string): Locator =>
  page.getByTestId(testId).locator("input");
