<template>
  <a-row style="margin-top: 20px">
    <a-col :span="8"> </a-col>
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
    :grid="{ gutter: 16, column: 4 }"
    :data-source="data"
    style="margin-top: 20px; cursor: pointer"
    :pagination="pagination"
  >
    <template #renderItem="{ item }">
      <a-list-item
        :key="item.objectId"
        @click="toPage('hotel/' + item.objectId)"
      >
        <a-card>
          <template #title>
            <h3 style="text-overflow: ellipsis; overflow: hidden">
              {{ item.name }}
            </h3>
            <p
              style="font-size: 12px; text-overflow: ellipsis; overflow: hidden"
            >
              {{ item.address }}
            </p>
          </template>
          <img :src="item.avatar" style="width: 168px" alt="" />
        </a-card>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup>
import { Mixins } from "@/mixins";
import { reactive, ref } from "vue";
import { getHotelList } from "../apis";
const { toPage } = Mixins();
const data = ref([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  total: 0,
  searchKey: "",
  sortValue: "createdAt",
  onChange: (page) => {
    pagination.pageNum = page;
    loadData(pagination);
  },
});

const loadData = async (params) => {
  const result = await getHotelList(params);
  data.value = result.data;
  pagination.total = result.count;
};

loadData(pagination);
</script>