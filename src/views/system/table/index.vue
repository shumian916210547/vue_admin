<template>
  <section class="schema-page list-page">
    <div class="list-page__top schema-page__top">
      <header class="schema-page__heading management-page__heading">
        <div>
          <span class="management-page__eyebrow">低代码数据建模</span>
          <h1>数据表管理</h1>
          <p>创建数据表、配置字段，并按需生成可直接使用的数据管理页面。</p>
        </div>
        <span class="schema-page__count">{{ tableList.length }} 张数据表</span>
      </header>

      <el-form class="schema-page__filters" size="small" @submit.prevent>
      <el-button size="small" type="primary" @click="(tableModal.show = true), (tableModal.type = 'add')"
        v-permission="['permission:insert', permissions]">新建</el-button>

      <div class="schema-page__filter-query">
        <el-form-item label="表格名称" v-permission="['permission:query', permissions]" class="schema-page__filter-item">
          <el-input size="small" placeholder="请输入表格名称" v-model="queryState.name" clearable />
        </el-form-item>
        <el-button size="small" type="primary" @click="getSchemaList(queryState)" v-permission="['permission:query', permissions]">
          查询
        </el-button>
        <el-button size="small" @click="queryReset()" v-permission="['permission:reset', permissions]">重置</el-button>
        <el-button size="small" :loading="statusChecking" @click="checkAllTableStatuses()">
          检测状态
        </el-button>
      </div>

      </el-form>
    </div>

    <div class="list-page__middle schema-page__middle">
      <div class="schema-page__table-wrap">
        <el-table size="small" width="100%" :data="tableList" class="schema-page__table" row-key="objectId" border>
      <el-table-column type="expand" width="44">
        <template #default="{ row }">
          <el-table size="small" width="100%" class="schema-page__field-table" :data="row.fields" border>
            <el-table-column
              v-for="column in innerColumns"
              :key="column.key"
              :prop="column.dataIndex"
              :label="column.title"
              :width="column.width"
              :min-width="column.minWidth || (column.width ? undefined : 140)"
              :fixed="column.fixed"
              :class-name="column.className"
            >
              <template #default="{ row: fieldRow, $index }">
                <template v-if="column.key === 'operation'">
                  <span class="table-operation">
                    <el-button size="small" @click="handleEditField(row, $index)" v-permission="['permission:editField', permissions]">
                      修改字段
                    </el-button>
                    <el-divider direction="vertical" />
                    <el-popconfirm title="删除字段后不可恢复，确定继续吗？" confirm-button-text="删除" cancel-button-text="取消"
                      @confirm="handleRemoveField(row, $index)">
                      <template #reference>
                        <el-button size="small" type="danger" v-permission="['permission:removeField', permissions]">
                          删除字段
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </span>
                </template>
                <template v-else-if="column.key === 'fieldName'">
                  {{ fieldRow.formState.fieldName }}
                </template>
                <template v-else-if="column.key === 'fieldType'">
                  {{ fieldTypeLabel(fieldRow.formState.fieldType) }}
                </template>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column
        v-for="column in columns"
        :key="column.key"
        :prop="column.dataIndex"
        :label="column.title"
        :width="column.width"
        :min-width="column.minWidth || (column.width ? undefined : 140)"
        :fixed="column.fixed"
        :class-name="column.className"
      >
      <template #default="{ row }">
        <template v-if="column.key === 'status'">
          <el-tooltip :content="row.statusMessage || '正在检测数据表状态'">
            <el-tag size="small" :type="getTableStatusMeta(row.status).type">
              {{ getTableStatusMeta(row.status).label }}
            </el-tag>
          </el-tooltip>
        </template>
        <template v-else-if="column.key === 'operation'">
          <div class="schema-page__row-actions">
            <el-button size="small" @click="generateAPI(row)">生成接口</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" @click="
              (fieldModal.type = 'add'),
              (fieldModal.show = true),
              (fieldModal.className = row.className)
              " v-permission="['permission:insertField', permissions]">
              新建字段
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm title="删除数据表及其记录后不可恢复，确定继续吗？" confirm-button-text="删除" cancel-button-text="取消"
              @confirm="handleDeleteSchema(row)">
              <template #reference>
              <el-button size="small" type="danger" v-permission="['permission:remove', permissions]">
                删除表格
              </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <span v-else>{{ row[column.dataIndex] }}</span>
      </template>
      </el-table-column>
        </el-table>
      </div>
    </div>
    <IndexField v-model="fieldModal.show" @onSubmit="handleSubmitField" :editState="editState"
      :type="fieldModal.type"></IndexField>

    <!-- 更新表格，新增表格 -->
    <InsertTable v-if="tableModal.show" v-model="tableModal.show" @onSubmit="handleInsertTable">
    </InsertTable>

    <el-dialog v-model="apiModalVisible" title="接口详情" width="500">
      <div class="schema-page__api-preview">
        <div class="schema-page__api-toolbar">
          <el-button size="small" type="primary" @click="handleCopy(apiString)">复制代码</el-button>
        </div>
        <pre>{{ apiString }}</pre>
      </div>
      <template #footer>
        <el-button size="small" @click="apiModalVisible = false">关闭</el-button>
      </template>
    </el-dialog>
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
import { ElNotification } from "element-plus";
import { normalizeEditComponent } from "@/utils/element";

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
const statusChecking = ref(false);
let statusRequestId = 0;

