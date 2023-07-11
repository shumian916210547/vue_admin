<template>
  <router-view v-slot="{ Component, route }">
    <suspense>
      <template #default>
        <component :is="Component" :key="route.path" />
      </template>
      <template #fallback>
        <div class="pageLoading">
          <a-spin tip="loading..." size="large" />
        </div>
      </template>
    </suspense>
  </router-view>
</template>

<style lang="scss" scoped>
.pageLoading {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>