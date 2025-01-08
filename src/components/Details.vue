<template>
  <DefaultDetail :configs="configs" :id="translateId" />
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import DefaultDetail from "@controleonline/ui-default/src/components/Default/Common/DefaultDetail.vue";

export default {
  components: { DefaultDetail },
  data() {
    return {
      translateId: null,
    }

  },
  created() {
    this.translateId = decodeURIComponent(this.$route.params.id);
  },
  computed: {
    ...mapGetters({
      defaultCompany: "people/defaultCompany",
    }),

    configs() {
      return {
        externalFilters: false,
        store: "translate",
        categories: ["translate"],
        add: true,
        delete: true,
        filters: true,
        selection: false,
        search: false,
        columns: {
          category: {
            filters: {
              context: "translate",
              company: "/people/" + this.defaultCompany.id,
            },
          },
        },
      };
    },
  },
};
</script>
