<template>
  <h1 style="margin-top: 10px">看看大家的行程攻略</h1>
  <a-radio-group v-model:value="sortValue">
    <a-radio-button value="a">最新发布</a-radio-button>
    <a-radio-button value="b">浏览最多</a-radio-button>
  </a-radio-group>
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
import { ref } from "vue";

const sortValue = ref("a");
</script>


<style lang="scss" scoped>
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