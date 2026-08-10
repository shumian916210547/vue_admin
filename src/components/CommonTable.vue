<template>
  <section class="common-table">
    <!-- 筛选 -->
    <slot name="top">
      <a-form class="common-table__filters" :model="where" ref="form" size="small">
        <a-row :gutter="[16, 12]">
          <a-col :xs="24" :lg="5" class="common-table__create-action">
            <a-button size="small" type="primary" @click="emit('onInsert')"
              v-permission="['permission:insert', permissions]">新建</a-button>
          </a-col>
          <a-col :xs="24" :lg="19" class="common-table__query-area">
            <div class="common-table__filter-fields">
              <template v-for="(field_name, index) in getFilterField(props.fields)" :key="index">
                <a-form-item :label="fields[field_name].chineseName" class="common-table__filter-item"
                  :name="field_name" v-permission="['permission:query', permissions]">
                  <template v-if="fields[field_name].editComponent == 'ASelect'">
                    <component size="small" class="common-table__filter-control" v-model:value="where[field_name]"
                      :placeholder="getFieldPlaceholder(fields[field_name], field_name, true)" :allowClear="true"
                      :is="fields[field_name].editComponent" :fieldNames="{
                        label: fields[field_name].componentOption.labelKey,
                        value: fields[field_name].componentOption.valueKey,
                      }" :mode="fields[field_name].componentOption.mode" :options="selectoptions[
                        fields[field_name].componentOption.selectTable
                      ]
                        ">
                    </component>
                  </template>
                  <template v-else>
                    <component size="small" class="common-table__filter-control" v-model:value="where[field_name]" :allowClear="true"
                      :placeholder="getFieldPlaceholder(fields[field_name], field_name)" :is="fields[field_name].editComponent">
                    </component>
                  </template>
                </a-form-item>
              </template>
            </div>
            <div class="common-table__toolbar-actions">
              <a-button size="small" type="primary" @click="emit('onQuery')"
                v-permission="['permission:query', permissions]">查询</a-button>
              <a-button size="small" @click="handleReset" v-permission="['permission:reset', permissions]">重置</a-button>
              <a-button size="small" @click="openExport">
                导出
              </a-button>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </slot>

    <!-- 表格 -->
    <a-table size="small" class="common-table__data" :columns="tableColumns" :data-source="tableData" :pagination="queryState"
      :loading="tableLoading" rowKey="objectId" :scroll="{ x: 720 }" :defaultExpandedRowKeys="expandedRowKeys"
      @change="handleTableChange" bordered @resizeColumn="handleResizeColumn">
      <template #bodyCell="{ column, record }">
        <!-- 根据数据类型展示数据 -->
        <template v-if="column.key === 'operation'">
          <div class="common-table__row-actions">
            <a-button size="small" @click="emit('onPreview', record)" v-permission="['permission:preview', permissions]">
              查看
            </a-button>

            <template v-if="innerContainerTitle">
              <a-button size="small" @click="emit('onAdd', record)" v-permission="['permission:insertChildren', permissions]">
                {{ innerContainerTitle }}
              </a-button>
              <a-divider type="vertical" />
            </template>
            <a-button size="small" @click="emit('onEdit', record)" v-permission="['permission:edit', permissions]">
              修改
            </a-button>

            <a-popconfirm title="删除后不可恢复，确定要继续吗？" ok-text="删除" cancel-text="取消" @confirm="emit('onDelete', record)">
              <a-button size="small" type="danger" v-permission="['permission:remove', permissions]">
                删除
              </a-button>
            </a-popconfirm>
          </div>
        </template>
        <CommonFields :column="column" :record="record" :fields="fields"></CommonFields>
      </template>
      <template v-if="innerContainer" #expandedRowRender="{ record, index, indent, expanded }">
        <slot name="expandedRowRender" :record="record" :index="index" :indent="indent" :expanded="expanded"></slot>
      </template>
      <template #expandIcon="{ record }">
        <div v-if="record.routes && record.routes.length">
          <button type="button" class="ant-table-row-expand-icon ant-table-row-expand-icon-collapsed" aria-label="展开行"
            v-show="expandedRowKeys.indexOf(record.objectId) === -1" @click="expand(record.objectId)"></button>
          <button type="button" class="ant-table-row-expand-icon ant-table-row-expand-icon-expanded" aria-label="收起行"
            v-show="expandedRowKeys.indexOf(record.objectId) !== -1" @click="expand('')"></button>
        </div>
      </template>
    </a-table>

    <CommonExport v-model:modalVisible="exportMap.show" :className="props.className" :tableColumns="tableColumns"
      :fields="props.fields"></CommonExport>
  </section>
