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
        <div
          v-if="userInfo.objectId"
          style="display: flex; justify-content: center"
        >
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
  <h3>评论</h3>
  <a-input-group compact v-if="userInfo.objectId">
    <a-input
      v-model:value="commentValue"
      placeholder="请输入你的评论"
      required
      allowClear
      :maxlength="200"
      showCount
      style="width: calc(100% - 200px)"
    />
    <a-button type="primary" @click="sendComment">发送</a-button>
  </a-input-group>
  <a-list
    class="demo-loadmore-list"
    :loading="initLoading"
    item-layout="horizontal"
    :data-source="commentList"
  >
    <template #loadMore>
      <div
        v-if="!initLoading && !loading"
        :style="{
          textAlign: 'center',
          marginTop: '12px',
          height: '32px',
          lineHeight: '32px',
        }"
      >
        <a-button @click="onLoadMore">loading more</a-button>
      </div>
    </template>
    <template #renderItem="{ item, index }">
      <a-list-item :key="item.objectId">
        <template #actions>
          <a
            key="list-loadmore-edit"
            style="color: red"
            v-if="item.user.objectId == userInfo.objectId"
            @click="handleRemove(item, index)"
          >
            删除
          </a>
        </template>
        <a-skeleton avatar :title="false" :loading="!!item.loading" active>
          <a-list-item-meta :description="item.content">
            <template #title>
              {{ item.user.name }}
            </template>
            <template #avatar>
              <a-avatar :src="item.user.avatar" />
            </template>
          </a-list-item-meta>
        </a-skeleton>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import {
  queryNoteById,
  getIsStar,
  updateStar,
  removeStar,
  getCommentlist,
  updateComment,
  removeComment,
} from "../apis";
import { EyeOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons-vue";
const route = useRoute();
const listData = ref();
const userInfo = JSON.parse(sessionStorage.getItem("userInfo")) || {};

const loadData = async () => {
  let result = await queryNoteById(route.params.objectId);
  for (const item of [result]) {
    if (userInfo.objectId) item.isStar = await getIsStar(item.objectId);
  }
  listData.value = [result];
};
const handleStar = async (item) => {
  item.isStar = (await updateStar(item.objectId)).id ? true : false;
};

const cancelStar = async (item) => {
  item.isStar = (await removeStar(item.objectId)).id ? false : true;
};

const commentList = ref([]);
const initLoading = ref(true);
const loading = ref(false);
const queryParams = reactive({
  pageSize: 10,
  pageNum: 1,
  id: route.params.objectId,
});
/* 获取评论列表 */
const loadCommentList = async (params) => {
  loading.value = true;
  commentList.value = [...commentList.value, ...(await getCommentlist(params))];
  loading.value = false;
};
const onLoadMore = () => {
  queryParams.pageNum = 2;
  loadCommentList(queryParams);
};

const commentValue = ref("");
/* 发送评论 */
const sendComment = async () => {
  if (!commentValue.value.length) return;
  const result = await updateComment(route.params.objectId, commentValue.value);
  if (result.id) {
    commentList.value.unshift({
      content: commentValue.value,
      user: JSON.parse(sessionStorage.getItem("userInfo")),
      objectId: result.id,
    });
  }
  commentValue.value = "";
};

/* 删除评论 */
const handleRemove = async ({ objectId }, index) => {
  const result = await removeComment(objectId);
  if (result.id) {
    commentList.value.splice(index, 1);
  }
};

loadData();
onMounted(() => {
  loadCommentList(queryParams), (initLoading.value = false);
});
</script>