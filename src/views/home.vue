<template>
  <section class="workspace-dashboard" :aria-busy="dashboardLoading">
    <header class="workspace-dashboard__header">
      <div>
        <span class="workspace-dashboard__eyebrow">运营概览</span>
        <h1>{{ greeting }}，{{ userDisplayName }}</h1>
        <p>这里汇总你的登录活跃、天气、常用入口和位置服务状态。</p>
      </div>
      <div class="workspace-dashboard__header-actions">
        <span class="workspace-dashboard__date">{{ currentDateLabel }}</span>
        <a-button size="small" :loading="refreshing" @click="refreshDashboard">
          <template #icon><ReloadOutlined /></template>
          刷新概览
        </a-button>
      </div>
    </header>

    <section class="dashboard-hero" aria-label="今日工作摘要">
      <div class="dashboard-hero__content">
        <span class="dashboard-hero__badge">
          <span class="dashboard-hero__badge-icon" aria-hidden="true"><SafetyCertificateOutlined /></span>
          受保护的工作会话
        </span>
        <h2>让每一次操作，都始于清晰的全局视野。</h2>
        <p>当前会话由服务端认证、HttpOnly Cookie 与 CSRF 校验保护；数据统计仅归属于当前账号与租户。</p>
        <div class="dashboard-hero__meta">
          <span><FieldTimeOutlined /> {{ lastLoginText }}</span>
          <span><CheckCircleFilled /> 服务状态正常</span>
        </div>
      </div>

      <aside class="weather-card" aria-label="实时天气">
        <div class="weather-card__heading">
          <span><CloudOutlined /> 实时天气</span>
          <a-tooltip title="刷新天气">
            <button
              class="weather-card__refresh"
              type="button"
              aria-label="刷新天气"
              :disabled="weatherLoading"
              @click="loadWeather"
            >
              <ReloadOutlined :spin="weatherLoading" />
            </button>
          </a-tooltip>
        </div>
        <div class="weather-card__main">
          <span class="weather-card__icon-wrap" aria-hidden="true">
            <CloudOutlined class="weather-card__icon" />
          </span>
          <strong>{{ weather.temperature === null ? "--" : `${weather.temperature}°` }}</strong>
          <span>{{ weather.description }}</span>
        </div>
        <div class="weather-card__details">
          <span><EnvironmentOutlined /> {{ weather.location }}</span>
          <span>风速 {{ weather.windSpeed === null ? "--" : `${weather.windSpeed} km/h` }}</span>
        </div>
        <p v-if="weatherError" class="weather-card__notice">{{ weatherError }}</p>
        <p v-else class="weather-card__notice">{{ weatherUpdateText }}</p>
      </aside>
    </section>

    <section class="login-stats" aria-label="登录与活跃统计" :aria-busy="dashboardLoading">
      <header class="login-stats__header">
        <div>
          <span class="workspace-dashboard__eyebrow">个人使用</span>
          <h2>登录统计</h2>
          <p>仅展示当前账号的登录与活跃节奏，数据由服务端会话记录。</p>
        </div>
        <span
          :class="[
            'login-stats__status',
            {
              'login-stats__status--error': overviewError,
              'login-stats__status--loading': dashboardLoading && !overviewError,
            },
          ]"
        >
          <span></span>{{ overviewError ? "数据加载失败" : dashboardLoading ? "正在同步" : "数据已同步" }}
        </span>
      </header>

      <div class="stat-grid login-stats__metrics">
        <article v-for="statistic in statisticCards" :key="statistic.key" class="stat-card">
          <span :class="['stat-card__icon', `stat-card__icon--${statistic.tone}`]">
            <component :is="statistic.icon" />
          </span>
          <div class="stat-card__content">
            <span>{{ statistic.label }}</span>
            <strong>{{ statistic.value }}<small>{{ statistic.unit }}</small></strong>
            <p>{{ statistic.description }}</p>
          </div>
        </article>
      </div>

      <article class="dashboard-panel dashboard-panel--trend">
        <header class="dashboard-panel__header">
          <div>
            <span class="dashboard-panel__eyebrow">登录记录日历</span>
            <h2>登录活跃日历</h2>
          </div>
          <span class="dashboard-panel__tag">{{ dashboardLoading || overviewError ? "--" : overview.totalLogins }} 次累计登录</span>
        </header>

        <div v-if="dashboardLoading && !overviewError" class="trend-chart trend-chart--loading" aria-label="登录日历加载中">
          <span v-for="index in 30" :key="index" class="trend-chart__skeleton"></span>
        </div>
        <div v-else-if="overviewError" class="dashboard-panel__empty-state">
          <p>{{ overviewError }}</p>
          <a-button size="small" @click="loadOverview">重试</a-button>
        </div>
        <div v-else class="trend-chart" aria-label="登录记录日历">
          <a-calendar class="login-calendar" :fullscreen="false">
            <template #dateCellRender="{ current }">
              <span
                v-if="hasLoginOnDate(calendarDateKey(current))"
                class="login-calendar__dot"
                aria-label="当天有登录记录"
              ></span>
            </template>
          </a-calendar>
        </div>
        <p class="dashboard-panel__caption">蓝色标点表示当天存在成功登录记录；日历数据由服务端按当前账号汇总，不包含其他成员的会话信息。</p>
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid--secondary">
      <article class="dashboard-panel dashboard-panel--quick-actions">
        <header class="dashboard-panel__header">
          <div>
            <span class="dashboard-panel__eyebrow">快捷入口</span>
            <h2>常用入口</h2>
          </div>
          <AppstoreOutlined class="dashboard-panel__header-icon" />
        </header>
        <div class="quick-action-grid">
          <button
            v-for="action in quickActions"
            :key="action.pageKey"
            class="quick-action"
            type="button"
            @click="goToQuickAction(action)"
          >
            <span><AppstoreOutlined /></span>
            <strong>{{ action.name }}</strong>
            <small>{{ action.description }}</small>
          </button>
        </div>
      </article>
    </section>

    <section class="location-panel">
      <header class="dashboard-panel__header">
        <div>
          <span class="dashboard-panel__eyebrow">位置服务</span>
          <h2>位置服务工作台</h2>
        </div>
        <div class="location-panel__actions">
          <span :class="['location-panel__status', { 'location-panel__status--error': mapMessage }]">
            <span></span>{{ mapMessage || (mapLoading ? "正在加载地图" : "地图已就绪") }}
          </span>
          <a-button size="small" :loading="mapLoading" @click="refreshMap">
            <template #icon><ReloadOutlined /></template>
            重载地图
          </a-button>
        </div>
      </header>

      <div class="location-panel__canvas">
        <div id="dashboardMap" class="location-panel__map"></div>
        <div v-if="mapLoading" class="location-panel__overlay">
          <a-spin tip="正在加载地图服务..." size="small" />
        </div>
        <div v-else-if="mapMessage" class="location-panel__overlay">
          <a-empty :description="mapMessage">
            <template #image><EnvironmentOutlined class="location-panel__empty-icon" /></template>
          </a-empty>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloudOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  LoginOutlined,
  ReloadOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons-vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import { Mixins } from "@/mixins";
