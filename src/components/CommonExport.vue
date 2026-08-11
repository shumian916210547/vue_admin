<template>
  <el-dialog
    v-model="visible"
    :title="`${className}导出`"
    width="min(100%, 1200px)"
    top="5vh"
    destroy-on-close
  >
    <div class="common-export__table-wrap" :style="{ height: `${tableHeight}px` }">
      <el-table
        ref="tableRef"
        v-loading="loading"
        size="small"
        width="100%"
        :data="dataList"
        row-key="objectId"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="52" reserve-selection />
        <el-table-column
          v-for="column in exportColumns"
          :key="column.key || column.dataIndex"
          :prop="column.dataIndex"
          :label="column.title"
          :width="column.width"
          :min-width="column.minWidth || 140"
          :fixed="column.fixed"
          :class-name="column.className"
        >
          <template #default="{ row }">
            <CommonFields :column="column" :record="row" :fields="fields" />
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button size="small" @click="handleCancel">取消</el-button>
      <el-button size="small" type="primary" :loading="exporting" @click="handleOk">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElNotification } from "element-plus";
import { computed, inject, reactive, ref, watch } from "vue";

import { findAll } from "@/service/base.service";
import { CsvSheet } from "@/utils/csv";
import { data_dict } from "@/utils/dataDict";

import CommonFields from "./CommonFields.vue";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  className: {
    required: true,
    type: String,
  },
  tableColumns: {
    type: Array,
    default: () => [],
    required: true,
  },
  fields: {
    required: true,
    type: Object,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const schemaFields = inject("schemaFields", ref({}));
const schemaColumns = inject("schemaColumns", ref([]));
const visible = ref(props.modelValue);
const loading = ref(false);
const exporting = ref(false);
const dataList = ref([]);
const selectedRows = ref([]);
const tableRef = ref();
const tableHeight = Math.max(240, Math.min(window.innerHeight * 0.65, 680));
const exportColumns = computed(() =>
  props.tableColumns.filter((column) => !["operation", "status"].includes(column.key))
);

/**
 * 将父组件的导出状态同步到 Element Plus Dialog，并在打开时加载全量数据。
 * @param {boolean} nextVisible 父组件传入的最新弹窗状态。
 * @returns {void} 更新本地状态并按需启动数据请求。
 */
watch(
  () => props.modelValue,
  (nextVisible) => {
    visible.value = nextVisible;
    if (nextVisible) void loadData(props.className);
  }
);

/**
 * 将 Element Plus Dialog 的关闭状态同步回父组件。
 * @param {boolean} nextVisible Dialog 最新可见状态。
 * @returns {void} 发出 update:modelValue 事件。
 */
watch(visible, (nextVisible) => {
  if (nextVisible !== props.modelValue) emit("update:modelValue", nextVisible);
});

/**
 * 关闭导出弹窗并清理本次勾选记录。
 * @returns {void} 更新本地和父级 v-model 状态。
 */
const handleCancel = () => {
  selectedRows.value = [];
  tableRef.value?.clearSelection?.();
  emit("update:modelValue", false);
};

/**
 * 加载待导出数据表的记录，供用户勾选后生成 CSV。
 * @param {string} className 当前动态页面绑定的 Parse 类名；为空时跳过请求。
 * @returns {Promise<void>} 查询成功后替换 dataList；请求失败时显示通知。
 */
const loadData = async (className) => {
  if (!className) return;
  loading.value = true;
  try {
    const result = await findAll(className);
    dataList.value = Array.isArray(result) ? [...result] : [];
  } catch {
    dataList.value = [];
    ElNotification.error({
      title: "导出数据加载失败",
      message: "请检查网络连接或权限后重试。",
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 接收 Element Plus 表格的选择变化。
 * @param {Array<Record<string, unknown>>} rows 当前选中的记录数组。
 * @returns {void} 保存当前导出选择。
 */
const handleSelectionChange = (rows) => {
  selectedRows.value = [...rows];
};

/**
 * 将勾选记录转换为带公式注入防护的 CSV 并下载，成功后自动关闭弹窗。
 * @returns {Promise<void>} 用户未选择记录时显示提示；下载触发后关闭弹窗。
 */
const handleOk = async () => {
  if (!selectedRows.value.length) {
    ElNotification.warning({ title: "导出提示", message: "请先选择需要导出的记录" });
    return;
  }
  exporting.value = true;
  try {
    const { columns, columnData } = generateData(
      selectedRows.value,
      schemaColumns.value,
      schemaFields.value
    );
    const sheet = new CsvSheet(columns, columnData);
    sheet.download(`${props.className}.csv`);
    emit("update:modelValue", false);
  } finally {
    exporting.value = false;
  }
};

/**
 * 生成 CSV 的列名和行数据。
 * @param {Array<Record<string, unknown>>} list 需要导出的数据列表。
 * @param {Array<Record<string, unknown>>} columns 表格字段列定义。
 * @param {Record<string, unknown>} fields Schema 字段元数据。
 * @returns {{columns: string[], columnData: unknown[][]}} CSV 标题和数据行。
 */
const generateData = (list, columns, fields) => {
  const sheetColumns = columns.map((column) => column.title);
  const columnData = list.map((item) =>
    columns.map((column) => data_dict(column, item, fields))
  );
  return { columns: sheetColumns, columnData };
};
</script>

<style lang="scss" scoped>
.common-export__table-wrap {
  min-height: 240px;
  overflow: auto;
}
</style>
