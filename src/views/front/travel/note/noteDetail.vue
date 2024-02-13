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
        <div style="display: flex; justify-content: center">
          <HeartFilled
            v-if="item.isStar"
            style="font-size: 80px; color: red; cursor: pointer"
            @click="cancelStar(item)"
          ></HeartFilled>

          <HeartOutlined
            v-else
            style="font-size: 80px; color: gray; cursor: pointer"
            @click="handleStar(item)"
          ></HeartOutlined>
        </div>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { queryNoteById, getIsStar, updateStar, removeStar } from "../apis";
const route = useRoute();
const listData = ref();

const loadData = async () => {
  let result = await queryNoteById(route.params.objectId);
  for (const item of [result]) {
    item.isStar = await getIsStar(item.objectId);
  }
  listData.value = [result];
};
const handleStar = async (item) => {
  item.isStar = (await updateStar(item.objectId)).id ? true : false;
};

const cancelStar = async (item) => {
  item.isStar = (await removeStar(item.objectId)).id ? false : true;
};

loadData();
import { EyeOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons-vue";
</script>