import { getDashboardOverview } from "@/service/dashboard.service";
import Parse from "@/service/parse-client";
import { getCurrentWeather, getWeatherRuntimeConfig } from "@/service/weather.service";
import store from "@/store";

const EMPTY_OVERVIEW = Object.freeze({
  totalLogins: 0,
  loginToday: 0,
  activeDaysLast30: 0,
  consecutiveActiveDays: 0,
  currentSessionStartedAt: null,
  lastLoginAt: null,
  weeklyActivity: [],
  loginDays: [],
});
const weatherConfig = getWeatherRuntimeConfig();
const { toPage } = Mixins();
const overview = ref({ ...EMPTY_OVERVIEW });
const weather = ref({
  location: weatherConfig.location,
  locationSource: "config",
  temperature: null,
  weatherCode: null,
  description: "正在获取天气",
  windSpeed: null,
  observedAt: null,
});
const dashboardLoading = ref(true);
const refreshing = ref(false);
const overviewError = ref("");
const weatherLoading = ref(true);
const weatherError = ref("");
const currentTime = ref(new Date());
const mapLoading = ref(false);
const mapMessage = ref("");
let map;
let clockTimer;

/**
 * 根据当前小时返回自然的中文问候语。
 * @param {Date} value 当前浏览器时间。
 * @returns {string} 早上好、下午好、晚上好或夜深了。
 */
const getGreeting = (value) => {
  const hour = value.getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
};

/**
 * 将 ISO 时间转换为当前浏览器地区可读的短日期时间。
 * @param {string | null | undefined} value 服务端返回的 ISO 时间字符串。
 * @returns {string} 可读时间；无效或为空时返回“暂无记录”。
 */
