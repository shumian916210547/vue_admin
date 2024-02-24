<template>
  <a-form style="height: 56px">
    <a-row>
      <a-col :span="8">
        <a-form-item
          label="表格名称"
          v-permission="['permission:query', permissions]"
        >
          <a-input
            placeholder="请输入表格名称"
            v-model:value="queryState.name"
          />
        </a-form-item>
      </a-col>

      <a-col :span="8" :offset="1"> </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-button
          type="primary"
          @click="getSchemaList(queryState)"
          style="margin: 0 10px 0 0"
          v-permission="['permission:query', permissions]"
        >
          查询
        </a-button>
        <a-button
          @click="queryReset()"
          v-permission="['permission:reset', permissions]"
          >重置</a-button
        >
      </a-col>
      <a-col :span="2" :offset="2">
        <a-button
          type="primary"
          @click="(tableModal.show = true), (tableModal.type = 'add')"
          v-permission="['permission:insert', permissions]"
          >新建</a-button
        >
      </a-col>
    </a-row>
  </a-form>
  <a-table
    :columns="columns"
    :data-source="tableList"
    :pagination="false"
    class="components-table-demo-nested"
    rowKey="objectId"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'operation'">
        <div style="max-width: 230px; display: flex; align-items: center">
          <a-button @click="generateAPI(record, index)"> 生成接口 </a-button>
          <a-divider type="vertical" />
          <a-button
            @click="
              (fieldModal.type = 'add'),
                (fieldModal.show = true),
                (fieldModal.className = record.className)
            "
            v-permission="['permission:insertField', permissions]"
          >
            新建字段
          </a-button>
          <a-divider type="vertical" />
          <a-popconfirm
            title="Are you sure delete this task?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="handelDeleteSchema(record)"
            @cancel="() => {}"
          >
            <a-button
              type="danger"
              v-permission="['permission:remove', permissions]"
            >
              删除表格
            </a-button>
          </a-popconfirm>
        </div>
      </template>
    </template>
    <template #expandedRowRender="{ record }">
      <a-table
        :columns="innerColumns"
        :data-source="record.fields"
        :pagination="false"
      >
        <template #bodyCell="{ column, index }">
          <template v-if="column.key === 'operation'">
            <span class="table-operation">
              <a-button
                @click="handleEditField(record, index)"
                v-permission="['permission:editField', permissions]"
              >
                修改字段
              </a-button>
              <a-divider type="vertical" />
              <a-popconfirm
                title="Are you sure delete this task?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="handleRemoveField(record, index)"
                @cancel="() => {}"
              >
                <a-button
                  type="danger"
                  v-permission="['permission:removeField', permissions]"
                >
                  删除字段
                </a-button>
              </a-popconfirm>
            </span>
          </template>

          <template v-else-if="column.key === 'fieldName'">
            {{ record.fields[index].formState.fieldName }}
          </template>
          <template v-else-if="column.key === 'fieldType'">
            {{ record.fields[index].formState.fieldType }}
          </template>
        </template>
      </a-table>
    </template>
  </a-table>
  <IndexField
    v-model:modalVisible="fieldModal.show"
    @onSubmit="handleSubmitField"
    :editState="editState"
    :type="fieldModal.type"
  ></IndexField>

  <!-- 更新表格，新增表格 -->
  <InsertTable
    v-if="tableModal.show"
    v-model:modalVisible="tableModal.show"
    @onSubmit="handleInsertTable"
  ></InsertTable>

  <a-modal
    v-model:visible="apiModalVisible"
    title="接口详情"
    width="500"
    @ok="
      () => {
        apiModalVisible = false;
      }
    "
  >
    <div style="height: 500px; overflow-y: scroll">
      <a-row justify="space-around" style="position: fixed">
        <a-col :span="4">
          <a-button @click="handleCopy(apiString)">复制</a-button>
        </a-col>
        <a-col :span="4"> </a-col>
        <a-col :span="4"> </a-col>
        <a-col :span="4"> </a-col>
      </a-row>
      <pre>{{ apiString }}</pre>
    </div>
  </a-modal>
</template>

<script setup>
import IndexField from "./index.field.vue";
import InsertTable from "./insert.table.vue";
import {
  addField,
  createSchema,
  loadSchemas,
  UpdateSchema,
  removeField,
  updateField,
  removeSchema,
} from "@/service/schema.service";
import { columns, innerColumns } from "@/config/table.config";
import { getAPI } from "@/service/functionToString";

