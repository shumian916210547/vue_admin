<template>
  <template v-if="column && record && Object.keys(fields).length">
    <template
      v-if="column.key == 'icon' && fields[column.key]?.type == 'String'"
    >
      <div class="common-fields__inline">
        <el-icon><component :is="getElementIcon(record[column.key])" /></el-icon>
        <p>{{ record[column.key] }}</p>
      </div>
    </template>
    <template
      v-else-if="
        (column.key == 'avatar' || column.key == 'image') &&
        fields[column.key]?.type == 'String'
      "
    >
      <div class="common-fields__inline">
        <el-image
          class="common-fields__image"
          :src="record[column.key]"
          :preview-src-list="record[column.key] ? [record[column.key]] : []"
          fit="cover"
          preview-teleported
          alt="图片字段"
        />
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
      <el-tooltip placement="top" :show-after="200">
        <template #content>
          <p>
            {{ JSON.stringify(record[column.key]) }}
          </p>
        </template>
        <p>{{ JSON.stringify(record[column.key], null, 2) }}</p>
      </el-tooltip>
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
import { getElementIcon } from "@/utils/element";
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
p {
  margin: 0;
}

.common-fields__inline {
  display: flex;
  align-items: center;
  gap: var(--app-space-sm);
}

.common-fields__image {
  width: 64px;
  height: 48px;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-xs);
}
</style>
