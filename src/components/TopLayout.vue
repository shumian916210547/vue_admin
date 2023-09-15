<template>
  <a-layout>
    <a-layout-header
      :style="{
        position: 'fixed',
        zIndex: 1,
        width: '100%',
        display: 'flex',
        background:
          props.systemOptions.theme == 'light' ? 'rgb(255,255,255)' : '#001529',
        color: props.systemOptions.theme == 'light' ? '' : 'white',
      }"
    >
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
    </a-layout-header>
    <slot name="layout-content"> </slot>
  </a-layout>
</template>

<script setup>
const props = defineProps({
  systemOptions: {
    type: Object,
    default: () => {},
    required: true,
  },
});
</script>
