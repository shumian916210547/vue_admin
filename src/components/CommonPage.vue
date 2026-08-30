<template>
  <CommonTable
    v-model:queryVal="queryState.where"
    :className="className"
    :tableColumns="tableColumns"
    :tableData="tableData"
    :queryState="queryState"
    :innerContainer="innerContainer"
    :innerContainerTitle="innerContainerTitle"
    :fields="fields"
    :tableLoading="tableLoading"
    @onQueryReset="handleReset()"
    @onQuery="loadData(queryState)"
    @onInsert="handleInsert()"
    @onChange="handleTableChange"
    @onDelete="handleDelete"
    @onEdit="handleEdit"
    @onAdd="emit('add', $event)"
    @onPreview="handlePreview"
  >
    <template #top>
      <slot name="top"></slot>
    </template>
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
    :fields="formFields"
    :editState="editState"
    :type="formModal.type"
    v-model="formModal.show"
    @onOk="handleOk"
  ></CommonForm>
  <CommonPreview
    :className="className"
    :fields="formFields"
    v-model="previewMap.show"
    :dataMap="previewMap.data"
  >
  </CommonPreview>
</template>

<script setup>
import CommonTable from "@/components/CommonTable.vue";
import CommonForm from "./CommonForm.vue";
import CommonPreview from "./commonPreview.vue";
import {
  findSchema,
  findList,
  InsertRow,
  removeById,
  UpdateById,
} from "@/service/base.service";
import { provide, reactive, ref } from "vue";
import { deepClone } from "@/utils/utils";
import { normalizeEditComponent } from "@/utils/element";
import { defaultFields } from "@/service/schema.service";
import { Mixins } from "@/mixins";
import { ElNotification } from "element-plus";
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
const { getFilterField } = Mixins();
let fields = reactive({});
const queryState = reactive({
  pageSize: 10,
  pageNum: 1,
  current: 1,
  where: {},
  total: 0,
  className: props.className,
  filterFilds: {},
});

const formModal = reactive({
  show: false,
  type: "add",
});

const systemFields = defaultFields.map((item) => item.fieldName);

const tableColumns = ref([]);

let schemaFields = ref({});

const formFields = reactive({});
provide("schemaFields", schemaFields);
/* 获取table字段并且保存 */
const loadFields = async (query) => {
  const result = await findSchema(query);
  if (!result) return;

  Object.keys(result.get("fields")).forEach((key) => {
    const field = result.get("fields")[key] || {};
    fields[key] = {
      ...field,
      editComponent: normalizeEditComponent(field.editComponent),
    };

    /* 筛选系统字段，不在新增或者修改表单中展示 */
    if (!systemFields.includes(key)) {
      formFields[key] = fields[key];
    }
  });
  getFilterField(fields).forEach((key) => {
    queryState.filterFilds[key] = fields[key];
  });
  schemaFields.value = fields;
  loadColumns(fields);
};

/* 获取table表头 */
const schemaColumns = ref([]);
provide("schemaColumns", schemaColumns);
const loadColumns = async (fields) => {
  schemaColumns.value = Object.keys(fields).map((key) => ({
    title: fields[key].chineseName,
    dataIndex: key,
    key: key,
    resizable: true,
    minWidth: 200,
  }));
  tableColumns.value = schemaColumns.value.filter((item) => {
    return fields[item.dataIndex].isTable;
  });
  tableColumns.value.push({
    title: "操作",
    dataIndex: "operation",
    key: "operation",
    resizable: true,
    fixed: "right",
    minWidth: 320,
    className: "table-operation-column",
  });
};

const tableData = ref([]);
const tableLoading = ref(false);

/**
 * 按当前统一分页与筛选状态加载业务表数据。成功加载不再提示“数据获取成功”，避免翻页、筛选时
 * 反复弹出无操作价值的通知；异常由统一错误路径显示且保留已展示的数据。
 * @param {{pageNum: number, pageSize: number, where: Record<string, unknown>, className: string}} query 当前查询状态。
 * @returns {Promise<void>} 数据与总数更新完成，或错误通知显示后兑现。
 */
const loadData = async (query) => {
  tableLoading.value = true;
  try {
    const result = await findList(query);
    const records = Array.isArray(result?.data) ? result.data : [];
    queryState.total = Number.isFinite(result?.count) ? result.count : 0;
    tableData.value = records.sort((a, b) => {
      if (a.rank || b.rank) {
        return a.rank - b.rank;
      }
      return a.createdAt - b.createdAt;
    });
  } catch (error) {
    ElNotification.error({
      title: "数据加载失败",
      message: error.message || "请检查网络连接、筛选条件或当前账号权限后重试。",
    });
  } finally {
    tableLoading.value = false;
  }
};

/**
 * 清空通用表格筛选并回到第一页，防止重置条件后仍停留在不存在的旧页码。
 * @returns {Promise<void>} 查询状态重置并完成数据刷新后兑现。
 */
const handleReset = async () => {
  queryState.where = {};
  queryState.pageNum = 1;
  queryState.current = 1;
  await loadData(queryState);
};

/**
 * 接收 CommonTable 规范化后的分页参数，保持 Element Plus 分页器与 BFF pageNum 同步。
 * @param {number} pageNum 当前页码，从 1 开始。
 * @param {number} pageSize 每页记录数。
 * @returns {Promise<void>} 分页状态同步并完成对应页加载后兑现。
 */
const handleTableChange = async (pageNum, pageSize) => {
  const nextPageNum = pageSize !== queryState.pageSize ? 1 : pageNum;
  queryState.pageNum = nextPageNum;
  queryState.current = nextPageNum;
  queryState.pageSize = pageSize;
  await loadData(queryState);
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

/* 预览 */
const previewMap = reactive({
  show: false,
  data: {},
});
const handlePreview = (args) => {
  previewMap.data = deepClone(args);
  previewMap.show = true;
};

/* 点击编辑 */
const editState = reactive({});
const handleEdit = async (arg) => {
  arg = deepClone(arg);
  formModal.type = "edit";
  Object.keys(fields).forEach((key) => {
    if (fields[key].type == "Pointer") {
      editState[key] = arg[key]?.objectId || "";
    } else {
      editState[key] = arg[key];
    }
  });
  editState.objectId = arg.objectId;
  formModal.show = true;
};

await loadFields(queryState);
await loadData(queryState);

/* 将组件内方法暴露出来，使其他组件可以访问 */
defineExpose({ loadData, queryState, tableData });
</script>
