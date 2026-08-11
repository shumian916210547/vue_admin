<template>
  <el-input
    size="small"
    v-model="modelValue"
    type="textarea"
    :placeholder="placeholder"
    :disabled="disabled"
    :autosize="{ minRows, maxRows }"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "请输入内容..." },
  disabled: { type: Boolean, default: false },
  minHeight: { type: String, default: "300px" },
  maxHeight: { type: String, default: "600px" },
});

const emit = defineEmits(["update:modelValue"]);
const rowsFromHeight = (height, fallback) => {
  const value = Number.parseInt(height, 10);
  return Number.isFinite(value) ? Math.max(3, Math.round(value / 24)) : fallback;
};
const minRows = computed(() => rowsFromHeight(props.minHeight, 8));
const maxRows = computed(() => rowsFromHeight(props.maxHeight, 24));
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
