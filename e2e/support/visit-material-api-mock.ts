import type { Page, Request, Route } from '@playwright/test';
import {
  buildVisitMaterialFixture,
  VisitMaterialFixture,
  VISIT_MATERIALS,
} from '../fixtures/visit-material.fixtures';
import { API_BASE_URL } from './api-mock';

export interface VisitMaterialRecordedCall {
  method: string;
  pathname: string;
  query: URLSearchParams;
  contentType: string;
  body: string;
}

export interface VisitMaterialApiMock {
  calls: VisitMaterialRecordedCall[];
  callsTo: (method: string, pathname: string) => VisitMaterialRecordedCall[];
  failNext: (method: string, pathname: string, message: string) => void;
}

interface FailureRule {
  method: string;
  pathname: string;
  message: string;
}

const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const recordOf = (request: Request): VisitMaterialRecordedCall => {
  const url = new URL(request.url());
  return {
    method: request.method(),
    pathname: url.pathname,
    query: url.searchParams,
    contentType: request.headers()['content-type'] ?? '',
    body: request.postData() ?? '',
  };
};

const routeDtoOf = (material: VisitMaterialFixture) => ({
  ...material.route,
  current: material.currentWeek,
  image: null,
  idToFetch: material.id,
  entityType: 'VisitMaterialsPage',
  entityId: material.id,
  createdAt: material.createdAt,
  updatedAt: material.updatedAt,
});

export async function mockVisitMaterialApi(
  page: Page,
): Promise<VisitMaterialApiMock> {
  let materials = [...VISIT_MATERIALS];
  const calls: VisitMaterialRecordedCall[] = [];
  const failures: FailureRule[] = [];

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const call = recordOf(route.request());
    const isVisitMaterialRequest = call.pathname.includes(
      '/visit-material-pages',
    );
    const isRoutesRequest = call.pathname.endsWith('/routes');

    if (!isVisitMaterialRequest && !isRoutesRequest) {
      await route.fallback();
      return;
    }

    calls.push(call);
    const failureIndex = failures.findIndex(
      (failure) =>
        failure.method === call.method && failure.pathname === call.pathname,
    );
    if (failureIndex >= 0) {
      const [failure] = failures.splice(failureIndex, 1);
      await json(route, 400, {
        statusCode: 400,
        message: failure.message,
        error: 'Bad Request',
        category: 'BUSINESS',
      });
      return;
    }

    if (isRoutesRequest) {
      await json(route, 200, materials.map(routeDtoOf));
      return;
    }

    const currentMatch = call.pathname.match(
      /\/visit-material-pages\/current-material\/([^/]+)$/,
    );
    if (call.method === 'POST' && currentMatch) {
      materials = materials.map((material) => ({
        ...material,
        currentWeek: material.id === currentMatch[1],
      }));
      await json(
        route,
        200,
        materials.find((material) => material.id === currentMatch[1]),
      );
      return;
    }

    if (
      call.method === 'GET' &&
      call.pathname.endsWith('/visit-material-pages/current-material')
    ) {
      await json(
        route,
        200,
        materials.find((material) => material.currentWeek) ?? null,
      );
      return;
    }

    const detailMatch = call.pathname.match(/\/visit-material-pages\/([^/]+)$/);
    if (detailMatch && call.method === 'GET') {
      await json(
        route,
        200,
        materials.find((material) => material.id === detailMatch[1]) ?? null,
      );
      return;
    }

    if (detailMatch && call.method === 'DELETE') {
      materials = materials.filter(
        (material) => material.id !== detailMatch[1],
      );
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (detailMatch && call.method === 'PATCH') {
      const material = materials.find(
        (candidate) => candidate.id === detailMatch[1],
      );
      await json(route, 200, material ?? materials[0]);
      return;
    }

    if (
      call.method === 'POST' &&
      call.pathname.endsWith('/visit-material-pages')
    ) {
      const created = buildVisitMaterialFixture({
        id: 'efaf2146-6136-4dcc-abf5-2b1f44bd2854',
        title: 'Material criado pela tela',
        route: {
          ...buildVisitMaterialFixture().route,
          id: 'route-created',
          path: 'materiais_visita_criado',
          title: 'Material criado pela tela',
        },
      });
      materials = [created, ...materials];
      await json(route, 201, created);
      return;
    }

    if (call.method === 'GET') {
      const search = call.query.get('searchString')?.toLocaleLowerCase('pt-BR');
      const testament = call.query.get('testament');
      const filtered = materials.filter(
        (material) =>
          (!testament || material.testament === testament) &&
          (!search ||
            [material.title, material.subtitle, material.description].some(
              (value) => value.toLocaleLowerCase('pt-BR').includes(search),
            )),
      );
      await json(route, 200, filtered);
      return;
    }

    await route.fallback();
  });

  return {
    calls,
    callsTo: (method, pathname) =>
      calls.filter(
        (call) => call.method === method && call.pathname === pathname,
      ),
    failNext: (method, pathname, message) => {
      failures.push({ method, pathname, message });
    },
  };
}
