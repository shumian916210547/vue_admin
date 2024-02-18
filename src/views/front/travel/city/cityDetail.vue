<template>
  <a-list
    item-layout="vertical"
    size="large"
    :data-source="listData"
    style="width: 100%"
  >
    <template #renderItem="{ item }">
      <a-list-item :key="item.objectId">
        <a-list-item-meta>
          <template #title>
            <a :href="item.href">{{ item.name }}</a>
          </template>
          <template #avatar><a-avatar :src="item.avatar" /></template>
        </a-list-item-meta>
        <div v-html="item.content"></div>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { queryCityById } from "../apis";
const route = useRoute();
const listData = ref("");
queryCityById(route.params.objectId).then((res) => {
  listData.value = [res];
});
</script>