/** 数据表运行状态与 Element Plus 标签类型的固定映射；绿色表示真实数据类可访问，红色表示检测失败。 */
const tableStatusMeta = {
  checking: { label: "检测中", type: "warning" },
  normal: { label: "正常", type: "success" },
  error: { label: "异常", type: "danger" },
};

/** Parse Schema 字段类型到中文界面名称的映射；对象键保留服务端类型值，避免影响数据协议。 */
const fieldTypeLabels = {
  Boolean: "布尔值",
  String: "字符串",
  Number: "数字",
  Date: "日期",
  Object: "对象",
  Array: "数组",
  GeoPoint: "地理坐标",
  Polygon: "多边形",
  File: "文件",
  Pointer: "关联指针",
  Relation: "多对多关系",
};

/**
 * 将 Schema 内部字段类型转换为数据表页面使用的中文名称，保留未知类型的原始值便于排查历史配置。
 * @param {string | undefined} fieldType Parse Schema 字段类型标识。
 * @returns {string} 字段类型对应的中文名称或未配置提示。
 */
const fieldTypeLabel = (fieldType) => fieldTypeLabels[fieldType] || fieldType || "未配置";

/**
 * 返回数据表状态标签的展示配置，未知状态统一按“检测中”处理，避免页面出现空白状态。
 * @param {"checking" | "normal" | "error" | undefined} status 数据表当前检测状态。
 * @returns {{label: string, type: string}} Element Plus 标签文案和类型配置。
 */
const getTableStatusMeta = (status) => tableStatusMeta[status] || tableStatusMeta.checking;

/**
 * 检测单张数据表的真实运行状态；通过只取一条记录的查询验证类访问能力，空表也会成功返回。
 * @param {{className?: string, fields?: Array<Record<string, unknown>>, status?: string, statusMessage?: string}} record 当前数据表列表记录。
 * @param {number} requestId 本轮批量检测序号，用于忽略过期请求的回写。
 * @returns {Promise<void>} 状态与说明写回记录后兑现；异常会转换为“异常”状态而不阻断其他表检测。
 */
const checkTableStatus = async (record, requestId) => {
  record.status = "checking";
  record.statusMessage = "正在检查真实数据类和字段元数据。";
  try {
    if (!record.className || !Array.isArray(record.fields) || !record.fields.length) {
      const metadataError = new Error("数据表字段元数据为空或不完整。");
      metadataError.code = "SCHEMA_METADATA_INVALID";
      throw metadataError;
    }
    const query = new Parse.Query(record.className);
    await query.first();
    if (requestId !== statusRequestId) return;
    record.status = "normal";
    record.statusMessage = "真实数据类可访问，字段元数据完整。";
  } catch (error) {
    if (requestId !== statusRequestId) return;
    record.status = "error";
    record.statusMessage = error?.code === "SCHEMA_METADATA_INVALID"
      ? error.message
      : "真实数据类无法访问，请检查 Schema、当前权限或服务端状态。";
  }
};

/**
 * 并行检测当前列表中的全部数据表，并在检测期间锁定“检测状态”按钮避免重复触发。
 * @param {Array<Record<string, unknown>>} records 待检测的数据表记录；默认使用当前列表。
 * @returns {Promise<void>} 全部检测完成或请求被新一轮检测取代后兑现。
 */
const checkAllTableStatuses = async (records = tableList.value) => {
  const requestId = ++statusRequestId;
  statusChecking.value = true;
  await Promise.all((records || []).map((record) => checkTableStatus(record, requestId)));
  if (requestId === statusRequestId) statusChecking.value = false;
};

/**
 * 获取数据表元数据列表、整理字段展示结构并自动执行运行状态检测。
 * @param {{name?: string}} query 表格名称筛选条件；为空时查询当前企业全部数据表。
 * @returns {Promise<void>} 列表、字段数量和状态标签更新完成后兑现。
 */
