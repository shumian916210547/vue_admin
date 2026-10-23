<template>
  <section class="common-table list-page">
    <div class="common-table__top list-page__top">
      <slot name="top"></slot>
      <el-form ref="form" class="common-table__filters" :model="where" size="small" @submit.prevent>
        <el-row :gutter="16" class="common-table__filter-row">
          <el-col :xs="24" :lg="5" class="common-table__create-action">
            <el-button
              size="small"
              type="primary"
              v-permission="['permission:insert', permissions]"
              @click="emit('onInsert')"
            >
              新建
            </el-button>
          </el-col>
          <el-col :xs="24" :lg="19" class="common-table__query-area">
            <div class="common-table__filter-fields">
              <template v-for="(fieldName, index) in getFilterField(props.fields)" :key="index">
                <el-form-item
                  v-permission="['permission:query', permissions]"
                  :label="fields[fieldName].chineseName"
                  :prop="fieldName"
                  class="common-table__filter-item"
                >
                  <el-select
                    v-if="getEditComponent(fields[fieldName]) === 'ElSelect'"
                    v-model="where[fieldName]"
                    class="common-table__filter-control"
                    size="small"
                    :placeholder="getFieldPlaceholder(fields[fieldName], fieldName, true)"
                    :clearable="true"
                    :filterable="true"
                    :multiple="isMultiple(fields[fieldName])"
                  >
                    <el-option
                      v-for="option in selectoptions[fields[fieldName].componentOption?.selectTable] || []"
                      :key="option.objectId || option.value || option.name"
                      :label="getOptionLabel(option, fields[fieldName])"
                      :value="getOptionValue(option, fields[fieldName])"
                    />
                  </el-select>
                  <el-input-number
                    v-else-if="getEditComponent(fields[fieldName]) === 'ElInputNumber'"
                    v-model="where[fieldName]"
                    class="common-table__filter-control"
                    size="small"
                    controls-position="right"
                    :placeholder="getFieldPlaceholder(fields[fieldName], fieldName)"
                  />
                  <el-switch
                    v-else-if="getEditComponent(fields[fieldName]) === 'ElSwitch'"
                    v-model="where[fieldName]"
                    size="small"
                  />
                  <el-date-picker
                    v-else-if="getEditComponent(fields[fieldName]) === 'ElDatePicker'"
                    v-model="where[fieldName]"
                    class="common-table__filter-control"
                    size="small"
                    type="datetime"
                    :placeholder="getFieldPlaceholder(fields[fieldName], fieldName)"
                    clearable
                  />
                  <el-date-picker
                    v-else-if="getEditComponent(fields[fieldName]) === 'ElDateRangePicker'"
                    v-model="where[fieldName]"
                    class="common-table__filter-control"
                    size="small"
                    type="datetimerange"
                    :start-placeholder="`${getFieldPlaceholder(fields[fieldName], fieldName)}开始`"
                    :end-placeholder="`${getFieldPlaceholder(fields[fieldName], fieldName)}结束`"
                    clearable
                  />
                  <el-input
                    v-else
                    v-model="where[fieldName]"
                    class="common-table__filter-control"
                    size="small"
                    clearable
                    :placeholder="getFieldPlaceholder(fields[fieldName], fieldName)"
                  />
                </el-form-item>
              </template>
            </div>
            <div class="common-table__toolbar-actions">
              <el-button
                size="small"
                type="primary"
                v-permission="['permission:query', permissions]"
                @click="emit('onQuery')"
              >
                查询
              </el-button>
              <el-button
                size="small"
                v-permission="['permission:reset', permissions]"
                @click="handleReset"
              >
                重置
              </el-button>
              <el-button size="small" @click="openExport">导出</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="common-table__middle list-page__middle">
      <div class="common-table__data-wrap">
        <el-table
          v-loading="tableLoading"
          class="common-table__data"
          size="small"
          width="100%"
          :data="tableData"
          row-key="objectId"
          border
          :row-class-name="getRowClassName"
          @header-dragend="handleHeaderDragend"
        >
          <el-table-column v-if="innerContainer" type="expand" width="44">
            <template #default="{ row, $index }">
              <slot
                name="expandedRowRender"
                :record="row"
                :index="$index"
                :indent="0"
                :expanded="true"
              />
            </template>
          </el-table-column>
          <el-table-column
            v-for="column in tableColumns"
            :key="column.key || column.dataIndex"
            :prop="column.dataIndex"
            :label="column.title"
            :width="column.key === 'operation' ? undefined : column.width"
            :min-width="column.key === 'operation' ? Math.max(Number(column.minWidth) || 0, 320) : (column.minWidth || (column.width ? undefined : 140))"
            :fixed="column.fixed"
            :class-name="column.className"
            :resizable="column.resizable !== false"
          >
            <template #default="{ row }">
              <template v-if="column.key === 'operation'">
                <div class="common-table__row-actions">
                  <el-button
                    size="small"
                    v-permission="['permission:preview', permissions]"
                    @click="emit('onPreview', row)"
                  >
                    查看
                  </el-button>
                  <template v-if="innerContainerTitle">
                    <el-button
                      size="small"
                      v-permission="['permission:insertChildren', permissions]"
                      @click="emit('onAdd', row)"
                    >
                      {{ innerContainerTitle }}
                    </el-button>
                    <el-divider direction="vertical" />
                  </template>
                  <el-button
                    size="small"
                    v-permission="['permission:edit', permissions]"
                    @click="emit('onEdit', row)"
                  >
                    修改
                  </el-button>
                  <el-popconfirm
                    title="删除后不可恢复，确定要继续吗？"
                    confirm-button-text="删除"
                    cancel-button-text="取消"
                    width="260"
                    @confirm="emit('onDelete', row)"
                  >
                    <template #reference>
                      <el-button
                        size="small"
                        type="danger"
                        v-permission="['permission:remove', permissions]"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </template>
              <CommonFields v-else :column="column" :record="row" :fields="fields" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="common-table__bottom list-page__bottom">
      <el-pagination
        v-if="showPagination"
        class="common-table__pagination"
        background
        size="small"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="Number(props.queryState?.total) || 0"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <CommonExport
      v-model="exportMap.show"
      :class-name="props.className"
      :table-columns="tableColumns"
      :fields="props.fields"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

