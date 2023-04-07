<template>
  <iframe
    :src="baseUrl + '/dashboard'"
    frameborder="0"
    style="height: 100%; width: 100%"
  ></iframe>
</template>
<script>
import { defineComponent, onMounted, ref } from "vue";

export default defineComponent({
  setup() {
    let baseUrl = ref("");
    baseUrl.value = process.env.VUE_APP_BASE_API;
    return {
      baseUrl,
    };
  },
});
</script>
