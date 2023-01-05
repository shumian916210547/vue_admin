<template>
  <router-view></router-view>
</template>

<script>
import { defineComponent, onMounted } from "vue";

import { useStore } from "vuex";
export default defineComponent({
  setup() {
    const store = useStore();
    onMounted(() => {
      const modules = JSON.parse(sessionStorage.getItem("MODULES")) || [];
      if (modules && modules.length) {
        store.commit("SETMODULES", modules);
      }
    });
  },
});
</script>

<style></style>
