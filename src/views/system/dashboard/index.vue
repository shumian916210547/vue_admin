<template>
  <iframe :src="url" frameborder="0" class="iframe"></iframe>
</template>

<script setup>
const url = `http://127.0.0.1:1337/dashboard/apps/back-server`;
</script>

<style lang="scss" scoped>
.iframe {
  height: 100%;
  width: 100%;
}
</style>