<template>
  <el-dialog
    v-model="visible"
    class="common-preview"
    :title="className"
    :width="dialogWidth"
    draggable
    destroy-on-close
  >
    <el-descriptions :title="dataMap.name" :column="2" border size="small">
      <el-descriptions-item
        v-for="(key, index) in Object.keys(props.fields)"
        :key="index"
        :label="props.fields[key].chineseName"
      >
        {{ colValue(dataMap[key], props.fields[key]) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  className: {
    required: true,
    type: String,
  },
  fields: {
    required: true,
    type: Object,
  },
  dataMap: {
    required: true,
    type: Object,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const visible = ref(props.modelValue);
const modalWidth = ref("600px");

/**
 * 将父组件的预览可见状态同步到 Element Plus Dialog。
 * @param {boolean} nextVisible 父组件传入的最新可见状态。
 * @returns {void} 更新本地受控状态，不发起请求。
 */
watch(
  () => props.modelValue,
  (nextVisible) => {
    visible.value = nextVisible;
  }
);

/**
 * 将 Dialog 的关闭动作同步回父组件的 v-model。
 * @param {boolean} nextVisible Element Plus Dialog 的最新可见状态。
 * @returns {void} 发出 update:modelValue 事件。
 */
watch(visible, (nextVisible) => {
  if (nextVisible !== props.modelValue) emit("update:modelValue", nextVisible);
});

/**
 * 将 Parse 的数组或 Pointer 值转换为可读的详情文本。
 * @param {unknown} value 当前字段值，可为空、数组或 Pointer 对象。
 * @param {{type?: string, isPointer?: boolean}} colOption 字段类型和 Pointer 标识。
 * @returns {string | unknown} 适合在详情单元格中展示的值。
 */
const colValue = (value, colOption) => {
  if (value === null || value === undefined || value === "") return "未设置";
  if (colOption.type === "Array" && Array.isArray(value)) {
    return value
      .map((item) => (colOption.isPointer ? item?.name || item?.objectId : item))
      .filter(Boolean)
      .join("\n");
  }
  if (colOption.type === "Pointer") return value?.name || value?.objectId || value;
  return value;
};

const dialogWidth = computed(() => (window.innerWidth < 700 ? "calc(100% - 24px)" : modalWidth.value));
</script>
