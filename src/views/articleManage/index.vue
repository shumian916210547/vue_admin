<template>
  <commonPageVue
    :columns="columns"
    :className="className"
    :companyId="companyId"
  />
</template>
<script>
import { defineComponent, toRefs } from "vue";
import commonPageVue from "@/components/commonPage.vue";
import { useRoute } from "vue-router";
export default defineComponent({
  components: { commonPageVue },

  setup() {
    const route = useRoute();
    const { meta } = route;

    return {
      ...toRefs(meta),
    };
  },
});
</script>
