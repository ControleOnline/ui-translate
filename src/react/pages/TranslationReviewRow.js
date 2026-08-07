import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import styles from './TranslationsReviewPage.styles';

export default function TranslationReviewRow({
  row,
  rowDraft,
  isSaving,
  mainCompanyLabel,
  hasMainFallback,
  brandColors,
  shadowStyle,
  onDraftChange,
  onSave,
}) {
  if (!row) return null;

  const isFallbackOnly = !row.hasOverride;
  const footerHint = isFallbackOnly
    ? row.mainRevised
      ? `Fallback da ${mainCompanyLabel} ja revisado manualmente.`
      : `Fallback da ${mainCompanyLabel} ainda pendente na empresa principal.`
    : row.companyRevised
      ? 'Entrada revisada manualmente nesta empresa.'
      : 'Entrada criada automaticamente pelo front nesta empresa.';
  const buttonLabel = row.pendingReview
    ? 'Revisar'
    : isFallbackOnly
      ? 'Criar sobrescrita'
      : 'Salvar';

  return (
    <View
      style={[
        styles.itemCard,
        shadowStyle,
        row.pendingReview ? styles.itemCardPending : styles.itemCardReviewed,
      ]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemBadges}>
          <View
            style={[
              styles.badge,
              row.pendingReview ? styles.badgePending : styles.badgeReviewed,
            ]}>
            <Text
              style={[
                styles.badgeText,
                row.pendingReview ? styles.badgeTextPending : styles.badgeTextReviewed,
              ]}>
              {row.pendingReview ? 'Pendente' : 'Revisada'}
            </Text>
          </View>
          {isFallbackOnly ? (
            <View style={[styles.badge, styles.badgeFallback]}>
              <Text style={styles.badgeTextFallback}>Fallback</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.itemMeta}>
          {[row.store, row.type, row.key].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <Text style={styles.itemKey}>{row.key}</Text>

      {hasMainFallback ? (
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Empresa principal</Text>
          <Text style={styles.referenceText}>
            {row.mainTranslate || 'Sem traducao cadastrada na empresa principal.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.editorCard}>
        <Text style={styles.referenceLabel}>
          {isFallbackOnly ? 'Traducao da empresa ativa' : 'Sobrescrita da empresa ativa'}
        </Text>
        <TextInput
          multiline
          value={rowDraft}
          onChangeText={value => onDraftChange(row.rowId, value)}
          style={styles.editorInput}
          placeholder={row.mainTranslate || 'Digite a traducao'}
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
        />
        {isFallbackOnly && hasMainFallback ? (
          <Text style={styles.editorHint}>
            Sem sobrescrita propria ainda. Salvar aqui grava a traducao desta empresa.
          </Text>
        ) : null}
      </View>

      <View style={styles.itemFooter}>
        <Text style={styles.footerHint}>{footerHint}</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSaving || !String(rowDraft).trim()}
          onPress={() => onSave(row)}
          style={[
            styles.saveButton,
            { backgroundColor: brandColors.primary },
            (isSaving || !String(rowDraft).trim()) && styles.saveButtonDisabled,
          ]}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Icon name="save" size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{buttonLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
