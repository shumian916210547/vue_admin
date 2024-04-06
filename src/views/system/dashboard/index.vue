<template>
  <iframe :src="url" frameborder="0" class="iframe"></iframe>
</template>

<script setup>
const url = `${
  window.process.env.VUE_APP_PARSE_DASHBOARD_HOST ||
  window.process.env.VUE_APP_PARSE_SERVER_HOST
}/dashboard/login`;
</script>

<style lang="scss" scoped>
.iframe {
  height: 100%;
  width: 100%;
}
</style>