const getSchemaList = async (query) => {
  const result = await loadSchemas(query);
  if (!result) return;
  tableList.value = [
    ...result.map((item, index) => {
      const sourceFields = item.fields && typeof item.fields === "object" ? item.fields : {};
      const fields = Object.keys(sourceFields).map((fieldName) => {
        const field = sourceFields[fieldName] || {};
        return {
          formState: {
            fieldType: field.type,
            fieldName: fieldName,
          },
          optionState: {
            required: field.required,
            targetClass: field.targetClass,
            chineseName: field.chineseName,
            defaultValue:
              field.defaultValue?.objectId || field.defaultValue,
            editComponent: normalizeEditComponent(field.editComponent),
            isFilter: field.isFilter,
            isTable: field.isTable,
            isPointer: field.isPointer,
            isSole: field.isSole,
          },
          componentOption: field.componentOption,
        };
      });
      return {
        ...item,
        className: item.name,
        key: index,
        fields,
        fields_num: fields.length,
        status: "checking",
        statusMessage: "等待状态检测。",
      };
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
  await checkAllTableStatuses(tableList.value);
  store.commit("SET_TABLES", [...tableList.value]);
  ElNotification.success({
    title: sessionStorage.getItem("pageName"),
    message: "数据获取成功",
    duration: 0.5,
  });
};

/**
 * 为新建数据表生成默认的 Wrapper 路由元数据。
 * @param {{menu?: boolean, name?: string, path?: string, rank?: number, remark?: string, company?: string, targetClass?: string, pageComponent?: string}} routeData 路由字段及所属企业标识。
 * @returns {Promise<Record<string, unknown>>} 服务端保存后的路由 JSON 数据。
 * @throws {Error} 路由写入失败时向调用方抛出异常。
 */
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

/**
 * 删除数据表及其记录，并在服务端完成后刷新列表与状态检测。
 * @param {{className: string}} record 待删除的数据表记录。
 * @returns {Promise<void>} 删除和列表刷新完成后兑现；失败由统一错误处理链路反馈。
 */
const handleDeleteSchema = async (record) => {
  await removeSchema(record.className);
  await getSchemaList(queryState);
};

/**
 * 删除当前数据表中的字段，并刷新字段元数据和运行状态。
 * @param {{className: string, fields: Array<Record<string, unknown>>}} record 数据表记录。
 * @param {number} index 待删除字段在当前展开列表中的索引。
 * @returns {Promise<void>} 字段删除和列表刷新完成后兑现。
 */
const handleRemoveField = async (record, index) => {
  const className = record.className;
  const fieldName = record.fields[index].formState.fieldName;
  await removeField(className, fieldName);
  await getSchemaList(queryState);
};

let editState = {};
/**
 * 打开字段编辑弹窗并回填选中字段的三组配置。
 * @param {{className: string, fields: Array<Record<string, unknown>>}} record 当前数据表记录。
 * @param {number} index 待编辑字段在展开列表中的索引。
 * @returns {void} 更新字段弹窗状态，不直接发起网络请求。
 */
const handleEditField = (record, index) => {
  fieldModal.type = "edit";
  fieldModal.show = true;
  fieldModal.className = record.className;
  editState = record.fields[index];
};

/**
 * 提交新建或修改字段配置，并刷新当前数据表列表及状态检测。
 * @param {{fieldType: string, fieldName: string, fieldOption: Record<string, unknown>}} arg 字段弹窗校验后的配置。
 * @returns {Promise<void>} 字段写入和列表刷新完成后兑现。
 */
const handleSubmitField = async (arg) => {
  fieldModal.show = false;
  const className = fieldModal.className;
  if (fieldModal.type == "add") {
    await addField(
      className,
      arg.fieldType,
      arg.fieldName,
      arg.fieldOption
    );
  }
  if (fieldModal.type == "edit") {
    await UpdateSchema(
      className,
      arg.fieldType,
      arg.fieldName,
      arg.fieldOption
    );
  }
  await getSchemaList(queryState);
};

/**
 * 清空数据表名称筛选并重新加载第一页列表。
 * @returns {Promise<void>} 筛选条件清空、数据表列表和状态检测完成后兑现。
 */
const queryReset = async () => {
  queryState.name = "";
  await getSchemaList(queryState);
};

const apiString = ref("");
const apiModalVisible = ref(false);

/**
 * 根据当前数据表字段生成接口调用示例并打开预览弹窗。
 * @param {{className: string, fields: Array<Record<string, unknown>>}} info 当前数据表记录。
 * @returns {void} 更新接口示例文本并显示预览弹窗。
 */
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
    ElNotification.success({
      title: "提示",
      message: "复制成功",
      duration: 0.5,
    });
  } catch {
    ElNotification.error({
      title: "复制失败",
      message: "浏览器未授予剪贴板权限，请手动选择代码后复制。",
    });
  }
};

await getSchemaList(queryState);
</script>

<style lang="scss" scoped>
.schema-page {
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.schema-page__middle {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 1 1 auto;
}

.schema-page__table-wrap {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.schema-page__count {
  flex: 0 0 auto;
  margin-top: 8px;
  padding: 6px 10px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 600;
  background: var(--app-primary-soft);
  border-radius: var(--app-radius-xs);
}

.schema-page__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-sm);
  margin-bottom: var(--app-space);
  padding: 12px 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-soft);
}

.schema-page__filter-item {
  margin-bottom: 0;
}

.schema-page__filter-query {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.schema-page__table {
  width: 100%;
}

.schema-page__row-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}

.schema-page__field-table {
  width: 100%;
}

.schema-page__api-preview {
  height: 430px;
  overflow: auto;
  background: var(--app-ink);
  border-radius: var(--app-radius);
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

  .schema-page__count {
    display: inline-block;
  }

  .schema-page__filter-query {
    justify-content: flex-start;
  }

  .schema-page__filters {
    align-items: flex-start;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 8px;
  }

}
</style>