import Parse from "parse";
import { reactive, ref } from "vue";
import store from "@/store";
import { Mixins } from "@/mixins";
import { notification } from "ant-design-vue";

const { queryPermission } = Mixins();

/* 查询路由id */
const querySchemaId = async () => {
  const query = new Parse.Query("Route");
  query.equalTo("targetClass", "Schema");
  const result = await query.first();
  return result.id;
};
const schemaId = await querySchemaId();
const permissions = await queryPermission(schemaId);

const queryState = reactive({
  pageSize: 10,
  pageNum: 1,
  name: "",
});

const tableModal = reactive({
  show: false,
  type: "add",
});

const fieldModal = reactive({
  show: false,
  type: "add",
  className: null,
});

const tableList = ref([...store.getters["GET_TABLES"]]);

/* 获取table列表*/
const getSchemaList = async (query) => {
  const result = await loadSchemas(query);
  if (!result) return;
  tableList.value = [
    ...result.map((item, index) => {
      item.className = item.name;
      item.key = index;
      item.fields = Object.keys(item.fields).map((fieldName) => {
        return {
          formState: {
            fieldType: item.fields[fieldName].type,
            fieldName: fieldName,
          },
          optionState: {
            required: item.fields[fieldName].required,
            targetClass: item.fields[fieldName].targetClass,
            chineseName: item.fields[fieldName].chineseName,
            defaultValue: item.fields[fieldName].defaultValue,
            editComponent: item.fields[fieldName].editComponent,
            isFilter: item.fields[fieldName].isFilter,
            isTable: item.fields[fieldName].isTable,
          },
          componentOption: item.fields[fieldName].componentOption,
        };
      });
      item.fields_num = item.fields.length;
      return item;
    }),
  ].sort((a, b) => {
    if (a.className < b.className) {
      return -1;
    }
    if (a.className > b.className) {
      return 1;
    }
    return 0;
  });
  store.commit("SET_TABLES", [...tableList.value]);
  notification.success({
    message: sessionStorage.getItem("pageName"),
    description: "数据获取成功",
    duration: 0.5,
  });
};

/* 新增table */
const handleInsertTable = async (arg) => {
  const result = await createSchema(arg);
  tableModal.show = false;
  getSchemaList(queryState);
};

/* 删除Schema */
const handelDeleteSchema = async (record) => {
  await removeSchema(record.className);
  getSchemaList(queryState);
};

/* 点击删除字段 */
const handleRemoveField = async (arg1, arg2) => {
  let className = arg1.className;
  let fieldName = arg1.fields[arg2].formState.fieldName;
  await removeField(className, fieldName);
  getSchemaList(queryState);
};

let editState = {};
/* 点击编辑字段信息 */
const handleEditField = (arg1, arg2) => {
  fieldModal.type = "edit";
  fieldModal.show = true;
  fieldModal.className = arg1.className;
  editState = arg1.fields[arg2];
};

/* 新建字段/修改字段 */
const handleSubmitField = async (arg) => {
  fieldModal.show = false;
  let className = fieldModal.className;
  if (fieldModal.type == "add") {
    const result = await addField(
      className,
      arg.fieldType,
      arg.fieldName,
      arg.fieldOption
    );
  }
  if (fieldModal.type == "edit") {
    const result = await UpdateSchema(
      className,
      arg.fieldType,
      arg.fieldName,
      arg.fieldOption
    );
  }
  getSchemaList(queryState);
};

const queryReset = () => {
  queryState.name = "";
  getSchemaList(queryState);
};

/* 生成接口 */
const apiString = ref("");
const apiModalVisible = ref(false);
const generateAPI = (info, index) => {
  const { className, fields } = info;
  apiString.value = getAPI({ className, fields });
  apiModalVisible.value = true;
};

/* 复制文本到粘贴板 */
const handleCopy = (str) => {
  navigator.clipboard.writeText(str).catch(function (err) {
    console.error("Unable to copy text to clipboard", err);
  });
  notification.success({
    message: "提示",
    description: "复制成功",
    duration: 0.5,
  });
};

await getSchemaList(queryState);
</script>

<style lang="scss" scoped>
</style>