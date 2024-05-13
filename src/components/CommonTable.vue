<template>
  <!-- 筛选 -->
  <slot name="top">
    <a-form style="min-height: 56px" :model="where" ref="form">
      <a-row>
        <a-col
          :span="12"
          style="display: flex; align-items: center; flex-wrap: wrap"
        >
          <template
            v-for="(field_name, index) in getFilterField(props.fields)"
            :key="index"
          >
            <a-form-item
              :label="fields[field_name].chineseName"
              style="margin-right: 10px"
              :name="field_name"
              v-permission="['permission:query', permissions]"
            >
              <template v-if="fields[field_name].editComponent == 'ASelect'">
                <component
                  v-model:value="where[field_name]"
                  :placeholder="'请选择' + fields[field_name].chineseName"
                  :allowClear="true"
                  :is="fields[field_name].editComponent"
                  :fieldNames="{
                    label: fields[field_name].componentOption.labelKey,
                    value: fields[field_name].componentOption.valueKey,
                  }"
                  :mode="fields[field_name].componentOption.mode"
                  :options="
                    selectoptions[
                      fields[field_name].componentOption.selectTable
                    ]
                  "
                  style="width: 150px"
                >
                </component>
              </template>
              <template v-else>
                <component
                  style="width: 150px"
                  v-model:value="where[field_name]"
                  :allowClear="true"
                  :placeholder="'请输入' + fields[field_name].chineseName"
                  :is="fields[field_name].editComponent"
                >
                </component>
              </template>
            </a-form-item>
          </template>
        </a-col>
        <a-col
          :span="6"
          :offset="1"
          style="justify-content: space-evenly; display: flex"
        >
          <a-button
            type="primary"
            @click="emit('onQuery')"
            v-permission="['permission:query', permissions]"
            >查询</a-button
          >
          <a-button
            @click="handleReset"
            v-permission="['permission:reset', permissions]"
            >重置</a-button
          >
          <a-button
            @click="
              () => {
                exportMap.show = true;
              }
            "
          >
            导出
          </a-button>
        </a-col>
        <a-col :span="2" :offset="2">
          <a-button
            type="primary"
            @click="emit('onInsert')"
            v-permission="['permission:insert', permissions]"
            >新建</a-button
          >
        </a-col>
      </a-row>
    </a-form>
  </slot>

  <!-- 表格 -->
  <a-table
    :columns="tableColumns"
    :data-source="tableData"
    :pagination="queryState"
    rowKey="objectId"
    :defaultExpandedRowKeys="expandedRowKeys"
    @change="emit('onChange', $event)"
    bordered
    @resizeColumn="handleResizeColumn"
  >
    <template #bodyCell="{ column, record }">
      <!-- 根据数据类型展示数据 -->
      <template v-if="column.key === 'operation'">
        <div style="display: flex; align-items: center; flex-wrap: wrap">
          <a-button
            @click="emit('onPreview', record)"
            v-permission="['permission:preview', permissions]"
          >
            查看
          </a-button>

          <template v-if="innerContainerTitle">
            <a-button
              @click="emit('onAdd', record)"
              v-permission="['permission:insertChildren', permissions]"
            >
              {{ innerContainerTitle }}
            </a-button>
            <a-divider type="vertical" />
          </template>
          <a-button
            @click="emit('onEdit', record)"
            v-permission="['permission:edit', permissions]"
          >
            修改
          </a-button>

          <a-popconfirm
            title="Are you sure delete this task?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="emit('onDelete', record)"
            @cancel="() => {}"
          >
            <a-button
              type="danger"
              v-permission="['permission:remove', permissions]"
            >
              删除
            </a-button>
          </a-popconfirm>
        </div>
      </template>
      <CommonFields
        :column="column"
        :record="record"
        :fields="fields"
      ></CommonFields>
    </template>
    <template
      v-if="innerContainer"
      #expandedRowRender="{ record, index, indent, expanded }"
    >
      <slot
        name="expandedRowRender"
        :record="record"
        :index="index"
        :indent="indent"
        :expanded="expanded"
      ></slot>
    </template>
    <template #expandIcon="{ record }">
      <div v-if="record.routes && record.routes.length">
        <button
          type="button"
          class="ant-table-row-expand-icon ant-table-row-expand-icon-collapsed"
          aria-label="Expand row"
          v-show="expandedRowKeys.indexOf(record.objectId) === -1"
          @click="expand(record.objectId)"
        ></button>
        <button
          type="button"
          class="ant-table-row-expand-icon ant-table-row-expand-icon-expanded"
          aria-label="Collapse row"
          v-show="expandedRowKeys.indexOf(record.objectId) !== -1"
          @click="expand('')"
        ></button>
      </div>
    </template>
  </a-table>

  <CommonExport
    v-model:modalVisible="exportMap.show"
    :className="props.className"
    :tableColumns="tableColumns"
    :fields="props.fields"
  ></CommonExport>
</template>

<script setup>
import { watch, reactive, ref } from "vue";
import * as AntdIcon from "@ant-design/icons-vue";
import { PlusSquareOutlined, MinusSquareOutlined } from "@ant-design/icons-vue";
import { Mixins } from "@/mixins";
import { findAll } from "@/service/base.service";
import CommonExport from "./CommonExport.vue";
import moment from "moment";
import CommonFields from "./CommonFields.vue";
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
  tableData: {
    type: Array,
    defult: () => new Array(),
    required: true,
  },
  queryState: {
    type: Object,
    defult: () => {},
    required: false,
  },
  queryVal: {
    type: Object,
    defult: () => {},
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
});
const where = reactive(props.queryVal);
const { queryPermission, getFilterField } = Mixins();
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

function handleResizeColumn(w, col) {
  col.width = w;
}

const selectoptions = reactive({});
const loadSelectOptions = async (className) => {
  if (!className) return [];
  selectoptions[className] = [];
  selectoptions[className] = await findAll(className);
};

getFilterField(props.fields).forEach((field) => {
  if (props.fields[field].editComponent == "ASelect")
    loadSelectOptions(props.fields[field].componentOption.selectTable);
});

const handleReset = () => {
  emit("onQueryReset");
  form.value.resetFields();
};

const permissions = await queryPermission();

const expandedRowKeys = reactive([]);

const expand = (objectId) => {
  Object.assign(expandedRowKeys, [objectId]);
};
</script>

<style lang="scss" scoped>
:deep(p) {
  margin-bottom: 0 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ant-table-cell button {
  margin: 5px;
}
</style>
