const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {beforeEach, describe, expect, it} = global;
global.IS_REACT_ACT_ENVIRONMENT = true;

const mockApiFetch = jest.fn();
const mockUseFocusEffect = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: mockUseFocusEffect,
}));

jest.mock('@controleonline/ui-common/src/api', () => ({
  api: {
    fetch: mockApiFetch,
  },
}));

const {
  useTranslationsReviewOperations,
} = require('../../../react/pages/useTranslationsReviewOperations');

describe('useTranslationsReviewOperations', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockUseFocusEffect.mockReset();
  });

  it('renders without relying on an undeclared defaultCompany and exposes clearFilters', async () => {
    mockApiFetch.mockResolvedValue({
      member: [],
      summary: {},
    });

    const ctx = {
      currentCompanyId: 7,
      currentCompany: {id: 7, name: 'Filial'},
      filters: {
        language: 'pt-br',
        store: '',
        type: '',
        search: '',
        pendingOnly: true,
      },
      setFilters: jest.fn(),
      setSearchInput: jest.fn(),
      setLanguages: jest.fn(),
      resolvedLanguage: 'pt-br',
      mainCompanyId: 1,
      mainCompany: {id: 1, name: 'Principal'},
      overviewLoadModeRef: {current: 'overview'},
      setLoading: jest.fn(),
      setItems: jest.fn(),
      setSummary: jest.fn(),
      setDrafts: jest.fn(),
      setRefreshing: jest.fn(),
      setSavingRows: jest.fn(),
      drafts: {},
      showError: jest.fn(),
      showSuccess: jest.fn(),
    };

    let result;

    function Harness() {
      result = useTranslationsReviewOperations(ctx);
      return null;
    }

    await renderer.act(async () => {
      renderer.create(React.createElement(Harness));
    });

    expect(mockUseFocusEffect).toHaveBeenCalledTimes(2);
    expect(typeof result.loadOverview).toBe('function');
    expect(typeof result.clearFilters).toBe('function');

    await renderer.act(async () => {
      await result.loadOverview();
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/translates/overview',
      expect.objectContaining({
        params: expect.objectContaining({
          people: 7,
          'language.language': 'pt-br',
        }),
      }),
    );

    await renderer.act(async () => {
      result.clearFilters();
    });

    expect(ctx.setSearchInput).toHaveBeenCalledWith('');
    expect(ctx.setFilters).toHaveBeenCalled();
  });
});
