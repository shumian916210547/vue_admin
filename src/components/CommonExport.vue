<template>
  <a-modal
    v-model:visible="visible"
    cancelText="取消"
    okText="确认"
    @cancel="handleCancel"
    width="100%"
    style="position: relative"
    @ok="handleOk"
  >
    <template #title>
      <div style="width: 100%; cursor: move">{{ className }}导出</div>
    </template>
    <div
      :style="{
        height: tableHeight + 'px',
        overflowY: 'scroll',
      }"
    >
      <a-table
        :row-selection="rowSelection"
        :columns="
          tableColumns.filter((column) => {
            return column.key != 'operation';
          })
        "
        :data-source="dataList"
        :pagination="false"
        :sticky="true"
        rowKey="objectId"
      >
        <template #bodyCell="{ column, record }">
          <CommonFields
            :column="column"
            :record="record"
            :fields="fields"
          ></CommonFields>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<script setup>
import { notification } from "ant-design-vue";
import { inject, reactive, ref, watch } from "vue";

import { findAll } from "@/service/base.service";
import { CsvSheet } from "@/utils/csv";
import { data_dict } from "@/utils/dataDict";

import CommonFields from "./CommonFields.vue";

const emit = defineEmits(["update:modalVisible"]);
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
  modalVisible: {
    type: Boolean,
    default: false,
  },
});

const schemaFields = inject("schemaFields");
const schemaColumns = inject("schemaColumns");
const visible = ref(props.modalVisible);
watch(
  () => props.modalVisible,
  (visibleValue) => {
    visible.value = visibleValue;
    if (visibleValue) void loadData(props.className);
  },
  { deep: true }
);

/**
 * 将弹窗内部可见状态同步回父组件，修复点击右上角关闭后父级仍认为弹窗打开的问题。
 * @param {boolean} visibleValue Ant Design Vue 更新后的弹窗可见状态。
 * @returns {void} 通过 update:modalVisible 更新父组件的 v-model。
 */
watch(visible, (visibleValue) => {
  if (visibleValue !== props.modalVisible) emit("update:modalVisible", visibleValue);
});

/**
 * 关闭导出弹窗。
 * @returns {void} 通知父组件更新 v-model 状态。
 */
const handleCancel = () => {
  emit("update:modalVisible", false);
};

const dataList = ref([]);
/**
 * 加载待导出数据表的记录，供用户勾选后生成 CSV。
 * @param {string} className 当前动态页面绑定的 Parse 类名；为空时跳过请求。
 * @returns {Promise<void>} 查询成功后替换 dataList；请求失败由调用链统一处理。
 */
const loadData = async (className) => {
  if (!className) return;
  try {
    const result = await findAll(className);
    dataList.value = [...result];
  } catch {
    dataList.value = [];
    notification.error({
      message: "导出数据加载失败",
      description: "请检查网络连接或权限后重试。",
    });
  }
};

const _selectedRows = ref([]);
const rowSelection = {
  onChange: (selectedRowKeys, selectedRows) => {
    _selectedRows.value = [...selectedRows];
  },
};

/**
 * 将勾选记录转换为带公式注入防护的 CSV 并下载，成功后自动关闭弹窗。
 * @returns {Promise<void>} 用户未选择记录时显示提示；下载触发后同步关闭弹窗。
 */
const handleOk = async () => {
  if (!_selectedRows.value.length) {
    notification.warning({ message: "请先选择需要导出的记录" });
    return;
  }
  const { columns, columnData } = generateData(
    _selectedRows.value,
    schemaColumns.value,
    schemaFields.value
  );
  const sheet1 = new CsvSheet(columns, columnData);
  sheet1.download(props.className + ".csv");
  emit("update:modalVisible", false);
};

/**
 * generateData 生成excel数据
 * @param {array} list 需要导出的数据列表
 * @param {array} tableColumns 表格表头
 * @param {object} fields 字段对象
 *
 */
const generateData = (list, tableColumns, fields) => {
  const sheetColumns = tableColumns.map((column) => column.title);
  const SheetColumnData = list.map((item) =>
    tableColumns.map((column) => data_dict(column, item, fields))
  );
  return { columns: sheetColumns, columnData: [...SheetColumnData] };
};

/**
 * generateDict 生成导入时需要翻译字段的字典
 * @param {array} list 需要导出的数据列表
 * @param {array} tableColumns 表格表头
 * @param {object} fields 字段对象
 *
 */
const generateDict = () => {};

const tableHeight = window.innerHeight * 0.65;
</script>

<style lang="scss" scoped>
</style>
