<template>
  <router-view v-slot="{ Component, route }">
    <suspense>
      <template #default>
        <component :is="Component" :key="route.path" />
      </template>
      <template #fallback>
        <div class="example">
          <a-spin tip="loading..." size="large" />
        </div>
      </template>
    </suspense>
  </router-view>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "Layout",
  setup() {
    return {};
  },
});
</script>