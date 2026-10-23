<template>
  <el-container class="left-layout" :class="{ 'left-layout--dark': props.systemOptions.theme === 'dark' }">
    <el-aside
      :width="collapsed ? '64px' : '228px'"
      :class="['left-layout__aside', { 'left-layout--collapsed': collapsed }]"
    >
      <slot name="layout-menu" :collapsed="collapsed"></slot>
    </el-aside>
    <el-container class="left-layout__main">
      <el-header
        class="left-layout__header"
        id="layoutHeader"
      >
        <div class="left-layout__header-main">
          <button
            type="button"
            :aria-label="collapsed ? '展开导航' : '收起导航'"
            :aria-expanded="!collapsed"
            class="trigger"
            @click="toggleCollapsed"
          ><el-icon><component :is="props.iconMap[collapsed ? 'MenuUnfoldOutlined' : 'MenuFoldOutlined']" /></el-icon></button>

          <slot name="layout-header-right"></slot>
        </div>

        <slot name="layout-tags"> </slot>
      </el-header>
      <slot name="layout-content"> </slot>
    </el-container>
  </el-container>
</template>

<script setup>
import { useMediaQuery } from "@vueuse/core";
import { ref, watch } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    required: true,
  },
  iconMap: {
    type: Object,
    required: true,
  },
});
const isNarrow = useMediaQuery("(max-width: 768px)");
const collapsed = ref(isNarrow.value);

/**
 * 跨越窄屏断点时同步侧栏折叠状态，为内容保留宽度；用户仍可通过导航按钮手动展开。
 * @param {boolean} narrow 必填；视口不大于 768 CSS 像素时为 true。
 * @returns {void} 只更新当前布局状态，不读取权限或发起请求。
 */
watch(isNarrow, (narrow) => {
  collapsed.value = narrow;
});

/**
 * 切换侧边栏展开状态。
 * @returns {void} 仅更新当前布局实例的响应式折叠状态。
 */
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};
</script>