</template>

<script setup>
import { watch, reactive, ref } from "vue";
import { Mixins } from "@/mixins";
import { findAll } from "@/service/base.service";
import CommonExport from "./CommonExport.vue";
import CommonFields from "./CommonFields.vue";
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
  tableData: {
    type: Array,
    default: () => [],
    required: true,
  },
  queryState: {
    type: Object,
    default: () => ({}),
    required: false,
  },
  queryVal: {
    type: Object,
    default: () => ({}),
    required: false,
  },
  innerContainer: {
    type: Boolean,
    default: false,
  },
  innerContainerTitle: {
    type: [Boolean, String],
    default: "新增",
  },
  fields: {
    required: true,
    type: Object,
  },
  tableLoading: {
    type: Boolean,
    default: false,
  },
});
const where = reactive(props.queryVal);
const { queryPermission, getFilterField } = Mixins();

/**
 * 为动态筛选控件生成稳定的中文占位提示，兼容历史元数据缺少 componentOption 的情况。
 * @param {{chineseName?: string, componentOption?: {placeholder?: string}} | undefined} field Schema 字段配置。
 * @param {string} fieldName 字段键名，仅在中文名称缺失时用于生成兜底提示。
 * @param {boolean} isSelect 是否为选择类控件；选择类使用“请选择”，其余使用“请输入”。
 * @returns {string} 可直接传给 Ant Design Vue 输入控件的中文 placeholder。
 */
const getFieldPlaceholder = (field, fieldName, isSelect = false) => {
  const configured = field?.componentOption?.placeholder;
  if (typeof configured === "string" && configured.trim()) return configured;
  const label = field?.chineseName || fieldName || "该字段";
  return `${isSelect ? "请选择" : "请输入"}${label}`;
};
const emit = defineEmits([
  "onChange",
  "onQueryReset",
  "onQuery",
  "onInsert",
  "update:queryVal",
  "onDelete",
  "onEdit",
  "onAdd",
  "onPreview",
]);
watch(
  where,
  (n) => {
    emit("update:queryVal", Object.assign({}, props.queryVal, n));
  },
  { deep: true }
);

const exportMap = reactive({
  show: false,
});

watch(
  () => props.queryVal,
  (n) => {
    Object.keys(n).forEach((key) => {
      where[key] = n[key];
    });
  }
);

const form = ref();

/**
 * 保存用户拖动后的表格列宽。
 * @param {number} width 新列宽，单位为像素。
 * @param {Record<string, unknown>} column Ant Design Vue 传入的列配置对象。
 * @returns {void} 直接更新列对象的 width，供当前渲染周期使用。
 */
function handleResizeColumn(width, column) {
  column.width = width;
}

/**
 * 将 Ant Design Vue 表格的分页对象转换为父页面需要的页码和每页数量。不能直接透传 `$event`，
 * 否则父级会把对象误写入 pageNum，导致翻页、排序或刷新后查询状态损坏。
 * @param {{current?: number, pageSize?: number}} pagination 表格 change 事件返回的分页信息。
 * @returns {void} 向父级发出规范化后的 onChange 页码和每页数量参数。
 */
const handleTableChange = (pagination) => {
  const current = Number.isInteger(pagination?.current) && pagination.current > 0 ? pagination.current : 1;
  const pageSize =
    Number.isInteger(pagination?.pageSize) && pagination.pageSize > 0
      ? pagination.pageSize
      : props.queryState?.pageSize || 10;
  emit("onChange", current, pageSize);
};

