<template>
  <template v-if="column && record && Object.keys(fields).length">
    <template
      v-if="column.key == 'icon' && fields[column.key]?.type == 'String'"
    >
      <div style="display: flex; align-items: center">
        <component :is="AntdIcon[record[column.key]]"></component>
        <p>&nbsp;{{ record[column.key] }}</p>
      </div>
    </template>
    <template
      v-else-if="
        (column.key == 'avatar' || column.key == 'image') &&
        fields[column.key]?.type == 'String'
      "
    >
      <div style="display: flex; align-items: center">
        <a-image :width="80" :src="record[column.key]" />
      </div>
    </template>
    <template
      v-else-if="
        fields[column.key]?.type == 'Array' && fields[column.key]?.isPointer
      "
    >
      <p v-for="(item, index) in record[column.key]" :key="index">
        {{ item.name || item.objectId }}
      </p>
    </template>
    <template v-else-if="fields[column.key]?.type == 'Object'">
      <a-tooltip placement="top" arrowPointAtCenter>
        <template #title>
          <p>
            {{ JSON.stringify(record[column.key]) }}
          </p>
        </template>
        <p>{{ JSON.stringify(record[column.key], null, 2) }}</p>
      </a-tooltip>
    </template>
    <template v-else-if="fields[column.key]?.type == 'Array'">
      <span v-for="(item, index) in record[column.key]" :key="index">
        {{ item }}<br />
      </span>
    </template>
    <template v-else-if="fields[column.key]?.type == 'Date'">
      <p>
        {{ moment(record[column.key]).format("YYYY-MM-DD HH:mm:ss") }}
      </p>
    </template>
    <template v-else-if="fields[column.key]?.type == 'Pointer'">
      <p>
        {{ record[column.key]?.name || record[column.key] }}
      </p>
    </template>
    <template v-else>
      <p>{{ record[column.key] }}</p>
    </template>
  </template>
</template>

<script setup>
import moment from "moment";
import * as AntdIcon from "@ant-design/icons-vue";
const props = defineProps({
  column: {
    required: true,
    type: Object,
  },
  record: {
    required: true,
    type: Object,
  },
  fields: {
    required: true,
    type: Object,
    default: () => new Object(),
  },
});
</script>

<style lang="scss" scoped>
* {
  margin: 0;
}
</style>