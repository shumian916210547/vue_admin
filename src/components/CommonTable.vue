<template>
  <!-- 筛选 -->
  <a-form style="height: 56px">
    <a-row>
      <a-col :span="8">
        <a-form-item
          label="名称"
          v-permission="['permission:query', permissions]"
        >
          <a-input placeholder="请输入名称" v-model:value="name" />
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
          @click="emit('onQuery')"
          style="margin: 0 10px 0 0"
          v-permission="['permission:query', permissions]"
          >查询</a-button
        >
        <a-button
          @click="emit('onQueryReset')"
          v-permission="['permission:reset', permissions]"
          >重置</a-button
        >
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

  <!-- 表格 -->
  <a-table
    :columns="tableColumns"
    :data-source="tableData"
    :pagination="queryState"
    rowKey="objectId"
    @change="emit('onChange', $event)"
    bordered
    @resizeColumn="handleResizeColumn"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'operation'">
        <div style="max-width: 230px; display: flex; align-items: center">
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
            >修改</a-button
          >
          <a-divider type="vertical" />
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
      <template v-else-if="column.key == 'icon'">
        <div style="display: flex; align-items: center">
          <component :is="AntdIcon[record[column.key]]"></component>
          <p>&nbsp;{{ record[column.key] }}</p>
        </div>
      </template>
      <template v-else-if="column.key == 'avatar' || column.key == 'image'">
        <div style="display: flex; align-items: center">
          <a-image :width="80" :src="record[column.key]" />
        </div>
      </template>
      <template
        v-else-if="[column.key] == 'updatedAt' || [column.key] == 'createdAt'"
      >
        <p>{{ record[column.key] }}</p>
      </template>
      <template v-else>
        <a-tooltip placement="top" arrowPointAtCenter>
          <template #title>
            <p>{{ record[column.key]?.name || record[column.key] }}</p>
          </template>
          <p
            :style="{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              maxWidth: column.key == 'avatar' ? '120px' : '',
              width: 'auto',
            }"
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
import { Mixins } from "@/mixins";
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
  fields: {
    required: true,
    type: Object,
  },
});
const name = ref(props.queryVal);
const { queryPermission } = Mixins();
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

function handleResizeColumn(w, col) {
  col.width = w;
}

const permissions = await queryPermission();
</script>

<style lang="scss" scoped>
:deep(p) {
  max-width: auto !important;
  margin-bottom: 0 !important;
}
</style>