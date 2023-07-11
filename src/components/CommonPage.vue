<template>
  <CommonTable
    v-model:queryVal="queryState.name"
    :tableColumns="tableColumns"
    :tableData="tableData"
    :queryState="queryState"
    :innerContainer="innerContainer"
    :innerContainerTitle="innerContainerTitle"
    @onQueryReset="handleReset()"
    @onQuery="loadData(queryState)"
    @onInsert="handleInsert()"
    @onChange="queryState.onChange"
    @onDelete="handleDelete"
    @onEdit="handleEdit"
    @onAdd="emit('add', $event)"
  >
    <template
      v-if="innerContainer"
      #expandedRowRender="{ record, index, indent, expanded }"
    >
      <slot
        name="innerContainer"
        :record="record"
        :index="index"
        :indent="indent"
        :expanded="expanded"
      >
      </slot>
    </template>
  </CommonTable>
  <CommonForm
    :className="className"
    :fields="fields"
    :editState="editState"
    :type="formModal.type"
    v-model:modalVisible="formModal.show"
    @onOk="handleOk"
  ></CommonForm>
</template>
  
<script setup>
import CommonTable from "@/components/CommonTable.vue";
import CommonForm from "./CommonForm.vue";
import {
  findSchema,
  findList,
  InsertRow,
  removeById,
  UpdateById,
} from "@/service/base.service";
import { reactive, ref } from "vue";
import { deepClone } from "@/utils/utils";
const emit = defineEmits(["add"]);
const props = defineProps({
  className: {
    required: true,
    type: String,
  },
  innerContainer: {
    type: Boolean,
    default: false,
  },
  innerContainerTitle: {
    type: [Boolean, String],
    default: "新增",
  },
});
const queryState = reactive({
  pageSize: 10,
  pageNum: 1,
  name: "",
  total: 0,
  className: props.className,
  position: ["bottomRight"],
  showSizeChanger: true,
  showTotal: (total) => `Total ${total} items`,
  pageSizeOptions: ["10", "20", "50", "100"],
  onChange: (num, size) => {
    queryState.pageNum = num;
    queryState.pageSize = size;
    loadData(queryState);
  },
});

const formModal = reactive({
  show: false,
  type: "add",
});

let fields = reactive({});
const tableColumns = ref([]);

/* 获取table字段并且保存 */
const loadFields = async (query) => {
  const result = await findSchema(query);
  Object.keys(result.get("fields")).forEach((key) => {
    fields[key] = result.get("fields")[key];
  });
  loadColumns(fields);
};

/* 获取table表头 */
const loadColumns = async (arg) => {
  tableColumns.value = Object.keys(arg)
    .filter((key) => {
      return arg[key]["type"] == "String" || arg[key]["type"] == "Pointer";
    })
    .map((key) => ({
      title: arg[key].chineseName,
      dataIndex: key,
      key: key,
    }));
  tableColumns.value.push({
    title: "操作",
    dataIndex: "operation",
    key: "operation",
  });
};

const tableData = ref([]);

/* 获取表格数据 */
const loadData = async (query) => {
  const result = await findList(query);
  queryState.total = result.count;
  tableData.value = result.data;
};

/* 重置表格筛选数据 */
const handleReset = () => {
  queryState.name = "";
  loadData(queryState);
};

/* 点击新增 */
const handleInsert = () => {
  formModal.type = "add";
  formModal.show = true;
};

/* 点击删除 */
const handleDelete = async (arg) => {
  await removeById({ objectId: arg.objectId, className: props.className });
  loadData(queryState);
};

/* 点击ok按钮 */
const handleOk = async (arg) => {
  switch (formModal.type) {
    case "add":
      await InsertRow({
        className: props.className,
        params: arg,
        fields,
      });
      break;
    case "edit":
      await UpdateById({
        className: props.className,
        params: Object.assign({}, { objectId: editState.objectId }, arg),
        fields,
      });
      break;
    default:
      break;
  }

  formModal.show = false;
  loadData(queryState);
};

/* 点击编辑 */
const editState = reactive({});
const handleEdit = async (arg) => {
  arg = deepClone(arg);
  formModal.type = "edit";
  Object.keys(fields).forEach((key) => {
    if (fields[key].type == "Pointer") {
      editState[key] = arg[key].objectId;
    } else {
      editState[key] = arg[key];
    }
  });
  editState.objectId = arg.objectId;
  formModal.show = true;
};

await loadFields(queryState);
await loadData(queryState);

defineExpose({ loadData, queryState });
</script>