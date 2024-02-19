<template>
  <a-tabs
    v-model:activeKey="pagination.className"
    @change="loadData(pagination)"
  >
    <a-tab-pane key="" tab="基本信息">
      <a-form
        :model="userInfo"
        name="basic"
        :label-col="{ span: 3 }"
        :wrapper-col="{ span: 5 }"
        autocomplete="off"
        labelAlign="left"
        @finish="onFinish"
      >
        <a-form-item label="头像" name="avatar">
          <component
            v-model:files="userInfo.avatar"
            :maxLength="1"
            :is="Upload"
          ></component>
        </a-form-item>

        <a-form-item
          label="昵称"
          name="username"
          :rules="[{ required: true, message: '请输入你的昵称' }]"
        >
          <a-input v-model:value="userInfo.username" disabled />
        </a-form-item>

        <a-form-item
          label="姓名"
          name="name"
          :rules="[{ required: true, message: '请输入你的姓名' }]"
        >
          <a-input v-model:value="userInfo.name" />
        </a-form-item>

        <a-form-item label="邮箱" name="email" :rules="[{ type: 'email' }]">
          <a-input v-model:value="userInfo.email" />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
          <a-button type="primary" html-type="submit">更新</a-button>
        </a-form-item>
      </a-form>
    </a-tab-pane>
    <a-tab-pane key="TravelNotes" tab="我发布的手记">
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
            @click="toPage('/front/travel/note/' + item.objectId)"
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
    </a-tab-pane>
    <a-tab-pane key="TravelStrategy" tab="我发布的攻略">
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
            @click="toPage('/front/travel/strategy/' + item.objectId)"
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
    </a-tab-pane>
  </a-tabs>
</template>

<script setup>
import Parse from "parse";
import Upload from "@/components/Upload.vue";
import { onMounted, reactive, ref } from "vue";
import { Capture } from "@/service/service.config";
import { notification } from "ant-design-vue";
import { arrayImgsToString } from "@/utils/utils";
import { getMyList } from "../apis";
import { Mixins } from "@/mixins";
import {
  StarOutlined,
  LikeOutlined,
  MessageOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons-vue";
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

const { toPage } = Mixins();
const userInfo = reactive(JSON.parse(sessionStorage.getItem("userInfo")));

const onFinish = (values) => {
  updateUserInfo(values);
};

const updateUserInfo = async (params) => {
  const user = Parse.User.current();
  if (typeof params.avatar == "object")
    params.avatar = arrayImgsToString(params.avatar, "url");
  Object.keys(params).forEach((key) => {
    user.set(key, params[key]);
  });
  return await Capture(user.save()).then((success) => {
    notification.success({
      message: sessionStorage.getItem("pageName"),
      description:
        (success.get("name") || success.get("username")) + "更新成功",
    });
  });
};

const listData = ref([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  total: 0,
  className: "",
  sortValue: "createdAt",
  searchKey: "",
  onChange: (page) => {
    pagination.pageNum = page;
    loadData(pagination);
  },
});
const loadData = async (params) => {
  if (!params.className) return;
  const result = await getMyList(params);
  listData.value = result.data;
  pagination.total = result.count;
};

onMounted(() => {});
</script>