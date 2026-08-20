/**
 * task-145 / task-357: company fallback for translations review load path.
 * Master had unbound defaultCompany (ReferenceError); dev resolves via mainCompany
 * wired from page defaultCompany.
 */
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

test('loadOverview resolves main company without free defaultCompany', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(
    source,
    /resolvedMainCompany\s*=/,
    'must resolve main company explicitly',
  );
  assert.doesNotMatch(
    source,
    /const mainCompany = defaultCompany \|\| currentCompany/,
    'must not shadow with unbound defaultCompany',
  );
});

test('TranslationsReviewPage wires defaultCompany into mainCompany for operations', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  assert.match(
    source,
    /const mainCompany\s*=\s*defaultCompany/,
    'page must set mainCompany from defaultCompany',
  );
  const callIdx = source.indexOf('useTranslationsReviewOperations({');
  assert.ok(callIdx > 0, 'hook call site must exist');
  const callBlock = source.slice(callIdx, callIdx + 400);
  assert.match(callBlock, /mainCompany/, 'must pass mainCompany into hook');
});
