<template>
  <router-view />
</template>

<script setup>
document.title = sessionStorage.getItem("systemTitle") || "后台管理系统";

</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100%;
}
* {
  padding: 0;
  margin: 0;
}
</style>
