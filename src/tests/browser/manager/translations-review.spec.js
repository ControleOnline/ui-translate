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
const textHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'text/css; charset=utf-8',
});
const collection = member => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const company = {
  id: 3,
  name: 'Gyros',
  alias: 'GYROS',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {colors: {primary: '#0EA5E9', secondary: '#F97316'}},
  configs: {},
};

const reviewItem = {
  rowId: 'ui:label:greeting',
  translateId: 11,
  language: {id: 1, '@id': '/languages/1', language: 'pt-br'},
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
      const request = route.request();
      const method = request.method().toUpperCase();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/+/, '');

      if (method === 'OPTIONS') {
        return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
      }
      if (path === 'themes-colors.css') {
        return route.fulfill({
          status: 200,
          headers: textHeaders(),
          body: ':root { --primary: #0ea5e9; --secondary: #f97316; }',
        });
      }
      if (path === 'runtime/ip') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({ip: '127.0.0.1'}),
        });
      }
      if (path === 'menus-people') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({modules: {}}),
        });
      }
      if (path === 'people/companies/my') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([company])),
        });
      }
      if (path === 'people/company/default') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(company),
        });
      }
      if (path === 'languages') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(
            collection([{id: 1, '@id': '/languages/1', language: 'pt-br'}]),
          ),
        });
      }
      if (path === 'translates/overview') {
        overviewRequests += 1;
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(overview()),
        });
      }
      if (path === 'translates/11' && method === 'PUT') {
        saveRequests += 1;
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({
            ...reviewItem,
            translate: 'Olá revisado',
            companyTranslate: 'Olá revisado',
          }),
        });
      }
      if (path.startsWith('translates')) {
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
        localStorage.setItem(
          'session',
          JSON.stringify({
            id: 7,
            people: '/people/7',
            api_key: 'test-api-key',
            active: 1,
            mycompany: 3,
            roles: ['ROLE_SUPER'],
          }),
        );
        localStorage.setItem('config', JSON.stringify({language: 'pt-br'}));
        localStorage.setItem('app-type', 'MANAGER');
        localStorage.setItem(
          'device',
          JSON.stringify({
            id: 'web-manager',
            device: 'web-manager',
            type: 'WEB',
            appName: 'Browser Manager',
            appVersion,
            buildNumber: appVersion,
            systemName: 'web',
            systemVersion: 'web',
            deviceType: 'web',
            metadata: {},
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