const formatDateTime = (value) => {
  if (!value) return "暂无记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * 格式化当前会话时长，最小显示为分钟以避免首页计时器造成视觉跳动。
 * @param {string | null | undefined} startedAt 当前会话开始的 ISO 时间字符串。
 * @param {Date} now 当前浏览器时间。
 * @returns {string} 例如“12 分钟”或“2 小时 10 分钟”；无会话时间时返回“--”。
 */
const formatSessionDuration = (startedAt, now) => {
  if (!startedAt) return "--";
  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) return "--";
  const totalMinutes = Math.max(Math.floor((now.getTime() - started.getTime()) / 60_000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${Math.max(minutes, 1)} 分钟`;
  return `${hours} 小时${minutes ? ` ${minutes} 分钟` : ""}`;
};

/**
 * 从动态模块菜单中提取最多六个可跳转页面，用于首页快捷入口。
 * @param {Array<Record<string, unknown>>} moduleList Vuex 中已授权的一级模块列表。
 * @returns {Array<{path: string, pageKey: string, name: string, description: string}>} 已过滤菜单隐藏项的快捷入口数组。
 */
const collectQuickActions = (moduleList) => {
  const actions = [];
  for (const module of moduleList || []) {
    if (module.path === "home") continue;
    if (module.children?.length) {
      for (const child of module.children) {
        if (child.menu !== false && child.path && module.path) {
          actions.push({
            path: `/${module.path}/${child.path}`,
            pageKey: child.objectId,
            name: child.name,
            description: module.name || "业务页面",
          });
        }
      }
    } else if (module.menu !== false && module.path) {
      actions.push({
        path: `/${module.path}`,
        pageKey: module.objectId,
        name: module.name,
        description: "业务页面",
      });
    }
  }
  return actions.slice(0, 6);
};

/**
 * 从 BFF 加载当前账号的登录与活跃汇总，并保留已有数据以避免刷新时卡片闪烁。
 * @returns {Promise<void>} 请求完成后更新 overview 或显示可重试的错误说明。
 */
const loadOverview = async () => {
  dashboardLoading.value = true;
  overviewError.value = "";
  try {
    const result = await getDashboardOverview();
    overview.value = { ...EMPTY_OVERVIEW, ...result };
  } catch {
    overviewError.value = "登录统计暂不可用，请检查会话或稍后重试。";
  } finally {
    dashboardLoading.value = false;
  }
};

/**
 * 调用无密钥天气服务获取当前配置城市的实时天气；服务不可达时不影响业务统计和导航。
 * @returns {Promise<void>} 请求完成后更新天气卡片或展示降级说明。
 */
const loadWeather = async () => {
  weatherLoading.value = true;
  weatherError.value = "";
  try {
    weather.value = await getCurrentWeather();
  } catch {
    weather.value = {
      ...weather.value,
      description: "天气服务不可用",
      temperature: null,
      windSpeed: null,
    };
    weatherError.value = "无法连接天气服务，可稍后重试。";
  } finally {
    weatherLoading.value = false;
  }
};

/**
 * 初始化首页保留的位置服务地图。缺少运行时 Key 时显示明确配置指引而不影响其他首页组件。
 * @returns {Promise<void>} 地图创建、配置错误提示或加载失败处理完成后结束。
 */
const initMap = async () => {
  const mapKey = (window.__SHUMIAN_CONFIG__ || {}).mapKey || process.env.VUE_APP_MAP_KEY;
  if (!mapKey) {
    mapMessage.value = "暂未配置地图服务密钥，请在运行时配置中补充 mapKey。";
    return;
  }

  mapLoading.value = true;
  mapMessage.value = "";
  try {
    const AMap = await AMapLoader.load({ key: mapKey, version: "2.0", plugins: [] });
    map = new AMap.Map("dashboardMap", {
      center: [weatherConfig.longitude, weatherConfig.latitude],
      zoom: 10,
      mapStyle: "amap://styles/normal",
    });
    AMap.plugin(["AMap.ToolBar", "AMap.Scale"], () => {
      map?.addControl(new AMap.ToolBar());
      map?.addControl(new AMap.Scale());
    });
  } catch (error) {
    mapMessage.value = error?.message || "地图暂时无法加载，请检查网络和地图服务配置。";
  } finally {
    mapLoading.value = false;
  }
};

/**
 * 销毁并重新加载地图实例，供运行时更新密钥或网络恢复后手动重试。
 * @returns {Promise<void>} 旧地图释放、DOM 就绪并完成新地图初始化后结束。
 */
const refreshMap = async () => {
  map?.destroy?.();
  map = null;
  await nextTick();
  await initMap();
};

/**
 * 同时刷新 BFF 登录统计和天气数据，并将按钮 loading 状态限定在本次操作期间。
 * @returns {Promise<void>} 两项独立请求均完成（成功或降级）后结束。
 */
const refreshDashboard = async () => {
  refreshing.value = true;
  await Promise.all([loadOverview(), loadWeather()]);
  refreshing.value = false;
};

/**
 * 执行首页快捷入口跳转，沿用现有页签历史和权限装配流程。
 * @param {{path: string, pageKey: string, name: string}} action 由当前已授权模块生成的快捷入口对象。
 * @returns {void} 更新当前路由与会话级页签历史。
 */
const goToQuickAction = (action) => {
  toPage(action.path, action.pageKey, action.name);
};

const userDisplayName = computed(
  () => Parse.User.current()?.get("name") || Parse.User.current()?.get("username") || "管理员"
);
const greeting = computed(() => getGreeting(currentTime.value));
const currentDateLabel = computed(() =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(currentTime.value)
);
const lastLoginText = computed(() => `最近登录：${formatDateTime(overview.value.lastLoginAt)}`);
const weatherUpdateText = computed(() =>
  weather.value.observedAt
    ? `数据更新于 ${formatDateTime(weather.value.observedAt)}`
    : weather.value.locationSource === "device"
      ? "已使用设备原生定位"
      : weather.value.locationSource === "ip"
        ? "已使用 IP 城市定位"
        : "使用运行时城市配置"
);
const loginDaySet = computed(() => new Set(Array.isArray(overview.value.loginDays) ? overview.value.loginDays : []));

/**
 * 将 Ant Design Calendar 的 moment/dayjs 日期值规范化为本地自然日键。
 * @param {unknown} value 日历插槽提供的日期对象。
 * @returns {string} YYYY-MM-DD 格式的日期键；无法解析时返回空字符串。
 */
const calendarDateKey = (value) => {
  if (typeof value?.format === "function") return value.format("YYYY-MM-DD");
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 判断日历单元格对应日期是否存在服务端登录记录。
 * @param {string} dateKey YYYY-MM-DD 日期键。
 * @returns {boolean} 当前账号在该自然日有成功登录记录时返回 true。
 */
const hasLoginOnDate = (dateKey) => Boolean(dateKey && loginDaySet.value.has(dateKey));

const overviewReady = computed(() => !dashboardLoading.value && !overviewError.value);
const sessionDuration = computed(() =>
  overviewReady.value ? formatSessionDuration(overview.value.currentSessionStartedAt, currentTime.value) : "--"
);
const statisticCards = computed(() => [
  {
    key: "today-login",
    label: "今日登录",
    value: overviewReady.value ? overview.value.loginToday : "--",
    unit: "次",
    description: "成功建立的受保护会话",
    icon: LoginOutlined,
    tone: "primary",
  },
  {
    key: "consecutive-days",
    label: "连续活跃",
    value: overviewReady.value ? overview.value.consecutiveActiveDays : "--",
    unit: "天",
    description: "包含当前已打开的工作日",
    icon: RiseOutlined,
    tone: "success",
  },
  {
    key: "monthly-active",
    label: "近 30 日活跃",
    value: overviewReady.value ? overview.value.activeDaysLast30 : "--",
    unit: "天",
    description: "用于回顾个人使用节奏",
    icon: CalendarOutlined,
    tone: "warning",
  },
  {
    key: "session-duration",
    label: "本次在线",
    value: sessionDuration.value,
    unit: "",
    description: "当前受保护会话已持续时长",
    icon: FieldTimeOutlined,
    tone: "violet",
  },
]);
const quickActions = computed(() => {
  const actions = collectQuickActions(store.getters["GET_MODULES"]);
  return actions.length
    ? actions
    : [
        {
          path: "/personalCenter",
          pageKey: "personalCenter",
          name: "个人中心",
          description: "维护个人资料与界面偏好",
        },
      ];
});

onMounted(async () => {
  clockTimer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 30_000);
  await nextTick();
  void initMap();
  await refreshDashboard();
});

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  map?.destroy?.();
  map = null;
});
</script>

<style lang="scss" scoped>
.workspace-dashboard {
  display: grid;
  min-width: 0;
  gap: 20px;
}

.workspace-dashboard__header,
.workspace-dashboard__header-actions,
.dashboard-panel__header,
.location-panel__actions,
.weather-card__heading,
.weather-card__details,
.dashboard-hero__meta {
  display: flex;
  align-items: center;
}

.workspace-dashboard__header,
.dashboard-panel__header {
  justify-content: space-between;
  gap: 16px;
}

.workspace-dashboard__header > :first-child,
.dashboard-panel__header > :first-child {
  min-width: 0;
}

.workspace-dashboard__eyebrow,
.dashboard-panel__eyebrow {
  color: var(--app-primary);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.13em;
}

.workspace-dashboard h1,
.dashboard-panel h2 {
  margin: 6px 0 7px;
  color: var(--app-ink);
  font-weight: 750;
  letter-spacing: -0.025em;
}

.workspace-dashboard h1 {
  font-size: clamp(24px, 2.5vw, 30px);
}

.dashboard-panel h2 {
  font-size: 18px;
}

.workspace-dashboard__header p,
.login-stats__header p,
.dashboard-panel__caption {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.login-stats {
  display: grid;
  min-width: 0;
  padding: 20px;
  gap: 16px;
  border: 1px solid var(--app-glass-border);
  border-radius: var(--app-radius-lg);
  background:
    linear-gradient(135deg, rgba(var(--app-primary-rgb), 0.08), transparent 42%),
    var(--app-glass-surface);
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(17px) saturate(135%);
  -webkit-backdrop-filter: blur(17px) saturate(135%);
}

.login-stats__header {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.login-stats__status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  color: var(--app-success);
  font-size: 11px;
  font-weight: 650;
  border: 1px solid rgba(var(--app-success-rgb), 0.2);
  border-radius: 999px;
  background: rgba(var(--app-success-rgb), 0.08);
}

.login-stats__status > span {
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(var(--app-success-rgb), 0.1);
}

.login-stats__status--loading > span {
  animation: login-stats-pulse 1.2s ease-in-out infinite;
}

.login-stats__status--error {
  color: var(--app-danger);
  border-color: rgba(var(--app-danger-rgb), 0.2);
  background: rgba(var(--app-danger-rgb), 0.08);
}

.login-stats__status--error > span {
  box-shadow: 0 0 0 4px rgba(var(--app-danger-rgb), 0.1);
}

@keyframes login-stats-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.85);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.workspace-dashboard__header-actions {
  flex: 0 0 auto;
  gap: 12px;
}

.workspace-dashboard__date {
  color: var(--app-muted);
  font-size: 12px;
}

.dashboard-hero {
  position: relative;
  display: grid;
  min-height: 214px;
  padding: clamp(24px, 4vw, 38px);
  overflow: hidden;
  color: var(--app-primary-contrast);
  border: 1px solid rgba(var(--app-primary-rgb), 0.35);
  border-radius: var(--app-radius-lg);
  background:
    radial-gradient(circle at 15% 115%, rgba(255, 255, 255, 0.24), transparent 24rem),
    radial-gradient(circle at 102% 0%, rgba(255, 255, 255, 0.2), transparent 20rem),
    linear-gradient(135deg, var(--app-primary), var(--app-primary-hover));
  box-shadow: 0 18px 35px rgba(var(--app-primary-rgb), 0.24);
  grid-template-columns: minmax(0, 1fr) minmax(260px, 330px);
  gap: 28px;
}

.dashboard-hero__content,
.weather-card {
  position: relative;
  z-index: 1;
}

.dashboard-hero__badge {
  display: inline-flex;
  padding: 6px 10px;
  color: inherit;
  font-size: 12px;
  font-weight: 650;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  align-items: center;
  gap: 6px;
}

.dashboard-hero__badge-icon {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  flex: 0 0 18px;
}

.dashboard-hero__badge-icon .anticon {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.dashboard-hero h2 {
  max-width: 600px;
  margin: 17px 0 10px;
  color: inherit;
  font-size: clamp(23px, 3vw, 32px);
  font-weight: 760;
  line-height: 1.25;
  letter-spacing: -0.035em;
}

.dashboard-hero__content > p {
  max-width: 660px;
  margin: 0;
  color: inherit;
  font-size: 13px;
  line-height: 1.8;
  opacity: 0.82;
}

.dashboard-hero__meta {
  margin-top: 21px;
  flex-wrap: wrap;
  gap: 13px 18px;
  font-size: 12px;
  opacity: 0.92;
}

.dashboard-hero__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.weather-card {
  align-self: center;
  padding: 18px;
  color: var(--app-ink);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--app-radius);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(17px) saturate(140%);
  -webkit-backdrop-filter: blur(17px) saturate(140%);
}

.weather-card__heading {
  color: inherit;
  font-size: 13px;
  font-weight: 700;
  justify-content: space-between;
}

.weather-card__heading > span,
.weather-card__details span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.weather-card__refresh {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  color: inherit;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  cursor: pointer;
  place-items: center;
}

.weather-card__refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.weather-card__main {
  display: grid;
  margin: 14px 0;
  grid-template-columns: 36px auto minmax(0, 1fr);
  align-items: center;
  gap: 9px;
}

.weather-card__icon-wrap {
  display: grid;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  place-items: center;
}

.weather-card__icon {
  font-size: 28px;
}

.weather-card__main strong {
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.06em;
}

.weather-card__main span {
  font-size: 13px;
  opacity: 0.88;
}

.weather-card__details {
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  opacity: 0.82;
}

.weather-card__notice {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.45;
  opacity: 0.74;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card,
.dashboard-panel,
.location-panel {
  border: 1px solid var(--app-glass-border);
  background: var(--app-glass-surface);
  box-shadow: var(--app-shadow-soft);
  backdrop-filter: blur(17px) saturate(135%);
  -webkit-backdrop-filter: blur(17px) saturate(135%);
}

.stat-card {
  display: flex;
  min-width: 0;
  min-height: 112px;
  padding: 18px;
  border-radius: var(--app-radius);
  align-items: center;
  gap: 13px;
}

.stat-card__icon {
  display: grid;
  width: 40px;
  height: 40px;
  color: var(--app-primary);
  font-size: 18px;
  border-radius: 12px;
  background: var(--app-primary-soft);
  place-items: center;
  flex: 0 0 auto;
}

.stat-card__icon--success {
  color: var(--app-success);
  background: rgba(var(--app-success-rgb), 0.12);
}

.stat-card__icon--warning {
  color: var(--app-warning);
  background: rgba(var(--app-warning-rgb), 0.13);
}

.stat-card__icon--violet {
  color: var(--app-primary-hover);
  background: var(--app-primary-soft);
}

.stat-card__content {
  display: grid;
  min-width: 0;
  gap: 2px;
  align-content: center;
}

.stat-card__content > span,
.stat-card__content p {
  overflow: hidden;
  color: var(--app-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card__content strong {
  overflow: hidden;
  color: var(--app-ink);
  font-size: 25px;
  font-weight: 760;
  line-height: 1.35;
  letter-spacing: -0.035em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card__content small {
  margin-left: 3px;
  color: var(--app-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
}

.stat-card__content p {
  margin: 0;
  font-size: 11px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
  gap: 20px;
}

.dashboard-grid--secondary {
  grid-template-columns: minmax(0, 1fr);
}

.dashboard-panel,
.location-panel {
  min-width: 0;
  padding: 20px;
  border-radius: var(--app-radius);
}

.dashboard-panel__header {
  margin-bottom: 18px;
}

.dashboard-panel__tag {
  max-width: 42%;
  overflow: hidden;
  padding: 5px 9px;
  color: var(--app-primary);
  font-size: 11px;
  font-weight: 650;
  background: var(--app-primary-soft);
  border-radius: 999px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-panel__header-icon {
  color: var(--app-primary);
  font-size: 22px;
}

.trend-chart {
  min-height: 280px;
}

.login-calendar {
  color: var(--app-text);
  background: transparent;
}

.login-calendar :deep(.ant-picker-calendar-header) {
  padding: 0 0 12px;
}

.login-calendar :deep(.ant-picker-calendar-date) {
  border-color: transparent;
}

.login-calendar :deep(.ant-picker-calendar-date:hover),
.login-calendar :deep(.ant-picker-calendar-date-today) {
  background: var(--app-primary-soft);
}

.login-calendar :deep(.ant-picker-calendar-date-value),
.login-calendar :deep(.ant-picker-content th),
.login-calendar :deep(.ant-picker-calendar-header .ant-select-selection-item) {
  color: var(--app-text);
}

.login-calendar :deep(.ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-calendar-date) {
  color: var(--app-primary-contrast);
  background: var(--app-primary);
}

.login-calendar__dot {
  display: block;
  width: 6px;
  height: 6px;
  margin: 4px auto 0;
  background: var(--app-primary);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(var(--app-primary-rgb), 0.12);
}

.trend-chart--loading {
  display: grid;
  height: 280px;
  padding: 10px 4px;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.trend-chart__skeleton {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(var(--app-primary-rgb), 0.08),
    rgba(var(--app-primary-rgb), 0.2),
    rgba(var(--app-primary-rgb), 0.08)
  );
  background-size: 200% 100%;
  animation: trend-chart-skeleton 1.4s ease-in-out infinite;
}

.trend-chart__skeleton:nth-child(2n) {
  opacity: 0.8;
}

.trend-chart__skeleton:nth-child(3n) {
  opacity: 0.6;
}

@keyframes trend-chart-skeleton {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

.dashboard-panel__caption {
  margin-top: 15px;
  font-size: 11px;
}

.dashboard-panel__empty-state {
  display: grid;
  min-height: 190px;
  color: var(--app-muted);
  font-size: 13px;
  place-items: center;
  align-content: center;
  gap: 10px;
}

.dashboard-panel__empty-state p {
  margin: 0;
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.quick-action {
  display: grid;
  min-width: 0;
  min-height: 66px;
  height: 100%;
  padding: 13px;
  color: var(--app-text);
  text-align: left;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  background: rgba(var(--app-primary-rgb), 0.035);
  cursor: pointer;
  grid-template-columns: 28px minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 3px;
  transition: border-color var(--app-transition), background-color var(--app-transition),
    transform var(--app-transition), box-shadow var(--app-transition);
}

.quick-action:hover {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  box-shadow: 0 7px 14px rgba(var(--app-primary-rgb), 0.12);
  transform: translateY(-1px);
}

.quick-action > span {
  display: grid;
  width: 28px;
  height: 28px;
  color: var(--app-primary);
  border-radius: 8px;
  background: var(--app-primary-soft);
  place-items: center;
  grid-row: span 2;
}

.quick-action strong,
.quick-action small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-action strong {
  color: var(--app-ink);
  font-size: 12px;
}

.quick-action small {
  color: var(--app-muted);
  font-size: 10px;
}

.location-panel__actions {
  gap: 10px;
}

.location-panel__actions > .ant-btn {
  min-width: 96px;
}

.location-panel__status {
  display: inline-flex;
  max-width: 330px;
  overflow: hidden;
  color: var(--app-success);
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-items: center;
  gap: 6px;
}

.location-panel__status > span {
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(var(--app-success-rgb), 0.1);
  flex: 0 0 auto;
}

.location-panel__status--error {
  color: var(--app-danger);
}

.location-panel__canvas {
  position: relative;
  height: 330px;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  background: rgba(var(--app-primary-rgb), 0.045);
}

.location-panel__map,
.location-panel__overlay {
  width: 100%;
  height: 100%;
}

.location-panel__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  color: var(--app-muted);
  background: var(--app-glass-strong);
  place-items: center;
}

.location-panel__empty-icon {
  color: var(--app-primary);
  font-size: 42px;
}

@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .workspace-dashboard__header,
  .login-stats__header,
  .dashboard-panel__header,
  .location-panel__actions {
    display: block;
  }

  .workspace-dashboard__header-actions {
    margin-top: 12px;
    justify-content: space-between;
  }

  .dashboard-hero {
    grid-template-columns: 1fr;
  }

  .quick-action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weather-card {
    max-width: none;
  }

  .dashboard-panel__tag,
  .login-stats__status,
  .location-panel__actions > * {
    display: inline-flex;
    margin-top: 10px;
  }

  .dashboard-panel__tag {
    max-width: 100%;
  }

  .location-panel__actions > .ant-btn {
    margin-left: 0;
  }

  .location-panel__status {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}

@media (max-width: 520px) {
  .stat-grid,
  .quick-action-grid {
    grid-template-columns: 1fr;
  }

  .workspace-dashboard__date {
    display: none;
  }

  .dashboard-hero,
  .login-stats,
  .dashboard-panel,
  .location-panel {
    padding: 16px;
  }

  .location-panel__canvas {
    height: 250px;
  }
}
</style>
