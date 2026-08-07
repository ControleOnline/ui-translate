/* global describe, expect, it */
const { TRANSLATE_REVIEW_COLUMNS, buildLanguageOptions } = require('../../../react/pages/TranslationsReviewHelpers');

describe('translations review DefaultTable (#292)', () => {
  it('exposes review columns including pending status', () => {
    const names = TRANSLATE_REVIEW_COLUMNS.map(c => c.name);
    expect(names).toContain('key');
    expect(names).toContain('pendingReview');
  });

  it('buildLanguageOptions includes active language', () => {
    const options = buildLanguageOptions([{ language: 'en' }], 'pt-br');
    expect(options.some(o => o.value === 'pt-br')).toBe(true);
    expect(options.some(o => o.value === 'en')).toBe(true);
  });
});
