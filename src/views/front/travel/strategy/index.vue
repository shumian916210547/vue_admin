<template>
  <h1 style="margin-top: 10px">看看大家的行程攻略</h1>
  <a-row>
    <a-col :span="8">
      <a-radio-group v-model:value="pagination.sortValue" @change="radioChange">
        <a-radio-button value="createdAt">最新发布</a-radio-button>
        <a-radio-button value="watchNum">浏览最多</a-radio-button>
      </a-radio-group>
    </a-col>
    <a-col :span="8">
      <a-input-search
        v-model:value="pagination.searchKey"
        placeholder="请输入搜索关键词"
        enter-button
        allowClear
        @search="loadData(pagination)"
      />
    </a-col>
    <a-col :span="8"></a-col>
  </a-row>

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
        style="max-height: 334px; cursor: pointer"
        @click="toPage('strategy/' + item.objectId)"
      >
        <template #actions>
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
    @click="toPage('issue')"
    v-if="userInfo"
  >
    <plus-outlined />
    <span>发布我的攻略</span>
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
import { getStrategyList } from "../apis";
import { Mixins } from "@/mixins/index";
const { toPage } = Mixins();
const listData = ref([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  total: 0,
  sortValue: "createdAt",
  searchKey: "",
  onChange: (page) => {
    pagination.pageNum = page;
    loadData(pagination);
  },
});
const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
const loadData = async (params) => {
  const result = await getStrategyList(params);
  listData.value = result.data;
  pagination.total = result.count;
};
const radioChange = () => {
  pagination.pageNum = 1;
  loadData(pagination);
};
loadData(pagination);
const gapRight = (window.innerWidth - 920) / 2;
</script>


<style lang="scss" scoped>
@import url("@/assets/scss/global.scss");
</style>