<template>
  <a-layout class="left-layout" :class="{ 'left-layout--dark': props.systemOptions.theme === 'dark' }">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      :theme="props.systemOptions.theme"
      collapsible
    >
      <slot name="layout-menu"></slot>
    </a-layout-sider>
    <a-layout>
      <a-layout-header
        class="left-layout__header"
        id="layoutHeader"
      >
        <div class="left-layout__header-main">
          <component
            :is="props.AntdIcon['MenuUnfoldOutlined']"
            v-if="collapsed"
            class="trigger"
            @click="toggleCollapsed"
          ></component>

          <component
            :is="props.AntdIcon['MenuFoldOutlined']"
            v-else
            class="trigger"
            @click="toggleCollapsed"
          ></component>

          <slot name="layout-header-right"></slot>
        </div>

        <slot name="layout-tags"> </slot>
      </a-layout-header>
      <slot name="layout-content"> </slot>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    default: () => {},
    required: true,
  },
  AntdIcon: {
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
  color: var(--app-text) !important;
  background: var(--app-glass-surface) !important;
  border-bottom: 1px solid var(--app-glass-border);
  box-shadow: 0 8px 24px rgba(var(--app-primary-rgb), 0.04);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  flex-direction: column;
}

.left-layout__header-main {
  display: flex;
  height: 64px;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
}

.left-layout--dark .left-layout__header {
  color: var(--app-text) !important;
  background: var(--app-glass-surface) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
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
</style>