import { Mixins } from "@/mixins";
import { findAll } from "@/service/base.service";
import { normalizeEditComponent } from "@/utils/element";

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
  },
  queryVal: {
    type: Object,
    default: () => ({}),
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
const where = reactive(props.queryVal);
const form = ref();
const selectoptions = reactive({});
const exportMap = reactive({ show: false });
const { queryPermission, getFilterField } = Mixins();
const permissions = await queryPermission();

/**
 * 读取并规范化筛选字段的编辑组件标识，确保历史 Schema 使用 Element Plus 控件。
 * @param {{editComponent?: unknown} | undefined} field Schema 字段配置。
 * @returns {string} Element Plus 组件标识或未知原始标识。
 */
const getEditComponent = (field) => normalizeEditComponent(field?.editComponent);

/**
 * 为动态筛选控件生成稳定的中文占位提示，兼容历史元数据缺少 componentOption 的情况。
 * @param {{chineseName?: string, componentOption?: {placeholder?: string}} | undefined} field Schema 字段配置。
 * @param {string} fieldName 字段键名，仅在中文名称缺失时用于生成兜底提示。
 * @param {boolean} isSelect 是否为选择类控件；选择类使用“请选择”，其余使用“请输入”。
 * @returns {string} 可直接传给 Element Plus 输入控件的中文 placeholder。
 */
const getFieldPlaceholder = (field, fieldName, isSelect = false) => {
  const configured = field?.componentOption?.placeholder;
  if (typeof configured === "string" && configured.trim()) return configured;
  const label = field?.chineseName || fieldName || "该字段";
  return `${isSelect ? "请选择" : "请输入"}${label}`;
};

/**
 * 判断动态选择控件是否应启用多选。
 * @param {{componentOption?: {mode?: string}, type?: string, isPointer?: boolean}} field Schema 字段配置。
 * @returns {boolean} mode 为 multiple/tags 或字段为 Pointer 数组时返回 true。
 */
const isMultiple = (field) =>
  ["multiple", "tags"].includes(field?.componentOption?.mode) ||
  (field?.isPointer && field?.type === "Array");

/**
 * 从关联记录中读取选择项显示文本。
 * @param {Record<string, unknown>} option 关联数据源中的一条记录。
 * @param {{componentOption?: {labelKey?: string}}} field Schema 字段配置。
 * @returns {string} 选择项标签。
 */
const getOptionLabel = (option, field) =>
  String(option?.[field?.componentOption?.labelKey || "name"] ?? option?.label ?? option?.name ?? "");

/**
 * 从关联记录中读取选择项值。
 * @param {Record<string, unknown>} option 关联数据源中的一条记录。
 * @param {{componentOption?: {valueKey?: string}}} field Schema 字段配置。
 * @returns {string | number | boolean | undefined} 选择项值。
 */
const getOptionValue = (option, field) =>
  option?.[field?.componentOption?.valueKey || "objectId"] ?? option?.value;

/**
 * 为 Element Plus 表格生成无截断的行类名，确保动态字段可完整换行展示。
 * @returns {string} 表格行 CSS 类名。
 */
const getRowClassName = () => "common-table__row";

watch(
  where,
  (nextWhere) => {
    emit("update:queryVal", Object.assign({}, props.queryVal, nextWhere));
  },
  { deep: true }
);

watch(
  () => props.queryVal,
  (nextWhere) => {
    Object.keys(nextWhere || {}).forEach((key) => {
      where[key] = nextWhere[key];
    });
  },
  { deep: true }
);

/**
 * 保存用户拖动后的 Element Plus 表格列宽。
 * @param {number} newWidth 新列宽，单位为像素。
 * @param {number} oldWidth 拖动前列宽，单位为像素。
 * @param {{property?: string}} column Element Plus 表格列对象。
 * @returns {void} 直接更新对应列配置。
 */
const handleHeaderDragend = (newWidth, oldWidth, column) => {
  void oldWidth;
  const target = props.tableColumns.find((item) => item.dataIndex === column?.property);
  if (target) target.width = newWidth;
};

/**
 * 将分页器页码和每页数量传给父页面，由父页面维护 BFF 查询状态。
 * @param {number} page 当前页码，从 1 开始。
 * @param {number} size 每页记录数。
 * @returns {void} 发出规范化后的 onChange 事件。
 */
const emitPageChange = (page, size) => {
  const nextPage = Number.isInteger(page) && page > 0 ? page : 1;
  const nextSize = Number.isInteger(size) && size > 0 ? size : pageSize.value;
  emit("onChange", nextPage, nextSize);
};

/**
 * 处理 Element Plus 分页器的每页数量变化，切换数量时回到第一页。
 * @param {number} size 最新每页数量。
 * @returns {void} 发出第一页查询事件。
 */
const handlePageSizeChange = (size) => emitPageChange(1, size);

/**
 * 处理 Element Plus 分页器的页码变化。
 * @param {number} page 最新页码。
 * @returns {void} 发出当前页查询事件。
 */
const handleCurrentChange = (page) => emitPageChange(page, pageSize.value);

/**
 * 清空筛选表单并通知父组件恢复统一维护的 queryState。
 * @returns {void} 发出重置事件并清理 Element Plus 表单状态。
 */
const handleReset = () => {
  emit("onQueryReset");
  form.value?.resetFields?.();
};

/**
 * 加载筛选区下拉框关联数据源，失败时由统一请求层向上抛出而不伪造选项。
 * @param {string} className 关联数据表的 Parse 类名；为空时不执行请求。
 * @returns {Promise<Array<Record<string, unknown>>>} 查询到的关联记录数组。
 */
const loadSelectOptions = async (className) => {
  if (!className) return [];
  selectoptions[className] = await findAll(className);
  return selectoptions[className];
};

/**
 * 打开 CSV 导出记录选择弹窗。
 * @returns {void} 将 exportMap.show 设为 true，由 CommonExport 负责加载导出数据。
 */
const openExport = () => {
  exportMap.show = true;
};

const filterFields = getFilterField(props.fields);
filterFields.forEach((fieldName) => {
  if (getEditComponent(props.fields[fieldName]) === "ElSelect") {
    void loadSelectOptions(props.fields[fieldName]?.componentOption?.selectTable);
  }
});

const currentPage = computed(() => Number(props.queryState?.current || props.queryState?.pageNum) || 1);
const pageSize = computed(() => Number(props.queryState?.pageSize) || 10);
const showPagination = computed(() =>
  Boolean(props.queryState && Object.prototype.hasOwnProperty.call(props.queryState, "total"))
);
</script>

<style lang="scss" scoped>
.common-table {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.common-table__top,
.common-table__bottom {
  flex: 0 0 auto;
  min-width: 0;
}

.common-table__middle {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 1 1 auto;
  flex-direction: column;
}

.common-table__filters {
  min-height: 64px;
  margin-bottom: var(--app-space);
  padding: 12px 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-soft);
}

.common-table__filter-row {
  align-items: center;
  row-gap: 12px;
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
  gap: 12px;
  justify-content: flex-end;
}

.common-table__filter-item {
  margin-bottom: 0;
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

.common-table__data-wrap {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.common-table__row-actions {
  display: flex;
  min-width: max-content;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}

.common-table__pagination {
  flex: 0 0 auto;
  justify-content: flex-end;
  min-height: 48px;
  padding: var(--app-space) 0 0;
}

@media (min-width: 992px) {
  // 桌面端筛选字段和查询操作保持在同一工具栏行；字段过多时只滚动筛选字段区域，
  // 查询、重置和导出按钮仍保持可见，避免操作按钮被挤到下一行。
  .common-table__filter-row,
  .common-table__query-area {
    flex-wrap: nowrap;
  }

  .common-table__filter-fields {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .common-table__filter-item {
    flex: 0 0 auto;
  }
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
    padding: 12px;
  }

  .common-table__filter-fields,
  .common-table__toolbar-actions,
  .common-table__create-action {
    width: 100%;
  }

  .common-table__filter-control {
    width: min(100%, 230px);
  }

  .common-table__filter-item {
    width: 100%;
  }

  .common-table__toolbar-actions,
  .common-table__pagination {
    justify-content: flex-start;
  }
}
</style>
