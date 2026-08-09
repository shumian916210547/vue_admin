<template>
  <a-layout class="top-layout" :class="{ 'top-layout--dark': props.systemOptions.theme === 'dark' }">
    <div class="top-layout__spacer" :style="{ height: layoutHeaderHeight + 'px' }"></div>
    <a-layout-header
      class="top-layout__header"
      id="layoutHeader"
    >
      <div class="top-layout__main">
        <div class="top-layout__navigation">
          <slot name="layout-menu"></slot>
        </div>

        <slot name="layout-header-right"></slot>
      </div>

      <slot name="layout-tags"> </slot>
    </a-layout-header>

    <slot name="layout-content"> </slot>
  </a-layout>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    default: () => {},
    required: true,
  },
});

const layoutHeaderHeight = ref(0);
let resizeObserver;

/**
 * 读取固定顶栏真实高度，为内容区保留等量空间，避免页签开关或窄屏换行后遮挡首屏内容。
 * @returns {void} 更新布局占位元素的响应式高度值，单位为像素。
 */
const syncHeaderHeight = () => {
  const header = document.getElementById("layoutHeader");
  layoutHeaderHeight.value = header ? header.clientHeight + 20 : 0;
};

onMounted(async () => {
  await nextTick();
  syncHeaderHeight();
  const header = document.getElementById("layoutHeader");
  if (header && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(syncHeaderHeight);
    resizeObserver.observe(header);
  }
  window.addEventListener("resize", syncHeaderHeight);
});

watch(
  () => props.systemOptions.showTags,
  async () => {
    await nextTick();
    syncHeaderHeight();
  }
);

onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", syncHeaderHeight);
});
</script>

<style lang="scss">
.top-layout__header {
  position: fixed;
  z-index: 10;
  display: flex;
  width: 100%;
  padding: 0;
  color: var(--app-text) !important;
  background: var(--app-glass-surface) !important;
  border-bottom: 1px solid var(--app-glass-border);
  box-shadow: 0 8px 24px rgba(var(--app-primary-rgb), 0.05);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
  flex-direction: column;
}

.top-layout--dark .top-layout__header {
  color: var(--app-text) !important;
  background: var(--app-glass-surface) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.top-layout__main,
.top-layout__navigation {
  display: flex;
  min-width: 0;
  align-items: center;
}

.top-layout__main {
  min-height: 64px;
  justify-content: space-between;
}

.top-layout__navigation {
  flex: 1;
}

.top-layout__navigation .app-brand {
  flex: 0 0 228px;
}

.top-layout__navigation .app-menu {
  flex: 1;
  min-width: 0;
  line-height: 64px;
  background: transparent;
}

.top-layout__navigation .ant-menu-horizontal > .ant-menu-item,
.top-layout__navigation .ant-menu-horizontal > .ant-menu-submenu {
  top: 0;
  width: auto;
  height: 44px;
  margin: 10px 4px;
  line-height: 44px;
  border-radius: 8px;
}

.top-layout--dark .header-right:hover,
.top-layout--dark .header-action-icon:hover {
  color: var(--app-primary);
  background: var(--app-primary-soft);
}

.top-layout--dark .header-user-name,
.top-layout--dark .header-action-icon {
  color: var(--app-text);
}

@media (max-width: 768px) {
  .top-layout__navigation .app-menu {
    display: none;
  }

  .top-layout__navigation .app-brand {
    flex-basis: auto;
  }
}
</style>
