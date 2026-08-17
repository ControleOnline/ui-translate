const {expect, test} = require('playwright/test');
const packageJson = require('../../../../../../../package.json');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const APP_VERSION = packageJson?.version || '1.0.0';
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};
const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});
const collection = member => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const reviewItem = {
  rowId: 'ui:label:greeting',
  translateId: 11,
  language: {
    id: 1,
    '@id': '/languages/1',
    language: 'pt-br',
  },
  store: 'ui',
  type: 'label',
  key: 'greeting',
  translate: 'Olá',
  companyTranslate: 'Olá',
  mainTranslate: 'Olá principal',
  hasOverride: true,
  pendingReview: true,
  companyRevised: false,
  mainRevised: true,
};

const overview = () => ({
  items: [reviewItem],
  summary: {
    total: 1,
    pendingReview: 1,
    overrides: 1,
    fallbacks: 0,
    mainCompany: {id: 1, name: 'Empresa principal'},
  },
});

test.describe('translations review smoke', () => {
  test('opens, filters, clears and saves without reference errors or request loops', async ({page}) => {
    const runtimeErrors = [];
    let overviewRequests = 0;
    let saveRequests = 0;

    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });

    await page.route(`${API_ORIGIN}/**`, async route => {
      const method = route.request().method().toUpperCase();
      if (method === 'OPTIONS') {
        return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
      }

      const path = new URL(route.request().url()).pathname;
      if (path === '/languages') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([{id: 1, '@id': '/languages/1', language: 'pt-br'}])),
        });
      }

      if (path === '/translates/overview') {
        overviewRequests += 1;
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(overview()),
        });
      }

      if (path === '/translates/11' && method === 'PUT') {
        saveRequests += 1;
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({...reviewItem, translate: 'Olá revisado', companyTranslate: 'Olá revisado'}),
        });
      }

      if (path.startsWith('/translates')) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([])),
        });
      }

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    });

    await page.addInitScript(
      ({appVersion}) => {
        const set = (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch {}
        };
        set(
          'session',
          JSON.stringify({
            id: 7,
            people: '/people/7',
            api_key: 't',
            active: 1,
            mycompany: 3,
            roles: ['ROLE_ADMIN'],
          }),
        );
        set('config', JSON.stringify({language: 'pt-br'}));
        set('app-type', 'ERP');
        set(
          'device',
          JSON.stringify({
            id: 'web',
            device: 'web',
            type: 'WEB',
            appVersion,
            buildNumber: appVersion,
          }),
        );
      },
      {appVersion: APP_VERSION},
    );

    await page.goto('/translations-review-page');
    await expect(page.getByText('Revisão de textos')).toBeVisible({timeout: 15000});
    await expect(page.getByText('greeting').first()).toBeVisible();

    const searchInput = page.getByPlaceholder('Buscar chave, texto ou tipo');
    await searchInput.fill('greeting');
    await expect(searchInput).toHaveValue('greeting');

    await page.getByText('Limpar filtros').click();
    await expect(searchInput).toHaveValue('');

    const editor = page.getByDisplayValue('Olá');
    await editor.fill('Olá revisado');
    await page.getByText('Revisar').click();
    await expect.poll(() => saveRequests).toBe(1);

    await page.waitForTimeout(500);

    expect(
      runtimeErrors.filter(message =>
        /ReferenceError|Can't find variable|defaultCompany|handleExternalFiltersChange/.test(message),
      ),
    ).toEqual([]);
    expect(overviewRequests).toBeGreaterThanOrEqual(1);
    expect(overviewRequests).toBeLessThanOrEqual(6);
  });
});
