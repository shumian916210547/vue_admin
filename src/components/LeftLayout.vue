<template>
  <el-container class="left-layout" :class="{ 'left-layout--dark': props.systemOptions.theme === 'dark' }">
    <el-aside
      :width="collapsed ? '64px' : '228px'"
      :class="['left-layout__aside', { 'left-layout--collapsed': collapsed }]"
    >
      <slot name="layout-menu"></slot>
    </el-aside>
    <el-container class="left-layout__main">
      <el-header
        class="left-layout__header"
        id="layoutHeader"
      >
        <div class="left-layout__header-main">
          <el-icon
            v-if="collapsed"
            class="trigger"
            @click="toggleCollapsed"
          ><component :is="props.iconMap['MenuUnfoldOutlined']" /></el-icon>

          <el-icon
            v-else
            class="trigger"
            @click="toggleCollapsed"
          ><component :is="props.iconMap['MenuFoldOutlined']" /></el-icon>

          <slot name="layout-header-right"></slot>
        </div>

        <slot name="layout-tags"> </slot>
      </el-header>
      <slot name="layout-content"> </slot>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    default: () => {},
    required: true,
  },
  iconMap: {
    type: Object,
    default: () => {},
    required: true,
  },
});
const collapsed = ref(false);

/**
 * 切换侧边栏展开状态。
 * @returns {void} 仅更新当前布局实例的响应式折叠状态。
 */
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style lang="scss">
.left-layout__header {
  z-index: 1;
  padding: 0;
  color: var(--app-text);
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border-soft);
  box-shadow: 0 1px 8px rgba(var(--app-primary-rgb), 0.035);
  flex-direction: column;
}

.left-layout__aside {
  display: flex;
  min-height: 100vh;
  overflow: hidden;
  flex-direction: column;
  transition: width var(--app-transition);
}

.left-layout__header-main {
  display: flex;
  height: 64px;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
}

.left-layout--dark .left-layout__header {
  color: var(--app-text);
  background: var(--app-surface);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.16);
}

.left-layout .trigger {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--app-text);
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  place-items: center;
  transition: color var(--app-transition), background-color var(--app-transition);
}

.left-layout .trigger:hover {
  color: var(--app-primary);
  background: var(--app-primary-soft);
}

.left-layout--dark .trigger {
  color: var(--app-text);
}

.left-layout--dark .trigger:hover {
  color: var(--app-primary);
  background: var(--app-primary-soft);
}

@media (max-width: 768px) {
  .left-layout__header {
    padding: 0;
  }

  .left-layout__header-main {
    min-width: 0;
    padding: 0 8px;
  }

  .left-layout__main {
    min-width: 0;
  }
}
</style>
