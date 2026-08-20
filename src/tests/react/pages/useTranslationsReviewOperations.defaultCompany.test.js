/**
 * task-145: defaultCompany must be bound in the operations hook.
 * Undeclared free variable caused ReferenceError and empty review list.
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
    'useFocusEffect must be imported (used by focus loaders)',
  );
});

test('useTranslationsReviewOperations destructures defaultCompany from ctx', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  const idx = source.indexOf('} = ctx;');
  const destructureBlock = source.slice(Math.max(0, idx - 500), idx + 10);
  assert.match(
    destructureBlock,
    /defaultCompany/,
    'defaultCompany must be destructured from ctx (no free variable)',
  );
});

test('loadOverview resolves main company via defaultCompany without free vars', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(
    source,
    /resolvedMainCompany\s*=\s*mainCompany\s*\|\|\s*defaultCompany/,
    'resolvedMainCompany must fall back to defaultCompany',
  );
  assert.doesNotMatch(
    source,
    /const mainCompany = defaultCompany \|\| currentCompany/,
    'must not shadow mainCompany with unbound defaultCompany only',
  );
});

test('TranslationsReviewPage passes defaultCompany into operations hook', () => {
  const source = fs.readFileSync(pagePath, 'utf8');
  const callIdx = source.indexOf('useTranslationsReviewOperations({');
  assert.ok(callIdx > 0, 'hook call site must exist');
  const callBlock = source.slice(callIdx, callIdx + 600);
  assert.match(
    callBlock,
    /defaultCompany,/,
    'page must pass defaultCompany into useTranslationsReviewOperations',
  );
});
