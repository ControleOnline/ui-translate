import * as types from '@controleonline/ui-default/src/store/default/mutation_types';

const normalizeLanguage = value =>
  String(value || '')
    .trim()
    .replace(/_/g, '-')
    .toLowerCase();

const normalizeId = value =>
  String(value || '')
    .replace(/\D+/g, '')
    .trim();

const normalizeText = value => String(value || '').trim();

const cloneMessages = messages =>
  messages && typeof messages === 'object' && !Array.isArray(messages)
    ? {...messages}
    : {};

const getLanguageBucket = (messages, language) => {
  const normalizedLanguage = normalizeLanguage(language);
  if (!normalizedLanguage) {
    return null;
  }

  return messages[normalizedLanguage] || null;
};

const getCompanyBucket = (messages, language, companyId) => {
  const languageBucket = getLanguageBucket(messages, language);
  if (!languageBucket) {
    return null;
  }

  const normalizedCompanyId = normalizeId(companyId);
  if (!normalizedCompanyId) {
    return null;
  }

  const companiesBucket = languageBucket.companies;
  if (!companiesBucket || typeof companiesBucket !== 'object') {
    return null;
  }

  return companiesBucket[normalizedCompanyId] || null;
};

const getStoreBucket = (messages, language, companyId, store) => {
  const companyBucket = getCompanyBucket(messages, language, companyId);
  if (!companyBucket) {
    return null;
  }

  const normalizedStore = normalizeText(store);
  if (!normalizedStore) {
    return null;
  }

  return companyBucket[normalizedStore] || null;
};

const setNestedValue = (messages, language, companyId, store, type, key, value) => {
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedCompanyId = normalizeId(companyId);
  const normalizedStore = normalizeText(store);
  const normalizedType = normalizeText(type);
  const normalizedKey = normalizeText(key);

  if (
    !normalizedLanguage ||
    !normalizedCompanyId ||
    !normalizedStore ||
    !normalizedType ||
    !normalizedKey
  ) {
    return cloneMessages(messages);
  }

  const nextMessages = cloneMessages(messages);
  const languageBucket = {
    ...(nextMessages[normalizedLanguage] || {}),
  };
  const companiesBucket = {
    ...(languageBucket.companies || {}),
  };
  const companyBucket = {
    ...(companiesBucket[normalizedCompanyId] || {}),
  };
  const storeBucket = {
    ...(companyBucket[normalizedStore] || {}),
  };
  const typeBucket = {
    ...(storeBucket[normalizedType] || {}),
  };

  typeBucket[normalizedKey] = value;
  storeBucket[normalizedType] = typeBucket;
  companyBucket[normalizedStore] = storeBucket;
  companiesBucket[normalizedCompanyId] = companyBucket;
  languageBucket.companies = companiesBucket;
  nextMessages[normalizedLanguage] = languageBucket;

  return nextMessages;
};

const deleteNestedValue = (messages, language, companyId, store, type, key) => {
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedCompanyId = normalizeId(companyId);
  const normalizedStore = normalizeText(store);
  const normalizedType = normalizeText(type);
  const normalizedKey = normalizeText(key);

  if (
    !normalizedLanguage ||
    !normalizedCompanyId ||
    !normalizedStore ||
    !normalizedType ||
    !normalizedKey
  ) {
    return cloneMessages(messages);
  }

  const nextMessages = cloneMessages(messages);
  const languageBucket = nextMessages[normalizedLanguage];
  if (!languageBucket || typeof languageBucket !== 'object') {
    return nextMessages;
  }

  const companiesBucket = languageBucket.companies;
  const companyBucket = companiesBucket?.[normalizedCompanyId];
  const storeBucket = companyBucket?.[normalizedStore];
  const typeBucket = storeBucket?.[normalizedType];

  if (!typeBucket || !Object.prototype.hasOwnProperty.call(typeBucket, normalizedKey)) {
    return nextMessages;
  }

  const nextTypeBucket = {...typeBucket};
  delete nextTypeBucket[normalizedKey];

  const nextStoreBucket = {...storeBucket};
  if (Object.keys(nextTypeBucket).length > 0) {
    nextStoreBucket[normalizedType] = nextTypeBucket;
  } else {
    delete nextStoreBucket[normalizedType];
  }

  const nextCompanyBucket = {...companyBucket};
  if (Object.keys(nextStoreBucket).length > 0) {
    nextCompanyBucket[normalizedStore] = nextStoreBucket;
  } else {
    delete nextCompanyBucket[normalizedStore];
  }

  const nextCompaniesBucket = {...companiesBucket};
  if (Object.keys(nextCompanyBucket).length > 0) {
    nextCompaniesBucket[normalizedCompanyId] = nextCompanyBucket;
  } else {
    delete nextCompaniesBucket[normalizedCompanyId];
  }

  const nextLanguageBucket = {
    ...languageBucket,
  };
  if (Object.keys(nextCompaniesBucket).length > 0) {
    nextLanguageBucket.companies = nextCompaniesBucket;
  } else {
    delete nextLanguageBucket.companies;
  }

  if (Object.keys(nextLanguageBucket).length > 0) {
    nextMessages[normalizedLanguage] = nextLanguageBucket;
  } else {
    delete nextMessages[normalizedLanguage];
  }

  return nextMessages;
};

export const queueMissingTranslate = ({commit, getters}, payload = {}) => {
  const language = normalizeLanguage(payload.language);
  const companyId = normalizeId(payload.companyId || payload.people);
  const store = normalizeText(payload.store);
  const type = normalizeText(payload.type);
  const key = normalizeText(payload.key);
  const translate = normalizeText(payload.translate);

  if (!language || !companyId || !store || !type || !key) {
    return getters.messages || {};
  }

  const currentMessages = cloneMessages(getters.messages);
  const existingMessage = getStoreBucket(currentMessages, language, companyId, store)?.[type]?.[key];
  if (existingMessage === translate) {
    return currentMessages;
  }

  const nextMessages = setNestedValue(
    currentMessages,
    language,
    companyId,
    store,
    type,
    key,
    translate,
  );

  commit(types.SET_MESSAGES, nextMessages);
  return nextMessages;
};

export const removePendingTranslate = ({commit, getters}, payload = {}) => {
  const language = normalizeLanguage(payload.language);
  const companyId = normalizeId(payload.companyId || payload.people);
  const store = normalizeText(payload.store);
  const type = normalizeText(payload.type);
  const key = normalizeText(payload.key);

  if (!language || !companyId || !store || !type || !key) {
    return getters.messages || {};
  }

  const currentMessages = cloneMessages(getters.messages);
  const nextMessages = deleteNestedValue(
    currentMessages,
    language,
    companyId,
    store,
    type,
    key,
  );

  commit(types.SET_MESSAGES, nextMessages);
  return nextMessages;
};
