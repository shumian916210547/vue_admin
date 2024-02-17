<template>
  <a-form
    :model="formState"
    v-bind="layout"
    name="nest-messages"
    :validate-messages="validateMessages"
    @finish="onFinish"
  >
    <h3 style="text-align: center">注册</h3>

    <a-form-item
      :name="['user', 'avatar']"
      label="头像"
      :rules="[{ required: true }]"
    >
      <a-upload
        v-model:file-list="fileList"
        name="file"
        list-type="picture-card"
        class="avatar-uploader"
        :show-upload-list="false"
        :action="uploadServer"
        :before-upload="beforeUpload"
        @change="handleChange"
      >
        <img
          v-if="formState.user.avatar"
          :src="formState.user.avatar"
          style="height: 100px; width: 100px; object-fit: contain"
          alt="avatar"
        />
        <div v-else>
          <loading-outlined v-if="loading"></loading-outlined>
          <plus-outlined v-else></plus-outlined>
          <div class="ant-upload-text">Upload</div>
        </div>
      </a-upload>
    </a-form-item>

    <a-form-item
      :name="['user', 'username']"
      label="username"
      :rules="[{ required: true }]"
    >
      <a-input v-model:value="formState.user.username" />
    </a-form-item>
    <a-form-item
      :name="['user', 'name']"
      label="name"
      :rules="[{ required: true }]"
    >
      <a-input v-model:value="formState.user.name" />
    </a-form-item>
    <a-form-item
      :name="['user', 'email']"
      label="email"
      :rules="[{ type: 'email', required: true }]"
    >
      <a-input v-model:value="formState.user.email" />
    </a-form-item>
    <a-form-item
      :name="['user', 'password']"
      label="password"
      :rules="[{ required: true }]"
    >
      <a-input type="password" v-model:value="formState.user.password" />
    </a-form-item>
    <a-form-item :wrapper-col="{ ...layout.wrapperCol, offset: 8 }">
      <a-button type="primary" html-type="submit">Submit</a-button>
    </a-form-item>
  </a-form>
</template>
<script setup>
import { defineComponent, reactive, ref } from "vue";
import { userSignUp } from "../apis";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { Mixins } from "@/mixins";
function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
}
const uploadServer = process.env.VUE_APP_PARSE_SERVER_HOST + "/upload";
const { toPage } = Mixins();
const fileList = ref([]);
const loading = ref(false);
const handleChange = (info) => {
  if (info.file.status === "uploading") {
    loading.value = true;
    return;
  }
  if (info.file.status === "done") {
    // Get this url from response in real world.
    getBase64(info.file.originFileObj, (base64Url) => {
      formState.user.avatar = base64Url;
      loading.value = false;
    });
  }
  if (info.file.status === "error") {
    loading.value = false;
    message.error("upload error");
  }
};
const beforeUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("You can only upload JPG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Image must smaller than 2MB!");
  }
  return isJpgOrPng && isLt2M;
};

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 16,
  },
};
const validateMessages = {
  required: "${label} 必填!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
    username: "${label} is not a valid username!",
    password: "${label} is not a valid password!",
    avatar: "${label} is not a valid avatar!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};
const formState = reactive({
  user: {
    name: "",
    username: undefined,
    email: "",
    password: "",
    avatar: "",
  },
});
const onFinish = async (values) => {
  const result = await userSignUp(values.user);
  if (result.id) {
    toPage("/front/travel/login");
  }
};
</script>