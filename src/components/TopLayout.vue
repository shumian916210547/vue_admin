<template>
  <a-layout>
    <div :style="{ width: '100%', height: layoutHeaderHeight + 'px' }"></div>
    <a-layout-header
      :style="{
        position: 'fixed',
        zIndex: 1,
        width: '100%',
        display: 'flex',
        background:
          props.systemOptions.theme == 'light' ? 'rgb(255,255,255)' : '#001529',
        color: props.systemOptions.theme == 'light' ? '' : 'white',
        flexDirection: 'column',
      }"
      id="layoutHeader"
    >
      <div style="display: flex; align-items: center">
        <div
          :style="{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }"
        >
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
import { onMounted, ref } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    default: () => {},
    required: true,
  },
});

const layoutHeaderHeight = ref(0);
onMounted(() => {
  layoutHeaderHeight.value =
    document.getElementById("layoutHeader").clientHeight + 24;
});
</script>
