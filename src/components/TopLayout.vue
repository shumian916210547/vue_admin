<template>
  <a-layout class="top-layout" :class="{ 'top-layout--dark': props.systemOptions.theme === 'dark' }">
    <div
      class="top-layout__spacer"
      :style="{ height: `${layoutHeaderHeight}px` }"
      aria-hidden="true"
    ></div>
    <a-layout-header
      ref="layoutHeaderRef"
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

const layoutHeaderRef = ref(null);
const layoutHeaderHeight = ref(0);
let resizeObserver;
let headerSyncFrame = 0;

/**
 * 读取固定顶栏真实高度，为内容区保留等量空间，避免页签开关或窄屏换行后遮挡首屏内容。
 * @returns {void} 更新布局占位元素的响应式高度值，单位为像素。
 */
const measureHeaderHeight = () => {
  const header = layoutHeaderRef.value?.$el || layoutHeaderRef.value;
  const measuredHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  if (layoutHeaderHeight.value !== measuredHeight) {
    layoutHeaderHeight.value = measuredHeight;
  }
};

/**
 * 在下一帧读取头部尺寸，避免 ResizeObserver 回调中立即修改布局造成循环通知。
 * @returns {void} 合并同一帧内的尺寸同步任务；不触发接口请求。
 */
const syncHeaderHeight = () => {
  if (typeof window === "undefined") {
    measureHeaderHeight();
    return;
  }

  if (headerSyncFrame) {
    window.cancelAnimationFrame(headerSyncFrame);
  }
  headerSyncFrame = window.requestAnimationFrame(() => {
    headerSyncFrame = 0;
    measureHeaderHeight();
  });
};

onMounted(async () => {
  await nextTick();
  syncHeaderHeight();
  const header = layoutHeaderRef.value?.$el || layoutHeaderRef.value;
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
  if (headerSyncFrame) {
    window.cancelAnimationFrame(headerSyncFrame);
    headerSyncFrame = 0;
  }
  window.removeEventListener("resize", syncHeaderHeight);
});
</script>

<style lang="scss">
.top-layout__spacer {
  flex: 0 0 auto;
  width: 100%;
}

.top-layout__header {
  position: fixed;
  z-index: 10;
  display: flex;
  width: 100%;
  padding: 0 !important;
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
  width: 100%;
  min-height: 64px;
  justify-content: space-between;
}

.top-layout__navigation {
  flex: 1 1 auto;
}

.top-layout__navigation .app-brand {
  flex: 0 0 228px;
  width: 228px;
  min-width: 0;
}

.top-layout__main > .header-actions {
  flex: 0 0 auto;
  min-width: 0;
}

.top-layout__navigation .app-menu {
  flex: 1;
  min-width: 0;
  line-height: 64px;
  overflow-x: auto;
  scrollbar-width: none;
  background: transparent;
}

.top-layout__navigation .app-menu::-webkit-scrollbar {
  display: none;
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
  .top-layout__header {
    padding: 0 !important;
  }

  .top-layout__navigation .app-menu {
    display: none;
  }

  .top-layout__navigation .app-brand {
    flex: 1 1 auto;
    width: auto;
  }
}
</style>
