<template>
  <a-textarea
    size="small"
    v-model:value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :auto-size="{ minRows, maxRows }"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  value: { type: String, default: "" },
  placeholder: { type: String, default: "请输入内容..." },
  disabled: { type: Boolean, default: false },
  minHeight: { type: String, default: "300px" },
  maxHeight: { type: String, default: "600px" },
});

const emit = defineEmits(["update:value"]);
const rowsFromHeight = (height, fallback) => {
  const value = Number.parseInt(height, 10);
  return Number.isFinite(value) ? Math.max(3, Math.round(value / 24)) : fallback;
};
const minRows = computed(() => rowsFromHeight(props.minHeight, 8));
const maxRows = computed(() => rowsFromHeight(props.maxHeight, 24));
const modelValue = computed({
  get: () => props.value,
  set: (value) => emit("update:value", value),
});
</script>
