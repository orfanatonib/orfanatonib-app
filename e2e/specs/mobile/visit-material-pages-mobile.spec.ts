import { expect, test } from '../../support/test';
import { mockVisitMaterialApi } from '../../support/visit-material-api-mock';

test('materiais de visita permanecem utilizáveis no celular', async ({
  page,
  api,
}) => {
  void api;
  await mockVisitMaterialApi(page);
  await page.goto('/adm/paginas-materiais-visita');

  await expect(page.getByTestId('visit-material-manager')).toBeVisible();
  await expect(page.getByTestId('visit-material-card')).toHaveCount(2);
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);

  const genesis = page
    .getByTestId('visit-material-card')
    .filter({ hasText: 'Gênesis' });
  await genesis.getByTestId('visit-material-card-set-current').click();
  await expect(page.getByTestId('visit-material-set-current-dialog')).toBeVisible();
  await expect(
    page.getByTestId('visit-material-set-current-confirm'),
  ).toBeEnabled();
});
