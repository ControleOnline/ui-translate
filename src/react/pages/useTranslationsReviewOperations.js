import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {api} from '@controleonline/ui-common/src/api';
import {formatApiError} from './TranslationsReviewHelpers';
const {
  buildOverviewFromTranslateCollections,
  isNotFoundError,
  normalizeCollectionItems,
  normalizeCollectionTotalItems,
} = require('./TranslationsReviewPage.data');

export function useTranslationsReviewOperations(ctx) {
  const {
    currentCompanyId,
    currentCompany,
    filters,
    setFilters,
    setSearchInput,
    setLanguages,
    resolvedLanguage,
    mainCompanyId,
    mainCompany,
    overviewLoadModeRef,
    setLoading,
    setItems,
    setSummary,
    setDrafts,
    setRefreshing,
    setSavingRows,
    drafts,
    showError,
    showSuccess,
  } = ctx;

  const loadLanguages = useCallback(async () => {
    try {
      const response = await api.fetch('/languages', {
        params: {},
      });
      const languageItems = Array.isArray(response?.member)
        ? response.member
        : [];
      setLanguages(languageItems);

      if (!filters.language) {
        const fallbackLanguage =
          resolvedLanguage || languageItems[0]?.language || 'pt-br';
        if (fallbackLanguage) {
          setFilters(previous =>
            previous.language
              ? previous
              : {...previous, language: fallbackLanguage},
          );
        }
      }
    } catch {
      setLanguages([]);
      if (!filters.language) {
        setFilters(previous =>
          previous.language
            ? previous
            : {...previous, language: resolvedLanguage || 'pt-br'},
        );
      }
    }
  }, [filters.language, resolvedLanguage]);

  const loadOverview = useCallback(async () => {
    const activeLanguage = filters.language || resolvedLanguage;
    const resolvedMainCompany = mainCompany || currentCompany;
    const resolvedMainCompanyId = mainCompanyId || resolvedMainCompany?.id;

    if (!currentCompanyId || !activeLanguage) {
      setItems([]);
      setSummary({});
      setDrafts({});
      setLoading(false);
      return;
    }

    const overviewParams = {
      people: currentCompanyId,
      'language.language': activeLanguage,
      ...(filters.store ? {store: filters.store} : {}),
      ...(filters.type ? {type: filters.type} : {}),
      ...(filters.search ? {search: filters.search} : {}),
      ...(filters.pendingOnly ? {pendingReview: 1} : {}),
    };

    const loadAllTranslates = async peopleId => {
      const collectedItems = [];
      let page = 1;
      let totalItems = null;

      while (page <= 1000) {
        const response = await api.fetch('/translates', {
          params: {
            people: peopleId,
            'language.language': activeLanguage,
            page,
            ...(filters.store ? {store: filters.store} : {}),
            ...(filters.type ? {type: filters.type} : {}),
          },
        });

        const pageItems = normalizeCollectionItems(response);
        if (pageItems.length === 0) {
          break;
        }

        collectedItems.push(...pageItems);

        if (totalItems == null) {
          totalItems = normalizeCollectionTotalItems(response);
        }

        if (
          pageItems.length === 0 ||
          (totalItems != null && collectedItems.length >= totalItems)
        ) {
          break;
        }

        page += 1;
      }

      return collectedItems;
    };

    const loadOverviewFromCollections = async () => {
      const shouldLoadMainFallback =
        Boolean(resolvedMainCompanyId) &&
        String(resolvedMainCompanyId) !== String(currentCompanyId);

      const [companyTranslations, fallbackTranslations] = await Promise.all([
        loadAllTranslates(currentCompanyId),
        shouldLoadMainFallback
          ? loadAllTranslates(resolvedMainCompanyId)
          : Promise.resolve([]),
      ]);

      return buildOverviewFromTranslateCollections({
        companyTranslations,
        fallbackTranslations,
        selectedCompany: currentCompany,
        mainCompany: resolvedMainCompany,
        activeLanguage,
        search: filters.search,
        pendingOnly: filters.pendingOnly,
      });
    };

    try {
      const response =
        overviewLoadModeRef.current === 'collection'
          ? await loadOverviewFromCollections()
          : await api
              .fetch('/translates/overview', {
                params: overviewParams,
              })
              .catch(async error => {
                if (!isNotFoundError(error)) {
                  throw error;
                }

                overviewLoadModeRef.current = 'collection';
                return loadOverviewFromCollections();
              });

      const nextItems = normalizeCollectionItems(response);
      setItems(nextItems);
      setSummary(response?.summary || {});
      setDrafts(
        nextItems.reduce((accumulator, item) => {
          accumulator[item.rowId] =
            item.companyTranslate || item.translate || '';
          return accumulator;
        }, {}),
      );
    } catch (error) {
      showError(formatApiError(error));
      setItems([]);
      setSummary({});
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [
    currentCompany,
    currentCompanyId,
    mainCompany,
    mainCompanyId,
    filters.language,
    filters.pendingOnly,
    filters.search,
    filters.store,
    filters.type,
    resolvedLanguage,
    showError,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadLanguages();
    }, [loadLanguages]),
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOverview();
    }, [loadOverview]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadLanguages(), loadOverview()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadLanguages, loadOverview]);

  const handleExternalFiltersChange = useCallback(
    nextFilters => {
      setFilters(previous => ({
        ...previous,
        language:
          nextFilters?.language || resolvedLanguage || previous.language,
        pendingOnly: nextFilters?.review
          ? nextFilters.review === 'pending'
          : true,
        store: nextFilters?.store || '',
        type: nextFilters?.type || '',
      }));
    },
    [resolvedLanguage],
  );

  const clearFilters = useCallback(() => {
    if (typeof setSearchInput === 'function') {
      setSearchInput('');
    }
    setFilters(previous => ({
      ...previous,
      store: '',
      type: '',
      search: '',
      pendingOnly: true,
    }));
  }, []);

  const handleDraftChange = useCallback((rowId, value) => {
    setDrafts(previous => ({
      ...previous,
      [rowId]: value,
    }));
  }, []);

  const handleSave = useCallback(
    async row => {
      const draftValue = drafts[row.rowId];
      if (!String(draftValue || '').trim()) return;

      setSavingRows(previous => ({
        ...previous,
        [row.rowId]: true,
      }));

      try {
        await api.fetch(
          row.translateId ? `/translates/${row.translateId}` : '/translates',
          {
            method: row.translateId ? 'PUT' : 'POST',
            body: {
              people: `/people/${currentCompanyId}`,
              language:
                row.language?.['@id'] || `/languages/${row.language?.id}`,
              store: row.store,
              type: row.type,
              key: row.key,
              translate: draftValue,
              revised: true,
            },
          },
        );

        showSuccess(
          row.pendingReview ? 'Traducao revisada.' : 'Traducao salva.',
        );
        await loadOverview();
      } catch (error) {
        showError(formatApiError(error));
      } finally {
        setSavingRows(previous => ({
          ...previous,
          [row.rowId]: false,
        }));
      }
    },
    [currentCompanyId, drafts, loadOverview, showError, showSuccess],
  );

  return {
    loadLanguages,
    loadOverview,
    onRefresh,
    handleExternalFiltersChange,
    handleDraftChange,
    handleSave,
    clearFilters,
  };
}
