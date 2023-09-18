<template>
  <a-layout>
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
        :style="{
          background: '#fff',
          padding: 0,
          display: 'flex',
          zIndex: 1,
          flexDirection: 'column',
        }"
        id="layoutHeader"
      >
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 60px;
            padding: 0 10px;
          "
        >
          <component
            :is="AntdIcon['MenuUnfoldOutlined']"
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          ></component>

          <component
            :is="props.AntdIcon['MenuFoldOutlined']"
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
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
import { onMounted, ref, watch } from "vue";

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
</script>
