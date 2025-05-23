import * as actions from "@controleonline/ui-default/src/store/default/actions";
import * as getters from "@controleonline/ui-default/src/store/default/getters";
import mutations from "@controleonline/ui-default/src/store/default/mutations";
import Formatter from "@controleonline/ui-common/src/utils/formatter.js";

export default {
  namespaced: true,
  state: {
 item:{},
items:[],
    resourceEndpoint: "translates",
    isLoading: false,
    error: "",
    violations: null,
    totalItems: 0,messages:[], message:{},
    filters: {},
    columns: [
      {
        editable: false,
        isIdentity: true,
        sortable: true,
        name: "id",
        align: "left",
        label: "id",
        sum: false,
        format: function (value) {
          return "#" + value;
        },
      },
      {
        sortable: true,
        name: "language",
        editable: false,        
        align: "left",
        label: "language",
        list: "language/getItems",
        searchParam: "language",
        externalFilter: false,
        format: function (value) {
          return value?.language;
        },

        saveFormat: function (value) {
          return value ? "/languages/" + (value.value || value) : null;
        },
      },      
      {
        sortable: true,
        name: "store",
        editable: false,
        label: "store",
        align: "left",     
        format(value, column, row) {
          return value;
        },
      },
      {
        sortable: true,
        name: "type",
        editable: false,
        label: "type",
        align: "left",     
        format(value, column, row) {
          return value;
        },
      },    
      {
        sortable: true,
        name: "key",
        editable: false,
        label: "key",
        align: "left",     
        format(value, column, row) {
          return value;
        },
      },         
      {
        sortable: true,
        name: "translate",
        editable: true,
        label: "translate",
        align: "left",     
        format(value, column, row) {
          return value;
        },
      },        
    ],
  },
  actions: actions,
  getters,
  mutations,
};
