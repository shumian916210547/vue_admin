<template>
  <section class="profile-page">
    <header class="profile-page__heading management-page__heading">
      <div>
        <span class="management-page__eyebrow">账号设置</span>
        <h1>个人中心</h1>
        <p>维护个人头像、名称和邮箱信息。</p>
      </div>
    </header>

  <el-tabs v-model="activeKey" class="profile-page__card" size="small">
    <el-tab-pane name="1" label="基本信息">
      <el-form
        ref="profileFormRef"
        :model="userInfo"
        label-width="90px"
        class="profile-page__form"
        size="small"
        autocomplete="off"
        label-position="left"
        @submit.prevent="onFinish"
      >
        <el-form-item label="头像" prop="avatar">
          <component
            v-model="userInfo.avatar"
            :max-length="1"
            fileType="image/*"
            :is="Upload"
          ></component>
        </el-form-item>

        <el-form-item
          label="昵称"
          prop="username"
          :rules="[{ required: true, message: '请输入你的昵称', trigger: 'blur' }]"
        >
          <el-input v-model="userInfo.username" disabled placeholder="登录账号不可修改" size="small" />
        </el-form-item>

        <el-form-item
          label="姓名"
          prop="name"
          :rules="[{ required: true, message: '请输入你的姓名', trigger: 'blur' }]"
        >
          <el-input v-model="userInfo.name" placeholder="请输入姓名" size="small" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email" :rules="[{ type: 'email', message: '请输入有效邮箱地址', trigger: 'blur' }]">
          <el-input v-model="userInfo.email" placeholder="请输入邮箱地址" size="small" />
        </el-form-item>

        <el-form-item>
          <el-button size="small" type="primary" native-type="submit" :loading="submitting">更新</el-button>
        </el-form-item>
      </el-form>
    </el-tab-pane>
  </el-tabs>
  </section>
</template>

<script setup>
import Parse from "@/service/parse-client";
import Upload from "@/components/Upload.vue";
import { reactive, ref } from "vue";
import { ElNotification } from "element-plus";
import { arrayImgsToString } from "@/utils/utils";

const activeKey = ref("1");
const userInfo = reactive(Parse.User.current().toJSON());
const submitting = ref(false);
const profileFormRef = ref();

/**
 * 提交已经通过表单校验的个人资料。
 * @returns {Promise<void>} 校验成功后提交当前资料；校验失败时由 Element Plus 保留字段提示。
 */
const onFinish = async () => {
  try {
    await profileFormRef.value.validate();
    await updateUserInfo({ ...userInfo });
  } catch {
    // Element Plus 已在表单项中展示校验信息，校验失败时不重复弹窗。
  }
};

/**
 * 将允许修改的个人资料通过当前会话保存到 BFF，避免直接篡改浏览器认证上下文。
 * @param {{avatar?: unknown, username?: string, name?: string, email?: string}} values 已校验的表单值；头像可为上传组件返回的文件对象数组。
 * @returns {Promise<void>} 资料更新成功后刷新本地用户上下文；失败时保留表单内容并显示错误。
 */
const updateUserInfo = async (values) => {
  const user = Parse.User.current();
  if (!user) {
    ElNotification.error({ title: "会话已失效", message: "请重新登录后再更新个人资料。" });
    return;
  }

  const editableFields = ["avatar", "name", "email"];
  const attributes = Object.fromEntries(
    editableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(values, field))
      .map((field) => [field, values[field]])
  );
  if (attributes.avatar && typeof attributes.avatar === "object") {
    attributes.avatar = arrayImgsToString(attributes.avatar, "url");
  }

  submitting.value = true;
  try {
    Object.keys(attributes).forEach((key) => {
      user.set(key, attributes[key]);
    });
    const success = await user.save({ fields: Object.keys(attributes) });
    ElNotification.success({
      title: sessionStorage.getItem("pageName"),
      message:
        (success.get("name") || success.get("username")) + "更新成功",
    });
  } catch {
    ElNotification.error({
      title: "更新失败",
      message: "个人资料未能保存，请检查网络连接后重试。",
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>

.profile-page__card {
  max-width: 780px;
  padding: var(--app-panel-padding);
  background: var(--app-surface);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-soft);
}

.profile-page__form {
  padding-top: 18px;
}

@media (max-width: 576px) {
  .profile-page__card {
    padding: var(--app-panel-padding);
  }

}
</style>
