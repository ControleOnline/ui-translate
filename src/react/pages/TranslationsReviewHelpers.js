import React from 'react';
import { Platform, Text, View } from 'react-native';
import styles from './TranslationsReviewPage.styles';

const { resolveConfiguredLanguage } = require('@controleonline/ui-common/src/react/utils/runtimeLanguage');

export const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  web: { boxShadow: '0 10px 24px rgba(15,23,42,0.08)' },
});

export const getStoredJson = storageKey => {
  try {
    if (typeof localStorage === 'undefined') return {};
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
};

export const getConfigLanguage = ({ currentCompany, defaultCompany } = {}) =>
  resolveConfiguredLanguage({
    currentCompany,
    defaultCompany,
    currentConfig: getStoredJson('config'),
    sessionData: getStoredJson('session'),
  });

export const formatApiError = error => {
  if (!error) return 'Não foi possível carregar as traduções.';
  if (typeof error === 'string') return error;
  return (
    error?.message ||
    error?.description ||
    error?.errmsg ||
    'Não foi possível carregar as traduções.'
  );
};

export const normalizeOptions = (values, activeValue = '') => {
  const normalizedValues = Array.isArray(values) ? values : [];
  const uniqueValues = new Map();

  if (activeValue) {
    uniqueValues.set(String(activeValue), String(activeValue));
  }

  normalizedValues.filter(Boolean).forEach(value => {
    uniqueValues.set(String(value), String(value));
  });

  return Array.from(uniqueValues.values()).map(value => ({
    value,
    label: value,
  }));
};

export function SummaryCard({ label, value, accent }) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: accent }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: accent }]}>{value ?? 0}</Text>
    </View>
  );
}

export const TRANSLATE_REVIEW_COLUMNS = [
  {
    name: 'rowId',
    label: 'id',
    isIdentity: true,
    sortable: false,
    format: v => v || '',
  },
  {
    name: 'key',
    label: 'key',
    sortable: true,
    format: v => v || '',
  },
  {
    name: 'store',
    label: 'store',
    sortable: true,
    externalFilter: true,
    format: v => v || '',
  },
  {
    name: 'type',
    label: 'type',
    sortable: true,
    externalFilter: true,
    format: v => v || '',
  },
  {
    name: 'pendingReview',
    label: 'status',
    sortable: true,
    format: v => (v ? 'Pendente' : 'Revisada'),
  },
];

export function buildLanguageOptions(languages, activeLanguage) {
  const uniqueLanguages = new Map();
  if (activeLanguage) {
    uniqueLanguages.set(activeLanguage, {
      value: activeLanguage,
      label: String(activeLanguage).toUpperCase(),
    });
  }
  (languages || []).forEach(language => {
    const value = String(language?.language || '').trim();
    if (!value) return;
    uniqueLanguages.set(value, {
      value,
      label: value.toUpperCase(),
    });
  });
  return Array.from(uniqueLanguages.values());
}
