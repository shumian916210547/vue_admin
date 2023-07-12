<template>
  <!-- 筛选 -->
  <a-form>
    <a-row>
      <a-col :span="8">
        <a-form-item label="名称">
          <a-input placeholder="请输入名称" v-model:value="name" />
        </a-form-item>
      </a-col>

      <a-col :span="8" :offset="1"> </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-button type="primary" @click="emit('onQuery')">查询</a-button>
        <a-button @click="emit('onQueryReset')">重置</a-button>
      </a-col>
      <a-col :span="2" :offset="2">
        <a-button type="primary" @click="emit('onInsert')">新建</a-button>
      </a-col>
    </a-row>
  </a-form>

  <!-- 表格 -->
  <a-table
    :columns="tableColumns"
    :data-source="tableData"
    :pagination="queryState"
    rowKey="objectId"
    @change="emit('onChange', $event)"
    bordered
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'operation'">
        <template v-if="innerContainerTitle">
          <a-button @click="emit('onAdd', record)">
            {{ innerContainerTitle }}
          </a-button>
          <a-divider type="vertical" />
        </template>
        <a-button @click="emit('onEdit', record)">修改</a-button>
        <a-divider type="vertical" />
        <a-button type="danger" @click="emit('onDelete', record)">
          删除
        </a-button>
      </template>
      <template v-else-if="column.key == 'icon'">
        <component :is="AntdIcon[record[column.key]]"></component>
        <span>&nbsp;{{ record[column.key] }}</span>
      </template>
      <template v-else>
        <a-tooltip placement="top" arrowPointAtCenter>
          <template #title>
            <span> {{ record[column.key]?.name || record[column.key] }}</span>
          </template>
          <p
            style="
              max-width: 200px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            "
          >
            {{ record[column.key]?.name || record[column.key] }}
          </p>
        </a-tooltip>
      </template>
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
  </a-table>
</template>

<script setup>
import { watch, reactive, ref } from "vue";
import * as AntdIcon from "@ant-design/icons-vue";
const props = defineProps({
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
  queryVal: String,
  innerContainer: {
    type: Boolean,
    default: false,
  },
  innerContainerTitle: {
    type: [Boolean, String],
    default: "新增",
  },
});
const name = ref(props.queryVal);
const emit = defineEmits([
  "onChange",
  "onQueryReset",
  "onQuery",
  "onInsert",
  "update:queryVal",
  "onDelete",
  "onEdit",
  "onAdd",
]);
watch(
  name,
  (n) => {
    emit("update:queryVal", n);
  },
  { deep: true }
);

watch(
  () => props.queryVal,
  (n) => {
    name.value = n;
  }
);
</script>