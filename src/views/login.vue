<template>
  <main class="login-page">
    <section class="login-page__intro" aria-label="产品简介">
      <div class="login-page__brand">
        <span class="login-page__brand-mark"><el-icon><CircleCheck /></el-icon></span>
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

        <el-form
          ref="form"
          :model="formState"
          size="small"
          label-position="top"
          autocomplete="on"
          @submit.prevent="handleLogin"
        >
          <el-form-item
            label="账号"
            prop="username"
            :rules="[{ required: true, message: '请输入账号', trigger: 'blur' }]"
          >
            <el-input
              v-model="formState.username"
              size="small"
              autocomplete="username"
              placeholder="请输入账号"
            >
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item
            label="密码"
            prop="password"
            :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
          >
            <el-input
              v-model="formState.password"
              type="password"
              show-password
              size="small"
              autocomplete="current-password"
              placeholder="请输入密码"
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-button
            class="login-card__submit"
            type="primary"
            size="small"
            block
            native-type="submit"
            :loading="submitting"
          >
            登录
          </el-button>
        </el-form>

        <p class="login-card__hint">
          <el-icon class="login-card__hint-icon"><CircleCheck /></el-icon> 账户验证通过后将建立受保护的浏览器会话。
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { CircleCheck, Lock, User } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
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
const form = ref();

document.title = `登录 | ${systemTitle}`;

/**
 * 提交已通过 Element Plus 表单校验的登录凭据，并由 BFF 建立受保护的浏览器会话。
 * @returns {Promise<void>} 登录成功后替换到首页；校验或登录失败时显示统一提示并恢复按钮状态。
 */
const handleLogin = async () => {
  try {
    await form.value.validate();
  } catch {
    return;
  }
  const credentials = { ...formState };
  submitting.value = true;
  try {
    await Parse.User.logIn(credentials.username, credentials.password);
    await router.replace("/");
  } catch (error) {
    ElNotification.error({
      title: "登录失败",
      message: error?.message || "请检查账号、密码和网络连接后重试。",
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
  height: 100dvh;
  min-height: 100vh;
  overflow: auto;
  background: var(--app-canvas);

  &__intro {
    display: flex;
    width: min(46vw, 640px);
    flex: 0 0 auto;
    padding: clamp(32px, 6vw, 80px);
    color: var(--app-text);
    border-right: 1px solid var(--app-border-soft);
    background: var(--app-surface);
    flex-direction: column;
  }

  &__brand {
    display: flex;
    align-items: center;
    color: var(--app-ink);
    font-size: 17px;
    font-weight: var(--app-font-weight);
    gap: 12px;
  }

  &__brand-mark {
    display: grid;
    width: 36px;
    height: 36px;
    color: var(--app-primary);
    background: var(--app-primary-soft);
    border-radius: var(--app-radius);
    font-size: 20px;
    place-items: center;
    flex: 0 0 auto;
  }

  &__message {
    max-width: 460px;
    margin: auto 0 32px;
    padding-top: 48px;
  }

  &__eyebrow {
    color: var(--app-muted);
    font-size: 13px;
  }

  h1 {
    margin: 16px 0;
    color: var(--app-ink);
    font-size: clamp(30px, 3.5vw, 44px);
    font-weight: var(--app-font-weight);
    line-height: 1.45;
  }

  &__message p {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
  }

  &__features {
    display: grid;
    margin: 0;
    padding: 0;
    gap: 12px;
    list-style: none;
    font-size: 13px;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    span {
      width: 5px;
      height: 5px;
      background: var(--app-primary);
      border-radius: 50%;
    }
  }

  &__panel {
    display: grid;
    min-width: 0;
    padding: 32px;
    flex: 1;
    place-items: center;
  }
}

.login-card {
  width: min(100%, 400px);
  padding: 32px;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius);
  background: var(--app-surface);

  &__heading {
    margin-bottom: 28px;

    p {
      margin-bottom: 8px;
      color: var(--app-primary);
      font-size: 13px;
    }

    h2 {
      margin: 0;
      color: var(--app-ink);
      font-size: var(--app-page-title-size);
      font-weight: var(--app-font-weight);
    }

    span {
      display: block;
      margin-top: 10px;
      color: var(--app-muted);
      font-size: 13px;
    }
  }

  &__submit {
    width: 100%;
    margin-top: 8px;
  }

  &__hint {
    display: flex;
    margin: 20px 0 0;
    color: var(--app-muted);
    font-size: 12px;
    line-height: 1.6;
    align-items: flex-start;

    &-icon {
      flex: 0 0 auto;
      margin: 3px 6px 0 0;
      color: var(--app-primary);
    }
  }
}

@media (max-width: 860px) {
  .login-page__intro {
    display: none;
  }

  .login-page__panel {
    padding: var(--app-page-gutter);
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }
}
</style>
