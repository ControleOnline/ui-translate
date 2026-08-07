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
  summary: {},
});

test.describe('translations review smoke', () => {
  test('renders review page shell', async ({page}) => {
    await page.route(`${API_ORIGIN}/**`, async route => {
      if (route.request().method().toUpperCase() === 'OPTIONS') {
        return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
      }
      const path = new URL(route.request().url()).pathname;
      if (path.includes('translates')) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({
            items: [],
            total: 0,
            pendingReview: 0,
            overrides: 0,
            fallbacks: 0,
          }),
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
        const set = (k, v) => {
          try {
            localStorage.setItem(k, v);
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
    await expect(page.getByText(/Revis/i).first()).toBeVisible({timeout: 15000});
  });
});
