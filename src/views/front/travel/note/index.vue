<template>
  <a-list
    item-layout="vertical"
    size="large"
    :data-source="listData"
    :pagination="pagination"
    style="width: 100%"
  >
    <template #renderItem="{ item }">
      <a-list-item
        :key="item.objectId"
        style="max-height: 400px; cursor: pointer"
        @click="toPage('note/' + item.objectId)"
      >
        <template #actions>
          <span v-for="{ type, text } in actions" :key="type">
            <component :is="type" style="margin-right: 8px" />
            {{ item[text] }}
          </span>
          <span>
            <component :is="EyeOutlined" style="margin-right: 8px" />
            {{ item.watchNum }}
          </span>
        </template>
        <template #extra>
          <img
            width="272"
            style="height: 100%; object-fit: contain"
            v-if="item.cover"
            :src="item.cover"
          />
        </template>
        <a-list-item-meta :description="item.name">
          <template #title>
            <a :href="item.href">{{ item.user.name }}</a>
          </template>
          <template #avatar><a-avatar :src="item.user.avatar" /></template>
        </a-list-item-meta>
        <div class="line_8" v-html="item.content"></div>
      </a-list-item>
    </template>
  </a-list>
  <div
    :style="{
      position: 'fixed',
      bottom: '100px',
      right: gapRight + 'px',
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      borderRadius: '50px',
      backgroundColor: 'rgba(50, 89, 164, 0.3)',
      cursor: 'pointer',
    }"
    @click="toPage('noteIssue')"
    v-if="userInfo"
  >
    <plus-outlined />
    <span>发布我的手记</span>
  </div>
  
</template>

<script setup>
import { reactive, ref } from "vue";

import {
  StarOutlined,
  LikeOutlined,
  MessageOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons-vue";
import { getCommentNum, getNoteList, getStarNum } from "../apis";
import { Mixins } from "@/mixins/index";
const { toPage } = Mixins();
const listData = ref([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  total: 0,
  sortValue: "createdAt",
  onChange: (page) => {
    pagination.pageNum = page;
    loadData(pagination);
  },
});
const loadData = async (params) => {
  const result = await getNoteList(params);
  listData.value = result.data;
  pagination.total = result.count;
  for (const item of listData.value) {
    item.starNum = await getStarNum(item.objectId);
    item.commentNum = await getCommentNum(item.objectId);
  }
};
const radioChange = () => {
  pagination.pageNum = 1;
  loadData(pagination);
};
loadData(pagination);
const gapRight = (window.innerWidth - 920) / 2;
const actions = [
  {
    type: LikeOutlined,
    text: "starNum",
  },
  {
    type: MessageOutlined,
    text: "commentNum",
  },
];
const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
</script>


<style lang="scss" scoped>
@import url("@/assets/scss/global.scss");
</style>