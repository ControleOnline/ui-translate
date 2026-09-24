import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

import {api} from '@controleonline/ui-common/src/api';
import DefaultExternalFilters from '@controleonline/ui-default/src/react/components/filters/DefaultExternalFilters';
import DefaultTable from '@controleonline/ui-default/src/react/components/table/DefaultTable';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {useStore} from '@store';
import {colors} from '@controleonline/../../src/styles/colors';
import {resolveThemePalette} from '@controleonline/../../src/styles/branding';
import styles from './TranslationsReviewPage.styles';
import TranslationReviewRow from './TranslationReviewRow';
import {useTranslationsReviewOperations} from './useTranslationsReviewOperations';
import {
  shadowStyle,
  getConfigLanguage,
  formatApiError,
  SummaryCard,
  TRANSLATE_REVIEW_COLUMNS,
  buildLanguageOptions,
  normalizeOptions,
} from './TranslationsReviewHelpers';

const {
  buildOverviewFromTranslateCollections,
  isNotFoundError,
  normalizeCollectionItems,
  normalizeCollectionTotalItems,
} = require('./TranslationsReviewPage.data');

export default function TranslationsReviewPage() {
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const {currentCompany, defaultCompany} = peopleStore.getters;
  const {colors: themeColors} = themeStore.getters;
  const {showError, showSuccess} = useToastMessage();

  const currentCompanyId = currentCompany?.id;
  const resolvedLanguage = useMemo(
    () => getConfigLanguage({currentCompany, defaultCompany}),
    [currentCompany, defaultCompany],
  );
  const syncedCompanyIdRef = useRef(currentCompanyId || null);
  const lastSyncedLanguageRef = useRef(resolvedLanguage);
  const overviewLoadModeRef = useRef('overview');
  const brandColors = useMemo(() => resolveThemePalette({ ...themeColors, ...(currentCompany?.theme?.colors || {}) }, colors), [themeColors, currentCompany?.id]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [languages, setLanguages] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState(() => ({ language: resolvedLanguage, store: '', type: '', search: '', pendingOnly: true }));

  useEffect(() => {
    const normalizedCompanyId = currentCompanyId || null;
    const companyChanged = syncedCompanyIdRef.current !== normalizedCompanyId;
    setFilters(previous => {
      if (!resolvedLanguage) return previous;
      const canSyncLanguage =
        companyChanged ||
        !previous.language ||
        previous.language === lastSyncedLanguageRef.current;
      if (!canSyncLanguage) return previous;
      lastSyncedLanguageRef.current = resolvedLanguage;
      return previous.language === resolvedLanguage ? previous : { ...previous, language: resolvedLanguage };
    });
    syncedCompanyIdRef.current = normalizedCompanyId;
  }, [currentCompanyId, resolvedLanguage]);

  const languageOptions = useMemo(
    () => buildLanguageOptions(languages, filters.language),
    [filters.language, languages],
  );

  const storeOptions = useMemo(
    () =>
      normalizeOptions(
        items.map(item => item.store),
        filters.store,
      ),
    [items, filters.store],
  );

  const typeOptions = useMemo(
    () =>
      normalizeOptions(
        items.map(item => item.type),
        filters.type,
      ),
    [items, filters.type],
  );

  const hasMainFallback = useMemo(() => {
    const mainCompanyId = summary?.mainCompany?.id || defaultCompany?.id;
    return Boolean(
      currentCompanyId &&
      mainCompanyId &&
      String(currentCompanyId) !== String(mainCompanyId),
    );
  }, [currentCompanyId, defaultCompany?.id, summary?.mainCompany?.id]);

  const mainCompanyLabel =
    summary?.mainCompany?.name ||
    defaultCompany?.name ||
    defaultCompany?.alias ||
    'empresa principal';
  const languageFilterOptions = useMemo(
    () =>
      languageOptions.map(language => ({
        value: language.value,
        label: language.label,
      })),
    [languageOptions],
  );
  const storeFilterOptions = useMemo(
    () =>
      storeOptions.map(store => ({
        value: store,
        label: store,
      })),
    [storeOptions],
  );
  const typeFilterOptions = useMemo(
    () =>
      typeOptions.map(type => ({
        value: type,
        label: type,
      })),
    [typeOptions],
  );
  const reviewFilterOptions = useMemo(
    () => [
      {value: 'all', label: 'Todas as traduções'},
      {
        value: 'pending',
        label:
          summary?.pendingReview > 0
            ? `Pendentes (${summary.pendingReview})`
            : 'Pendentes',
      },
    ],
    [summary?.pendingReview],
  );
  const externalFilterValues = useMemo(
    () => ({
      language: filters.language,
      review: filters.pendingOnly ? 'pending' : 'all',
      store: filters.store,
      type: filters.type,
    }),
    [filters.language, filters.pendingOnly, filters.store, filters.type],
  );
  const getExternalFilterOptions = useCallback(
    column => {
      const fieldName = column?.name || column?.key;
      if (fieldName === 'language') return languageFilterOptions;
      if (fieldName === 'review') return reviewFilterOptions;
      if (fieldName === 'store') return storeFilterOptions;
      if (fieldName === 'type') return typeFilterOptions;

      return [];
    },
    [
      languageFilterOptions,
      reviewFilterOptions,
      storeFilterOptions,
      typeFilterOptions,
    ],
  );

  const mainCompanyId = summary?.mainCompany?.id || defaultCompany?.id;
  const mainCompany = summary?.mainCompany || defaultCompany;

  const {
    loadLanguages,
    loadOverview,
    onRefresh,
    handleDraftChange,
    handleSave,
    clearFilters,
  } = useTranslationsReviewOperations({
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
  });

  if (!currentCompanyId) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerState}>
          <Icon name="building" size={32} color="#94A3B8" />
          <Text style={styles.centerStateTitle}>Selecione uma empresa</Text>
          <Text style={styles.centerStateText}>
            A revisão de traduções depende da empresa ativa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: brandColors.background}]}
        edges={['bottom']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={brandColors.primary} />
          <Text style={styles.centerStateTitle}>Carregando traduções</Text>
          <Text style={styles.centerStateText}>
            Buscando pendências, fallback e sobrescritas da empresa ativa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: brandColors.background}]}
      edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brandColors.primary}
          />
        }>
        <View
          style={[
            styles.heroCard,
            shadowStyle,
            {backgroundColor: brandColors.primary},
          ]}>
          <View style={styles.heroBadge}>
            <Icon name="type" size={22} color={brandColors.primary} />
          </View>
          <Text style={styles.heroEyebrow}>TRADUÇÕES</Text>
          <Text style={styles.heroTitle}>Revisão de textos</Text>
          <Text style={styles.heroText}>
            Revise o que entrou automaticamente, compare com a empresa principal
            e grave a sobrescrita da empresa ativa quando precisar.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Total" value={summary?.total} accent="#0EA5E9" />
          <SummaryCard
            label="Pendentes"
            value={summary?.pendingReview}
            accent="#c10015"
          />
          <SummaryCard
            label="Sobrescritas"
            value={summary?.overrides}
            accent="#10B981"
          />
          <SummaryCard
            label="Fallbacks"
            value={summary?.fallbacks}
            accent="#e67e22"
          />
        </View>

        <View style={[styles.filtersCard, shadowStyle]}>
          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={clearFilters}
              style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Limpar filtros</Text>
            </TouchableOpacity>
          </View>

          <DefaultExternalFilters
            accentColor={brandColors.primary}
            filters={externalFilterValues}
            getOptionsForColumn={getExternalFilterOptions}
            onChangeFilters={handleExternalFiltersChange}
            storeName="translate"
          />

          {hasMainFallback ? (
            <View style={styles.infoBanner}>
              <Icon name="git-merge" size={16} color="#1D4ED8" />
              <Text style={styles.infoBannerText}>
                A traducao da empresa principal fica visivel como referencia. Ao
                salvar aqui, a empresa ativa cria sua propria sobrescrita.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tableWrap}>
          <DefaultTable
            storeName="translate"
            data={items.map(row => ({...row, id: row.rowId}))}
            columns={TRANSLATE_REVIEW_COLUMNS}
            initialViewMode="cards"
            forceCardsOnCompact
            showToolbar
            showRowActions={false}
            showColumnFiltersButton={false}
            searchProps={{
              compact: true,
              placeholder: 'Buscar chave, texto ou tipo',
              searchKey: 'search',
              value: searchInput,
              onSearch: value => {
                setSearchInput(value);
                setFilters(previous => ({...previous, search: value}));
              },
              storeName: 'translate',
            }}
            totalItems={items.length}
            totalItemsLabel="traducoes"
            visibleColumnsPreferenceKey="translations-review"
            accentColor={brandColors.primary}
            renderCard={({item: row}) => (
              <TranslationReviewRow
                row={row}
                rowDraft={drafts[row.rowId] || ''}
                isSaving={Boolean(savingRows[row.rowId])}
                mainCompanyLabel={mainCompanyLabel}
                hasMainFallback={hasMainFallback}
                brandColors={brandColors}
                shadowStyle={shadowStyle}
                onDraftChange={handleDraftChange}
                onSave={handleSave}
              />
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
