<template>
  <section class="not-found-page">
    <img src="@/assets/404.webp" class="not-found-page__image" alt="页面未找到插图" />
    <div class="not-found-page__content">
      <span>404</span>
      <h1>页面未找到</h1>
      <p>你访问的地址可能已变更、无权限访问，或尚未分配到当前角色。</p>
  <a-button size="small" type="primary" @click="goHome">返回首页</a-button>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

/**
 * 返回首页并由路由守卫重新装配当前用户有权限的动态页面。
 * @returns {Promise<void>} 目标路由替换完成后结束。
 */
const goHome = async () => {
  await router.replace("/home");
};
</script>

<style lang="scss" scoped>
.not-found-page {
  display: grid;
  min-height: 100%;
  padding: 30px;
  text-align: center;
  border: 1px solid var(--app-glass-border);
  border-radius: var(--app-radius);
  background: var(--app-glass-surface);
  place-items: center;
  align-content: center;
  gap: 16px;
}

.not-found-page__image {
  width: min(100%, 360px);
  max-height: 42vh;
  object-fit: contain;
}

.not-found-page__content > span {
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.14em;
}

.not-found-page h1 {
  margin: 7px 0;
  color: var(--app-ink);
  font-size: 26px;
}

.not-found-page p {
  max-width: 420px;
  margin: 0 0 16px;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.8;
}
</style>
