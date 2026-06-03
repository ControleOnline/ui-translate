import * as actions from '@controleonline/ui-default/src/store/default/actions';
import * as getters from '@controleonline/ui-default/src/store/default/getters';
import mutations from '@controleonline/ui-default/src/store/default/mutations';
import * as customActions from './customActions';

export default {
  namespaced: true,
  state: {
    item: {},
    items: [],
    resourceEndpoint: 'translates',
    isLoading: false,
    isSaving: false,
    error: '',
    violations: null,
    totalItems: 0,
    messages: {},
    message: {},
    summary: {},
    filters: {},
    columns: [
      {
        editable: false,
        isIdentity: true,
        sortable: true,
        name: 'id',
        align: 'left',
        label: 'id',
        sum: false,
        format(value) {
          return '#' + value;
        },
      },
      {
        sortable: true,
        name: 'language',
        editable: false,
        align: 'left',
        label: 'language',
        list: 'language/getItems',
        searchParam: 'language',
        externalFilter: false,
        format(value) {
          return value?.language;
        },
        saveFormat(value) {
          return value ? '/languages/' + (value.value || value) : null;
        },
      },
      {
        sortable: true,
        name: 'store',
        editable: false,
        label: 'store',
        align: 'left',
        format(value) {
          return value;
        },
      },
      {
        sortable: true,
        name: 'type',
        editable: false,
        label: 'type',
        align: 'left',
        format(value) {
          return value;
        },
      },
      {
        sortable: true,
        name: 'key',
        editable: false,
        label: 'key',
        align: 'left',
        format(value) {
          return value;
        },
      },
      {
        sortable: true,
        name: 'translate',
        editable: true,
        label: 'translate',
        align: 'left',
        format(value) {
          return value;
        },
      },
    ],
  },
  actions: {
    ...customActions,
    ...actions,
  },
  getters,
  mutations,
};
