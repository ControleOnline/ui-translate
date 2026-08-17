const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {beforeEach, describe, expect, it} = global;
global.IS_REACT_ACT_ENVIRONMENT = true;

const mockApiFetch = jest.fn();
const mockUseFocusEffect = jest.fn();

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: values => values?.web || values?.default,
  },
  StyleSheet: {
    create: styles => styles,
  },
  Text: props => React.createElement('text', props, props.children),
  View: props => React.createElement('view', props, props.children),
}));

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

  it('does not rely on undeclared company state and exposes page callbacks', async () => {
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
    expect(typeof result.handleExternalFiltersChange).toBe('function');
    expect(typeof result.handleDraftChange).toBe('function');
    expect(typeof result.handleSave).toBe('function');
    expect(typeof result.onRefresh).toBe('function');
    expect(typeof result.loadLanguages).toBe('function');

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
      result.handleExternalFiltersChange({
        language: 'en-us',
        review: 'all',
        store: 'manager',
        type: 'label',
      });
      result.clearFilters();
    });

    expect(ctx.setSearchInput).toHaveBeenCalledWith('');
    expect(ctx.setFilters).toHaveBeenCalledTimes(2);
  });

  it('handleExternalFiltersChange maps review pendingOnly correctly', async () => {
    mockApiFetch.mockResolvedValue({member: [], summary: {}});
    const setFilters = jest.fn();
    const setSearchInput = jest.fn();
    const ctx = {
      currentCompanyId: 7,
      currentCompany: {id: 7},
      filters: {language: 'pt-br', store: '', type: '', search: '', pendingOnly: true},
      setFilters,
      setSearchInput,
      setLanguages: jest.fn(),
      resolvedLanguage: 'pt-br',
      mainCompanyId: 1,
      mainCompany: {id: 1},
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
    await renderer.act(async () => {
      result.handleExternalFiltersChange({
        language: 'pt-br',
        review: 'pending',
        store: '',
        type: '',
      });
    });
    expect(setFilters).toHaveBeenCalled();
    const lastCall = setFilters.mock.calls[setFilters.mock.calls.length - 1][0];
    const next =
      typeof lastCall === 'function'
        ? lastCall(ctx.filters)
        : lastCall;
    expect(next.pendingOnly).toBe(true);
  });
});
