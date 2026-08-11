<template>
  <section class="operations-dashboard">
    <header class="operations-dashboard__heading">
      <div>
        <span class="operations-dashboard__eyebrow">受控运维</span>
        <h1>运维看板</h1>
        <p>仅在受控内部网络中加载内部运维看板，避免将数据库运维入口暴露给业务用户。</p>
      </div>
      <span :class="['operations-dashboard__status', { 'operations-dashboard__status--inactive': !url }]">
        <span></span>{{ url ? "受控入口已配置" : "受控入口未配置" }}
      </span>
    </header>

    <iframe
      v-if="url"
      :src="url"
      title="受控运维看板"
      frameborder="0"
      class="operations-dashboard__frame"
    ></iframe>
    <el-empty v-else class="operations-dashboard__empty" description="内部运维看板仅在受控网络中提供，请通过运维入口访问。" />
  </section>
</template>

<script setup>
const url = window.__SHUMIAN_CONFIG__?.dashboardUrl || process.env.VUE_APP_DASHBOARD_URL || "";
</script>

<style lang="scss" scoped>
.operations-dashboard {
  display: flex;
  height: 100%;
  min-height: 360px;
  flex-direction: column;
}

.operations-dashboard__heading {
  display: flex;
  flex: 0 0 auto;
  margin-bottom: 24px;
  padding-bottom: 0;
  border-bottom: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.operations-dashboard__eyebrow {
  color: var(--app-primary);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.13em;
}

.operations-dashboard h1 {
  margin: 6px 0 7px;
  color: var(--app-ink);
  font-size: 24px;
  font-weight: 750;
}

.operations-dashboard p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.operations-dashboard__status {
  display: inline-flex;
  flex: 0 0 auto;
  margin-top: 8px;
  padding: 6px 10px;
  color: var(--app-success);
  font-size: 12px;
  font-weight: 650;
  background: rgba(var(--app-success-rgb), 0.1);
  border-radius: 999px;
  align-items: center;
  gap: 7px;
}

.operations-dashboard__status > span {
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
}

.operations-dashboard__status--inactive {
  color: var(--app-warning);
  background: rgba(var(--app-warning-rgb), 0.12);
}

.operations-dashboard__frame {
  width: 100%;
  min-height: 0;
  border: 0;
  border-radius: var(--app-radius);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-soft);
  flex: 1 1 auto;
}

.operations-dashboard__empty {
  display: grid;
  min-height: 260px;
  border: 1px dashed var(--app-border);
  border-radius: var(--app-radius);
  background: rgba(var(--app-primary-rgb), 0.035);
  place-items: center;
}

@media (max-width: 576px) {
  .operations-dashboard__heading {
    display: block;
  }

  .operations-dashboard__status {
    margin-top: 12px;
  }
}
</style>
