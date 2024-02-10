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
    <div><h3>1</h3></div>
    <div><h3>2</h3></div>
    <div><h3>3</h3></div>
    <div><h3>4</h3></div>
  </a-carousel>
  <h1 style="margin-top: 10px;">热门攻略推荐</h1>
  <section class="rec">
    <a-card class="rec-card" hoverable>
      <template #cover>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </template>
      <a-card-meta title="Card title" description="This is the description">
      </a-card-meta>
    </a-card>
    <a-card class="rec-card" hoverable>
      <template #cover>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </template>
      <a-card-meta title="Card title" description="This is the description">
      </a-card-meta>
    </a-card>
    <a-card class="rec-card" hoverable>
      <template #cover>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </template>
      <a-card-meta title="Card title" description="This is the description">
      </a-card-meta>
    </a-card>
    <a-card class="rec-card" hoverable>
      <template #cover>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </template>
      <a-card-meta title="Card title" description="This is the description">
      </a-card-meta>
    </a-card>
  </section>
</template>

<script setup>
import {
  LeftCircleOutlined,
  RightCircleOutlined,
  SettingOutlined,
  EditOutlined,
  EllipsisOutlined,
} from "@ant-design/icons-vue";
</script>

<style scoped lang="scss">
/* For demo */
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