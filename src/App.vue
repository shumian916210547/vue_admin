<template>
  <router-view></router-view>
</template>

<script>
import { defineComponent, onMounted } from "vue";
import { findList } from "@/apis/devModule";
import { useStore } from "vuex";
export default defineComponent({
  setup() {
    const store = useStore();
    const loadModule = async () => {
      const { data, code } = await findList();
      if (code == 200) {
        store.commit("SETMODULES", data);
        sessionStorage.setItem("MODULES", JSON.stringify(data));
      }
    };

    onMounted(() => {
      const modules = JSON.parse(sessionStorage.getItem("MODULES")) || [];
      if (modules && modules.length) {
        store.commit("SETMODULES", modules);
      } else {
        loadModule();
      }
    });
  },
});
</script>

<style></style>
