<template>
  <Translate :context="context" v-if="context" />
</template>

<script>
import Translate from "@controleonline/ui-translate/src/components/Details.vue";

export default {
  components: {
    Translate,
  },

  data() {
    return {
      context: "",
    };
  },
  created() {},
};
</script>
