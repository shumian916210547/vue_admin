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
import CommonFields from "./CommonFields.vue";
import { findAll } from "@/service/base.service";
import { data_dict } from "@/utils/dataDict";
import { Sheet } from "@/utils/xlsx";
import { inject, reactive, ref, watch } from "vue";
import { writeFile } from "xlsx";

const emit = defineEmits(["update:modalVisible"]);
const props = defineProps({
  className: {
    required: true,
    type: String,
  },
  tableColumns: {
    type: Array,
    defult: () => new Array(),
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
  (n, o) => {
    visible.value = n;
    if (n) loadData(props.className);
  },
  { deep: true }
);
const handleCancel = () => {
  emit("update:modalVisible", false);
};

const dataList = ref([]);
const loadData = async (className) => {
  if (!className) return;
  const result = await findAll(className);
  dataList.value = [...result];
};

const _selectedRows = ref([]);
const rowSelection = {
  onChange: (selectedRowKeys, selectedRows) => {
    _selectedRows.value = [...selectedRows];
  },
};

const handleOk = () => {
  if (!_selectedRows.value.length) return;
  const { columns, columnData } = generateData(
    _selectedRows.value,
    schemaColumns.value,
    schemaFields.value
  );
  const sheet1 = new Sheet("sheet1", columns, columnData);
  writeFile(sheet1.wb, props.className + ".xlsx");
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