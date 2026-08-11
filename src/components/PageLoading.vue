<template>
  <router-view v-slot="{ Component, route }">
    <suspense>
      <template #default>
        <component :is="Component" :key="route.path" />
      </template>
      <template #fallback>
        <div class="pageLoading">
          <span class="page-loading__indicator" aria-label="正在加载">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在加载...
          </span>
        </div>
      </template>
    </suspense>
  </router-view>
</template>

<script setup>
import { Loading } from "@element-plus/icons-vue";
</script>

<style lang="scss" scoped>
.pageLoading {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-loading__indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--app-muted);
}
</style>
