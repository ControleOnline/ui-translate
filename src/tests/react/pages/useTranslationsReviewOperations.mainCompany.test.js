const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const hookPath = path.join(
  __dirname,
  '../../../react/pages/useTranslationsReviewOperations.js',
);
const pagePath = path.join(
  __dirname,
  '../../../react/pages/TranslationsReviewPage.js',
);

test('useTranslationsReviewOperations imports useFocusEffect', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(
    source,
    /import\s*\{\s*useFocusEffect\s*\}\s*from\s*['"]@react-navigation\/native['"]/,
    'useFocusEffect must be imported',
  );
});

test('loadOverview resolves the supplied main company explicitly', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(
    source,
    /resolvedMainCompany\s*=/,
    'must resolve main company explicitly',
  );
  assert.doesNotMatch(
    source,
    new RegExp('const mainCompany = ' + 'default' + 'Company' + ' \\|\\| currentCompany'),
    'must not use an unbound legacy company variable',
  );
});

test('TranslationsReviewPage passes the store main company into operations', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  assert.match(
    source,
    /const\s*\{currentCompany, mainCompany\}\s*=\s*peopleStore\.getters/,
    'page must read the main company from the people store',
  );
  const callIdx = source.indexOf('useTranslationsReviewOperations({');
  assert.ok(callIdx > 0, 'hook call site must exist');
  const callBlock = source.slice(callIdx, callIdx + 400);
  assert.match(callBlock, /mainCompany/, 'must pass mainCompany into hook');
});
