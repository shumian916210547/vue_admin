<template>
  <section class="schema-page">
    <header class="schema-page__heading">
      <div>
        <span class="schema-page__eyebrow">LOW-CODE DATA MODELING</span>
        <h1>数据表管理</h1>
        <p>创建数据表、配置字段，并按需生成可直接使用的数据管理页面。</p>
      </div>
      <span class="schema-page__count">{{ tableList.length }} 张数据表</span>
    </header>

  <a-form class="schema-page__filters">
    <a-row :gutter="[16, 12]">
      <a-col :xs="24" :md="10">
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

      <a-col :xs="24" :md="10" class="schema-page__actions">
        <a-button
          type="primary"
          @click="getSchemaList(queryState)"
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
      <a-col :xs="24" :md="4" class="schema-page__create-action">
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
    class="schema-page__table"
    rowKey="objectId"
    :scroll="{ x: 760 }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'operation'">
        <div class="schema-page__row-actions">
          <a-button @click="generateAPI(record)">生成接口</a-button>
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
            title="删除数据表及其记录后不可恢复，确定继续吗？"
            ok-text="删除"
            cancel-text="取消"
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
        class="schema-page__field-table"
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
                title="删除字段后不可恢复，确定继续吗？"
                ok-text="删除"
                cancel-text="取消"
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
    <div class="schema-page__api-preview">
      <div class="schema-page__api-toolbar">
        <a-button type="primary" @click="handleCopy(apiString)">复制代码</a-button>
      </div>
      <pre>{{ apiString }}</pre>
    </div>
  </a-modal>
  </section>
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
  removeSchema,
} from "@/service/schema.service";
import { columns, innerColumns } from "@/config/table.config";
import { getAPI } from "@/service/functionToString";

import Parse from "@/service/parse-client";
import { reactive, ref } from "vue";
import store from "@/store";
import { Mixins } from "@/mixins";
import { notification } from "ant-design-vue";

const { queryPermission } = Mixins();

/**
 * 查询“数据表管理”页面对应的 Route 元数据标识。
 * @returns {Promise<string | undefined>} 找到时返回 Route 的 objectId；元数据尚未初始化时返回 undefined。
 * @throws {Error} BFF 请求失败时向页面 Suspense 边界抛出异常。
 */
const querySchemaId = async () => {
  const query = new Parse.Query("Route");
  query.equalTo("targetClass", "Schema");
  const result = await query.first();
  return result?.id;
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
            defaultValue:
              item.fields[fieldName].defaultValue?.objectId ||
              item.fields[fieldName].defaultValue,
            editComponent: item.fields[fieldName].editComponent,
            isFilter: item.fields[fieldName].isFilter,
            isTable: item.fields[fieldName].isTable,
            isPointer: item.fields[fieldName].isPointer,
            isSole: item.fields[fieldName].isSole,
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

/* 生成默认路由 */
const insertRoute = async ({
  menu = undefined,
  name = undefined,
  path = undefined,
  rank = undefined,
  remark = undefined,
  company = undefined,
  targetClass = undefined,
  pageComponent = undefined,
}) => {
  const Table = Parse.Object.extend("Route");
  const table = new Table();
  table.set("menu", menu);
  table.set("name", name);
  table.set("path", path);
  table.set("rank", rank);
  table.set("remark", remark);
  table.set("company", {
    __type: "Pointer",
    className: "Company",
    objectId: company,
  });
  table.set("targetClass", targetClass);
  table.set("pageComponent", pageComponent);
  return (await table.save()).toJSON();
};

/**
 * 创建数据表，并在用户选择“生成页面”时同步写入其默认 Route 元数据。
 * @param {Record<string, unknown> | undefined} arg 建表表单数据；缺失时不执行任何写操作。
 * @returns {Promise<void>} 表结构及可选路由均写入完成、列表刷新完成后兑现。
 * @throws {Error} 建表或写入默认路由失败时保留弹窗状态并向调用方抛出异常。
 */
const handleInsertTable = async (arg) => {
  if (!arg) return;
  const result = await createSchema(arg);
  if (arg.generate && result) {
    await insertRoute({
      menu: true,
      name: arg.nickName,
      path: arg.className,
      company: result.get("company").id,
      targetClass: arg.className,
      pageComponent: "/Wrapper",
    });
  }
  tableModal.show = false;
  await getSchemaList(queryState);
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
const generateAPI = (info) => {
  const { className, fields } = info;
  apiString.value = getAPI({ className, fields });
  apiModalVisible.value = true;
};

/**
 * 在不支持 navigator.clipboard 的受限浏览器中使用隐藏文本域完成复制。
 * @param {string} value 需要复制的纯文本内容。
 * @returns {boolean} 浏览器确认执行复制命令时返回 true，否则返回 false。
 */
const copyTextWithFallback = (value) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
};

/**
 * 复制生成的接口示例，并且只在复制实际成功后显示成功提示。
 * @param {string} value 需要放入系统剪贴板的接口代码文本。
 * @returns {Promise<void>} 复制完成或失败提示显示后结束。
 */
const handleCopy = async (value) => {
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else if (!copyTextWithFallback(value)) throw new Error("COPY_FAILED");
    notification.success({
      message: "提示",
      description: "复制成功",
      duration: 0.5,
    });
  } catch {
    notification.error({
      message: "复制失败",
      description: "浏览器未授予剪贴板权限，请手动选择代码后复制。",
    });
  }
};

await getSchemaList(queryState);
</script>

<style lang="scss" scoped>
.schema-page {
  min-width: 0;
}

.schema-page__heading {
  display: flex;
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--app-border);
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.schema-page__eyebrow {
  color: var(--app-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.schema-page__heading h1 {
  margin: 6px 0 7px;
  color: var(--app-ink);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
}

.schema-page__heading p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
}

.schema-page__count {
  flex: 0 0 auto;
  margin-top: 8px;
  padding: 6px 10px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 600;
  background: var(--app-primary-soft);
  border-radius: 999px;
}

.schema-page__filters {
  margin-bottom: 18px;
  padding: 14px 16px 2px;
  background: rgba(var(--app-primary-rgb), 0.04);
  border: 1px solid var(--app-glass-border);
  border-radius: 12px;
}

.schema-page__actions,
.schema-page__create-action {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: flex-end;
}

.schema-page__table {
  overflow: hidden;
  border: 1px solid var(--app-glass-border);
  background: var(--app-glass-surface);
  border-radius: 12px;
}

.schema-page__row-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.schema-page__field-table {
  overflow: hidden;
  border-radius: 8px;
}

.schema-page__api-preview {
  height: 430px;
  overflow: auto;
  background: var(--app-ink);
  border-radius: 10px;
}

.schema-page__api-toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  padding: 12px;
  background: rgba(var(--app-surface-rgb), 0.94);
  justify-content: flex-end;
}

.schema-page__api-preview pre {
  margin: 0;
  padding: 8px 16px 18px;
  color: var(--app-surface);
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 767px) {
  .schema-page__heading {
    display: block;
  }

  .schema-page__count {
    display: inline-block;
  }

  .schema-page__actions,
  .schema-page__create-action {
    justify-content: flex-start;
  }
}
</style>
