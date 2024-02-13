<template>
  <a-list
    item-layout="vertical"
    size="large"
    :data-source="listData"
    style="width: 100%"
  >
    <template #renderItem="{ item }">
      <a-list-item :key="item.objectId">
        <template #actions>
          <span>
            <component :is="EyeOutlined" style="margin-right: 8px" />
            {{ item.watchNum }}
          </span>
        </template>
        <a-list-item-meta :description="item.name">
          <template #title>
            <a :href="item.href">{{ item.user.name }}</a>
          </template>
          <template #avatar><a-avatar :src="item.user.avatar" /></template>
        </a-list-item-meta>
        <div v-html="item.content"></div>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { queryById } from "../apis";
const route = useRoute();
const listData = ref("");
queryById(route.params.objectId).then((res) => {
  listData.value = [res];
});
import { EyeOutlined } from "@ant-design/icons-vue";
</script>