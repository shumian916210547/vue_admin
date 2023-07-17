<template>
  <iframe :src="url" frameborder="0" class="iframe"></iframe>
</template>

<script setup>
const url = `${process.env.VUE_APP_PARSE_SERVER_HOST}/dashboard`;
</script>

<style lang="scss" scoped>
.iframe {
  height: 100%;
  width: 100%;
}
</style>