const selectoptions = reactive({});
/**
 * 加载筛选区下拉框关联数据源，失败时由统一请求层向上抛出而不伪造选项。
 * @param {string} className 关联数据表的 Parse 类名；为空时不执行请求。
 * @returns {Promise<Array<Record<string, unknown>>>} 查询到的关联记录数组。
 */
const loadSelectOptions = async (className) => {
  if (!className) return [];
  selectoptions[className] = [];
  selectoptions[className] = await findAll(className);
};

getFilterField(props.fields).forEach((field) => {
  if (props.fields[field].editComponent == "ASelect")
    loadSelectOptions(props.fields[field].componentOption.selectTable);
});

/**
 * 清空筛选表单并通知父组件恢复其统一维护的 queryState。
 * @returns {void} 先发出 onQueryReset，再调用 Ant Design Vue 表单重置方法。
 */
const handleReset = () => {
  emit("onQueryReset");
  form.value?.resetFields?.();
};

const permissions = await queryPermission();

const expandedRowKeys = reactive([]);

/**
 * 切换当前展开行；传入空值时清空数组，修复原实现把空字符串保留为伪展开项的问题。
 * @param {string} objectId 需要展开的记录 objectId；空字符串表示收起全部。
 * @returns {void} 就地更新 expandedRowKeys，保持 Vue 对数组变更的追踪。
 */
const expand = (objectId) => {
  expandedRowKeys.splice(0, expandedRowKeys.length, ...(objectId ? [objectId] : []));
};

/**
 * 打开 CSV 导出记录选择弹窗。
 * @returns {void} 将 exportMap.show 设为 true，由 CommonExport 负责加载导出数据。
 */
const openExport = () => {
  exportMap.show = true;
};
</script>

<style lang="scss" scoped>
.common-table {
  display: flex;
  min-width: 0;
  min-height: 0;
  gap: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.common-table__filters {
  min-height: 64px;
  margin-bottom: 18px;
  padding: 8px 16px 8px;
  background: rgba(var(--app-primary-rgb), 0.04);
  border: 1px solid var(--app-glass-border);
  border-radius: 12px;
}

.common-table__query-area,
.common-table__filter-fields,
.common-table__toolbar-actions,
.common-table__create-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.common-table__query-area {
  min-width: 0;
  align-content: center;
  gap: 8px 12px;
  justify-content: flex-end;
}

.common-table__filter-fields {
  min-width: 0;
  flex: 1 1 auto;
  gap: 0 12px;
  justify-content: flex-end;
}

.common-table__filter-item {
  margin-bottom: 0px;
}

.common-table__filter-control {
  width: 220px;
}

.common-table__toolbar-actions {
  gap: 8px;
  justify-content: flex-end;
}

.common-table__create-action {
  justify-content: flex-start;
}

.common-table__row-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}

.common-table__row-actions>.ant-btn,
.common-table__row-actions .ant-popconfirm>.ant-btn {
  min-width: 44px;
  margin: 0;
}

.common-table__data {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  border: 1px solid var(--app-glass-border);
  border-radius: 12px;
  background: var(--app-glass-surface);
  box-shadow: var(--app-shadow-soft);
}

:deep(.ant-form-item-label) {
  display: flex;
  align-items: center;
}

:deep(.common-table__data .ant-table-container) {
  border: 0;
}

:deep(.common-table__data .ant-spin-nested-loading),
:deep(.common-table__data .ant-spin-container),
:deep(.ant-table-container),
:deep(.ant-table-content) {
  height: 100%;
}

:deep(.ant-spin-container) {
  display: flex;
  flex-direction: column;
}

:deep(.ant-table) {
  flex: 1;
  overflow: hidden;
}

:deep(p) {
  margin-bottom: 0 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 991px) {

  .common-table__query-area,
  .common-table__filter-fields,
  .common-table__toolbar-actions,
  .common-table__create-action {
    justify-content: flex-start;
  }
}

@media (max-width: 576px) {
  .common-table__filters {
    padding: 6px 12px 6px;
  }

  .common-table__filter-fields,
  .common-table__toolbar-actions,
  .common-table__create-action {
    width: 100%;
  }

  .common-table__filter-control {
    width: min(100%, 230px);
  }

  .common-table__toolbar-actions {
    justify-content: flex-start;
  }
}
</style>
