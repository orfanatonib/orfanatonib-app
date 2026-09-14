import { expect, test } from '../support/test';
import { mockVisitMaterialApi } from '../support/visit-material-api-mock';

test.describe('materiais de visita', () => {
  test('lista uma única vez no carregamento e envia os filtros à API', async ({
    page,
    api,
  }) => {
    void api;
    const visitApi = await mockVisitMaterialApi(page);

    await page.goto('/adm/paginas-materiais-visita');
    await expect(page.getByTestId('visit-material-manager')).toBeVisible();
    await expect(page.getByTestId('visit-material-card')).toHaveCount(2);
    await page.waitForTimeout(500);
    expect(
      visitApi.callsTo('GET', '/visit-material-pages'),
    ).toHaveLength(1);

    await page.getByLabel('Buscar materiais').fill('João');
    await expect(page.getByTestId('visit-material-card')).toHaveCount(1);
    await expect(page.getByTestId('visit-material-card')).toContainText(
      'Evangelho de João',
    );
    expect(
      visitApi.callsTo('GET', '/visit-material-pages').at(-1)?.query.get(
        'searchString',
      ),
    ).toBe('João');

    await page.getByLabel('Buscar materiais').fill('');
    await page.getByTestId('visit-material-manager-tab-new-testament').click();
    await expect(page.getByTestId('visit-material-card')).toHaveCount(1);
    await expect
      .poll(() =>
        visitApi
          .callsTo('GET', '/visit-material-pages')
          .at(-1)
          ?.query.get('testament'),
      )
      .toBe('NEW_TESTAMENT');
  });

  test('define o material atual e impede envio duplicado', async ({
    page,
    api,
  }) => {
    void api;
    const visitApi = await mockVisitMaterialApi(page);
    await page.goto('/adm/paginas-materiais-visita');

    const genesis = page
      .getByTestId('visit-material-card')
      .filter({ hasText: 'Gênesis' });
    await genesis.getByTestId('visit-material-card-set-current').click();
    const dialog = page.getByTestId('visit-material-set-current-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByTestId('visit-material-set-current-confirm').click();

    await expect(genesis).toContainText('Material Atual');
    expect(
      visitApi.callsTo(
        'POST',
        '/visit-material-pages/current-material/6f1c3c62-0f6a-4f4b-9a3f-0b5f7f2a1d11',
      ),
    ).toHaveLength(1);
  });

  test('mantém o diálogo aberto e mostra a mensagem da API se excluir falhar', async ({
    page,
    api,
  }) => {
    void api;
    const visitApi = await mockVisitMaterialApi(page);
    const endpoint =
      '/visit-material-pages/6f1c3c62-0f6a-4f4b-9a3f-0b5f7f2a1d11';
    visitApi.failNext('DELETE', endpoint, 'Não foi possível excluir agora.');
    await page.goto('/adm/paginas-materiais-visita');

    const genesis = page
      .getByTestId('visit-material-card')
      .filter({ hasText: 'Gênesis' });
    await genesis.getByTestId('visit-material-card-delete').click();
    await page.getByTestId('visit-material-delete-dialog-confirm').click();

    await expect(page.getByTestId('visit-material-delete-dialog')).toBeVisible();
    await expect(page.getByTestId('visit-material-manager-error')).toContainText(
      'Não foi possível excluir agora.',
    );
  });

  test('valida e cria uma página pela interface com multipart tipado', async ({
    page,
    api,
  }) => {
    void api;
    const visitApi = await mockVisitMaterialApi(page);
    await page.goto('/adm/criar-pagina');
    await page.getByTestId('page-template-card-visit-materials').click();

    const editor = page.getByTestId('visit-material-page-editor');
    await editor.getByTestId('visit-material-page-editor-save').click();
    await expect(
      editor.getByTestId('visit-material-page-editor-feedback'),
    ).toContainText('Preencha todos os campos obrigatórios.');

    await editor.getByTestId('visit-material-page-editor-title').locator('input').fill('Material criado pela tela');
    await editor.getByTestId('visit-material-page-editor-subtitle').locator('input').fill('Subtítulo do material');
    await editor.getByTestId('visit-material-page-editor-description').locator('textarea').first().fill('Descrição do material');
    await editor.getByTestId('visit-material-page-editor-save').click();

    await expect(page.getByTestId('visit-material-page')).toBeVisible();
    const request = visitApi.callsTo('POST', '/visit-material-pages')[0];
    expect(request.contentType).toContain('multipart/form-data; boundary=');
    expect(request.body).toContain('"pageTitle":"Material criado pela tela"');
    expect(request.body).toContain('"testament":"OLD_TESTAMENT"');
  });
});
