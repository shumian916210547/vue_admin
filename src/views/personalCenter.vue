<template>
  <a-tabs v-model:activeKey="activeKey">
    <a-tab-pane key="1" tab="基本信息">
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
          <a-input v-model:value="userInfo.username" />
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
  </a-tabs>
</template>

<script setup>
import Parse from "parse";
import Upload from "@/components/Upload.vue";
import { reactive, ref } from "vue";
import { Capture } from "@/service/service.config";
import { notification } from "ant-design-vue";
import { arrayImgsToString } from "@/utils/utils";

const activeKey = ref("1");
const userInfo = reactive(Parse.User.current().toJSON());

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
</script>