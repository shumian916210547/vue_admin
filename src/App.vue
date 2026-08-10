<template>
  <a-config-provider :component-size="'small'" :locale="locale">
    <router-view />
  </a-config-provider>
</template>

<script setup>
import locale from "ant-design-vue/es/locale/zh_CN";

document.title = sessionStorage.getItem("systemTitle") || "后台管理系统";
</script>

<style lang="scss">
#app {
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
}
* {
  padding: 0;
  margin: 0;
}
</style>
