<template>
  <main class="login-page">
    <section class="login-page__intro" aria-label="产品简介">
      <div class="login-page__brand">
        <span class="login-page__brand-mark"><SafetyCertificateOutlined /></span>
        <span>{{ systemTitle }}</span>
      </div>

      <div class="login-page__message">
        <span class="login-page__eyebrow">低代码管理平台</span>
        <h1>用配置构建，<br />用数据驱动。</h1>
        <p>面向多租户后台场景的低代码管理平台，支持动态表结构、模块路由与权限配置。</p>
      </div>

      <ul class="login-page__features">
        <li><span></span>动态表单与数据表格</li>
        <li><span></span>模块、路由与角色权限</li>
        <li><span></span>服务端租户边界保护</li>
      </ul>
    </section>

    <section class="login-page__panel">
      <div class="login-card">
        <div class="login-card__heading">
          <p>欢迎回来</p>
          <h2>登录管理控制台</h2>
          <span>请输入管理员账号与密码继续操作</span>
        </div>

        <a-form
          ref="form"
          :model="formState"
          size="small"
          layout="vertical"
          autocomplete="on"
          @finish="handleLogin"
        >
          <a-form-item
            label="账号"
            name="username"
            :rules="[{ required: true, message: '请输入账号' }]"
          >
            <a-input
              v-model:value="formState.username"
              size="small"
              autocomplete="username"
              placeholder="请输入账号"
            >
              <template #prefix><UserOutlined /></template>
            </a-input>
          </a-form-item>

          <a-form-item
            label="密码"
            name="password"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password
              v-model:value="formState.password"
              size="small"
              autocomplete="current-password"
              placeholder="请输入密码"
            >
              <template #prefix><LockOutlined /></template>
            </a-input-password>
          </a-form-item>

          <a-button
            class="login-card__submit"
            type="primary"
            size="small"
            block
            html-type="submit"
            :loading="submitting"
          >
            登录
          </a-button>
        </a-form>

        <p class="login-card__hint">
          <SafetyCertificateOutlined /> 账户验证通过后将建立受保护的浏览器会话。
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import Parse from "@/service/parse-client";

const router = useRouter();
const submitting = ref(false);
const systemTitle = sessionStorage.getItem("systemTitle") || "后台管理系统";
const formState = reactive({
  username: "",
  password: "",
});

document.title = `登录 | ${systemTitle}`;

/**
 * 提交已通过 Ant Design Vue 表单校验的登录凭据，并由 BFF 建立受保护的浏览器会话。
 * @param {{username: string, password: string}} credentials 表单收集的账号和密码；只通过 Parse 兼容适配层发送到同源 API。
 * @returns {Promise<void>} 登录成功后替换到首页；失败时显示统一错误提示并恢复按钮状态。
 */
const handleLogin = async (credentials) => {
  submitting.value = true;
  try {
    await Parse.User.logIn(credentials.username, credentials.password);
    await router.replace("/");
  } catch (error) {
    notification.error({
      message: "登录失败",
      description: error?.message || "请检查账号、密码和网络连接后重试。",
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  overflow: auto;
  background: var(--app-canvas);

  &__intro {
    position: relative;
    display: flex;
    width: min(52vw, 780px);
    min-height: 100%;
    padding: clamp(36px, 8vw, 108px);
    overflow: hidden;
    color: var(--app-primary-contrast);
    background:
      radial-gradient(circle at 10% 92%, rgba(255, 255, 255, 0.24), transparent 25rem),
      radial-gradient(circle at 86% 12%, rgba(255, 255, 255, 0.18), transparent 22rem),
      linear-gradient(145deg, var(--app-primary-hover), var(--app-primary) 52%, var(--app-primary-hover));
    flex-direction: column;
  }

  &__intro::before,
  &__intro::after {
    position: absolute;
    width: 440px;
    height: 440px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    content: "";
  }

  &__intro::before {
    right: -200px;
    bottom: -150px;
  }

  &__intro::after {
    top: -260px;
    left: -160px;
    width: 520px;
    height: 520px;
  }

  &__brand,
  &__message,
  &__features {
    position: relative;
    z-index: 1;
  }

  &__brand {
    display: flex;
    align-items: center;
    font-size: 17px;
    font-weight: 650;
    letter-spacing: 0.02em;
  }

  &__brand-mark {
    display: grid;
    width: 38px;
    height: 38px;
    margin-right: 11px;
    font-size: 20px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 11px;
    place-items: center;
  }

  &__message {
    max-width: 510px;
    margin: auto 0 36px;
  }

  &__eyebrow {
    color: inherit;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  h1 {
    margin: 16px 0 20px;
    color: inherit;
    font-size: clamp(34px, 4vw, 54px);
    font-weight: 700;
    line-height: 1.18;
    letter-spacing: -0.04em;
  }

  p {
    max-width: 460px;
    margin: 0;
    color: inherit;
    font-size: 15px;
    line-height: 1.8;
  }

  &__features {
    display: grid;
    margin: 0;
    padding: 0;
    gap: 13px;
    list-style: none;

    li {
      display: flex;
      color: inherit;
      font-size: 13px;
      align-items: center;
    }

    span {
      width: 6px;
      height: 6px;
      margin-right: 10px;
      background: currentColor;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(147, 197, 253, 0.12);
    }
  }

  &__panel {
    display: grid;
    min-width: 0;
    min-height: 100%;
    padding: 32px;
    background:
      radial-gradient(circle at 75% 14%, rgba(37, 99, 235, 0.08), transparent 18rem),
      var(--app-canvas);
    flex: 1;
    place-items: center;
  }
}

.login-card {
  width: min(100%, 410px);
  padding: 38px;
  background: var(--app-glass-surface);
  border: 1px solid var(--app-glass-border);
  border-radius: 20px;
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);

  &__heading {
    margin-bottom: 30px;

    p {
      margin: 0 0 8px;
      color: var(--app-primary);
      font-size: 13px;
      font-weight: 600;
    }

    h2 {
      margin: 0;
      color: var(--app-ink);
      font-size: 25px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    span {
      display: block;
      margin-top: 10px;
      color: var(--app-muted);
      font-size: 13px;
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 20px;
  }

  :deep(.ant-form-item-label > label) {
    color: var(--app-text);
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.ant-input-affix-wrapper-lg) {
    padding-top: 7px;
    padding-bottom: 7px;
  }

  &__submit {
    height: 46px;
    margin-top: 4px;
    border-radius: 10px;
    font-size: 15px;
  }

  &__hint {
    display: flex;
    margin: 22px 0 0;
    color: var(--app-muted);
    font-size: 12px;
    line-height: 1.6;
    align-items: flex-start;

    .anticon {
      margin: 3px 6px 0 0;
      color: var(--app-primary);
    }
  }
}

@media (max-width: 860px) {
  .login-page {
    &__intro {
      display: none;
    }

    &__panel {
      min-height: 100dvh;
      padding: 20px;
    }
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 22px;
  }
}
</style>
