<template>
  <commonPageVue
    :fields="fields"
    :className="className"
    :companyId="companyId"
    :columns="columns"
    :modalWidth="1000"
  ></commonPageVue>
</template>
<script>
import { computed, defineComponent, toRefs, watch } from "vue";
import commonPageVue from "@/components/commonPage.vue";
import richTextVue from "@/components/richText.vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

export default defineComponent({
  components: { commonPageVue, richTextVue },

  setup() {
    const route = useRoute();
    const store = useStore();
    let { meta } = route;

    return {
      ...toRefs(meta),
    };
  },
});
</script>
