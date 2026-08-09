<template>
  <section class="profile-page">
    <header class="profile-page__heading">
      <div>
        <span class="profile-page__eyebrow">ACCOUNT SETTINGS</span>
        <h1>个人中心</h1>
        <p>维护个人头像、名称和邮箱信息。</p>
      </div>
    </header>

  <a-tabs v-model:activeKey="activeKey" class="profile-page__card">
    <a-tab-pane key="1" tab="基本信息">
      <a-form
        :model="userInfo"
        name="basic"
        :label-col="{ span: 3 }"
        :wrapper-col="{ span: 5 }"
        class="profile-page__form"
        autocomplete="off"
        labelAlign="left"
        @finish="onFinish"
      >
        <a-form-item label="头像" name="avatar">
          <component
            v-model:files="userInfo.avatar"
            :maxLength="1"
            fileType="image/*"
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
          <a-button type="primary" html-type="submit" :loading="submitting">更新</a-button>
        </a-form-item>
      </a-form>
    </a-tab-pane>
  </a-tabs>
  </section>
</template>

<script setup>
import Parse from "@/service/parse-client";
import Upload from "@/components/Upload.vue";
import { reactive, ref } from "vue";
import { notification } from "ant-design-vue";
import { arrayImgsToString } from "@/utils/utils";

const activeKey = ref("1");
const userInfo = reactive(Parse.User.current().toJSON());
const submitting = ref(false);

/**
 * 提交已经通过表单校验的个人资料。
 * @param {{avatar?: unknown, username?: string, name?: string, email?: string}} values 基本资料表单的字段值。
 * @returns {Promise<void>} 保存完成或失败通知显示后结束。
 */
const onFinish = async (values) => {
  await updateUserInfo(values);
};

/**
 * 将允许修改的个人资料通过当前会话保存到 BFF，避免直接篡改浏览器认证上下文。
 * @param {{avatar?: unknown, username?: string, name?: string, email?: string}} values 已校验的表单值；头像可为上传组件返回的文件对象数组。
 * @returns {Promise<void>} 资料更新成功后刷新本地用户上下文；失败时保留表单内容并显示错误。
 */
const updateUserInfo = async (values) => {
  const user = Parse.User.current();
  if (!user) {
    notification.error({ message: "会话已失效", description: "请重新登录后再更新个人资料。" });
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
    notification.success({
      message: sessionStorage.getItem("pageName"),
      description:
        (success.get("name") || success.get("username")) + "更新成功",
    });
  } catch {
    notification.error({
      message: "更新失败",
      description: "个人资料未能保存，请检查网络连接后重试。",
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.profile-page__heading {
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--app-border);
}

.profile-page__eyebrow {
  color: var(--app-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.profile-page__heading h1 {
  margin: 6px 0 7px;
  color: var(--app-ink);
  font-size: 24px;
  font-weight: 700;
}

.profile-page__heading p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
}

.profile-page__card {
  max-width: 780px;
  padding: 4px 22px 18px;
  background: var(--app-glass-surface);
  border: 1px solid var(--app-glass-border);
  border-radius: 14px;
  box-shadow: var(--app-shadow-soft);
  backdrop-filter: blur(16px) saturate(135%);
  -webkit-backdrop-filter: blur(16px) saturate(135%);
}

.profile-page__form {
  padding-top: 18px;
}

:deep(.profile-page__card .ant-tabs-nav) {
  margin-bottom: 22px;
}

:deep(.profile-page__card .ant-tabs-tab) {
  font-weight: 600;
}

@media (max-width: 576px) {
  .profile-page__card {
    padding: 4px 14px 18px;
  }

  :deep(.profile-page__form .ant-form-item-label) {
    text-align: left;
  }
}
</style>
