<template>
  <el-container class="top-layout" :class="{ 'top-layout--dark': props.systemOptions.theme === 'dark' }">
    <div
      class="top-layout__spacer"
      :style="{ height: `${layoutHeaderHeight}px` }"
      aria-hidden="true"
    ></div>
    <el-header
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
    </el-header>

    <slot name="layout-content"> </slot>
  </el-container>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    required: true,
  },
});

const layoutHeaderRef = ref(null);
const layoutHeaderHeight = ref(0);
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
 * 在下一帧读取头部尺寸，避免布局更新时立即修改占位高度造成反馈循环。
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
  if (headerSyncFrame) {
    window.cancelAnimationFrame(headerSyncFrame);
    headerSyncFrame = 0;
  }
  window.removeEventListener("resize", syncHeaderHeight);
});
</script>
