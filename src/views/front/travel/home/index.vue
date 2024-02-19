<template>
  <a-carousel arrows>
    <template #prevArrow>
      <div class="custom-slick-arrow" style="left: 10px; z-index: 1">
        <left-circle-outlined />
      </div>
    </template>
    <template #nextArrow>
      <div class="custom-slick-arrow" style="right: 10px">
        <right-circle-outlined />
      </div>
    </template>
    <div>
      <img
        src="https://image.maigoo.com/upload/images/20191113/15011889836_1200x800.jpg"
        alt=""
        srcset=""
      />
    </div>
    <div>
      <img
        src="https://image.maigoo.com/upload/images/20191113/15011889836_1200x800.jpg"
        alt=""
        srcset=""
      />
    </div>
    <div>
      <img
        src="https://image.maigoo.com/upload/images/20191113/15011889836_1200x800.jpg"
        alt=""
        srcset=""
      />
    </div>
    <div>
      <img
        src="https://image.maigoo.com/upload/images/20191113/15011889836_1200x800.jpg"
        alt=""
        srcset=""
      />
    </div>
  </a-carousel>
  <h1 style="margin-top: 10px">热门攻略推荐</h1>
  <section class="rec">
    <a-list
      item-layout="vertical"
      size="large"
      :data-source="listData"
      style="width: 100%"
    >
      <template #renderItem="{ item }">
        <a-list-item
          :key="item.objectId"
          style="max-height: 400px; cursor: pointer"
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
  </section>
</template>

<script setup>
import {
  LeftCircleOutlined,
  RightCircleOutlined,
  SettingOutlined,
  EditOutlined,
  EllipsisOutlined,
  StarOutlined,
  LikeOutlined,
  MessageOutlined,
  EyeOutlined,
} from "@ant-design/icons-vue";

import { getHotStrategy } from "../apis";
import { ref } from "vue";
import { Mixins } from "@/mixins/index";
const { toPage } = Mixins();
const listData = ref([]);
getHotStrategy().then((data) => {
  listData.value = data;
});
</script>

<style scoped lang="scss">
@import url("@/assets/scss/global.scss");
.ant-carousel :deep(.slick-slide) {
  text-align: center;
  height: 200px;
  line-height: 200px;
  background: #364d79;
  overflow: hidden;
}

.ant-carousel :deep(.slick-arrow.custom-slick-arrow) {
  width: 25px;
  height: 25px;
  font-size: 25px;
  color: #fff;
  background-color: rgba(31, 45, 61, 0.11);
  opacity: 0.3;
  z-index: 1;
}
.ant-carousel :deep(.custom-slick-arrow:before) {
  display: none;
}
.ant-carousel :deep(.custom-slick-arrow:hover) {
  opacity: 0.5;
}

.ant-carousel :deep(.slick-slide h3) {
  color: #fff;
}

.rec {
  display: flex;
  flex-wrap: wrap;

  .rec-card {
    width: 300px;
    margin-top: 10px;
    margin-right: 10px;
  }
  .rec-card:nth-child(n + 3) {
    margin-right: 0;
  }
}
</style>