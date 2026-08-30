<template>
  <component
    :iconMap="iconMap"
    :systemOptions="systemOptions"
    :is="LayoutComponents[systemOptions.layout]"
    :key="systemOptions.showTags"
    :class="['app-shell', { 'app-shell--top': systemOptions.layout === 'TopLayout' }]"
  >
    <template #layout-content>
      <el-main
        :class="[
          'app-content',
          'app-scrollbar',
          {
            'app-content--top': systemOptions.layout === 'TopLayout',
            'app-content--list': isListPage,
          },
        ]"
      >
        <router-view v-slot="{ Component, route }">
          <suspense>
            <template #default>
              <component :is="Component" :key="route.path" />
            </template>
            <template #fallback>
              <div class="page-loading">
                <span class="page-loading__indicator" aria-label="页面加载中">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  页面加载中...
                </span>
              </div>
            </template>
          </suspense>
        </router-view>
      </el-main>
    </template>

    <template #layout-menu>
      <div
        v-if="systemOptions.showLogo"
        class="app-brand"
      >
        <img
          v-if="systemOptions.logoURL"
          :src="systemOptions.logoURL"
          :alt="`${systemTitle} 标识`"
          class="app-brand__logo"
        />
        <span v-else class="app-brand__mark">
          <el-icon><component :is="iconMap['AppstoreOutlined']" /></el-icon>
        </span>
        <span class="app-brand__copy">
          <span class="app-brand__title">{{ systemTitle }}</span>
          <span class="app-brand__caption">低代码管理控制台</span>
        </span>
      </div>
      <el-menu
        :default-openeds="openKeys"
        :default-active="selectedKeys[0]"
        :theme="systemOptions.theme"
        :mode="systemOptions.layout == 'TopLayout' ? 'horizontal' : 'inline'"
        class="app-menu"
        @open="handleMenuOpen"
        @close="handleMenuClose"
      >
        <template v-for="item in modules">
          <template v-if="item.children">
            <el-sub-menu :index="'sub' + item.objectId" :disabled="!item.menu">
              <template #title>
                <span>
                  <el-icon><component :is="iconMap[item.meta.icon]" /></el-icon>
                  <span>{{ item.name }}</span>
                </span>
              </template>
              <template
                v-for="chil in item.children"
                :key="'chil' + chil.objectId"
              >
                <el-menu-item
                  :index="'chil' + chil.objectId"
                  :disabled="!chil.menu"
                  @click="
                    toPage(
                      '/' + item.path + '/' + chil.path,
                      'chil' + chil.objectId,
                      chil.name
                    )
                  "
                >
                  {{ chil.name }}
                </el-menu-item>
              </template>
            </el-sub-menu>
          </template>
          <template v-else>
            <el-menu-item
              :index="item.objectId"
              @click="toPage('/' + item.path, item.objectId, item.name)"
              v-if="item.menu"
            >
              <el-icon><component :is="iconMap[item?.meta?.icon]" /></el-icon>
              <span>{{ item.name }}</span>
            </el-menu-item>
          </template>
        </template>
      </el-menu>
    </template>

    <template #layout-header-right>
      <div class="header-actions">
        <!-- 主题配置 -->
        <el-tooltip content="主题配置" placement="bottom">
          <el-icon
            class="header-action-icon"
            @click="openThemeSettings"
          ><component :is="iconMap['SkinOutlined']" /></el-icon>
        </el-tooltip>

        <template v-if="systemOptions.fullScreen">
          <!-- 全屏 -->
          <el-tooltip content="全屏" placement="bottom" v-if="!isFullScreen">
            <el-icon
              class="header-action-icon"
              @click="zoomPage"
            ><component :is="iconMap['ExpandOutlined']" /></el-icon>
          </el-tooltip>

          <!-- 退出全屏 -->
          <el-tooltip content="退出全屏" placement="bottom" v-else>
            <el-icon
              class="header-action-icon"
              @click="zoomPage"
            ><component :is="iconMap['CompressOutlined']" /></el-icon>
          </el-tooltip>
        </template>

        <!-- 刷新按钮 -->
        <el-tooltip v-if="systemOptions.refresh" content="刷新" placement="bottom">
          <el-icon
              class="header-action-icon"
            @click="pageReload"
          ><component :is="iconMap['ReloadOutlined']" /></el-icon>
        </el-tooltip>

        <el-popover placement="bottom-end" trigger="click">
          <div class="user-popover">
            <el-button
              size="small"
              @click="openPersonalCenter"
            >
              个人中心
            </el-button>
            <el-button size="small" @click="loginOut">
              退出登录
            </el-button>
          </div>
          <template #reference>
            <button
              type="button"
              class="header-right"
              aria-label="打开账户菜单"
              aria-haspopup="menu"
            >
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="`${userDisplayName} 的头像`"
                class="header-avatar"
              />
              <el-icon
                v-else
                class="header-avatar header-avatar--placeholder"
              ><component :is="iconMap['UserOutlined']" /></el-icon>
              <span class="header-user-name">{{ userDisplayName }}</span>
              <el-icon class="header-user-chevron"><component :is="iconMap['DownOutlined']" /></el-icon>
            </button>
          </template>
        </el-popover>
      </div>
    </template>

    <template #layout-tags v-if="systemOptions.showTags">
      <div
        :class="['tags-view', { 'tags-view--top': systemOptions.layout === 'TopLayout' }]"
        :style="{
          padding:
            systemOptions.layout == 'TopLayout' ? '4px 0 4px 0px' : '4px 10px',
        }"
      >
        <template v-for="(item, index) in historyPage" :key="item.pageKey">
          <el-tag
            size="small"
            :class="[
              'tags-view__tag',
              { 'tags-view__tag--active': item.pageKey == selectedKeys[0] },
            ]"
            :color="item.pageKey == selectedKeys[0] ? themeColorValues.primary : undefined"
            :id="item.pageKey"
            @click="handleTag(item)"
            closable
            @close="removeHistoryRoute(index)"
          >
            {{ item.pageName }}
          </el-tag>
        </template>
      </div>
    </template>
  </component>

  <!-- 设置弹窗 -->
  <el-drawer
    v-model="systemModal.show"
    title="主题配置"
    direction="rtl"
    width="390"
    class="system-settings"
  >
    <el-form
      :model="systemOptions"
      autocomplete="off"
      size="small"
      label-position="left"
    >
      <el-form-item label="布局方式">
        <el-select
          v-model="systemOptions.layout"
          size="small"
          placeholder="请选择布局方式"
          @change="handleSystemOptionChange"
          class="system-settings__select"
        >
          <el-option value="LeftLayout" label="纵向" />
          <el-option value="TopLayout" label="横向" />
        </el-select>
      </el-form-item>

      <el-form-item label="界面模式">
        <el-select
          v-model="systemOptions.theme"
          size="small"
          placeholder="请选择界面模式"
          @change="handleSystemOptionChange"
          class="system-settings__select"
        >
          <el-option value="light" label="明亮" />
          <el-option value="dark" label="深色" />
        </el-select>
      </el-form-item>

      <el-form-item label="主题预设" class="system-settings__wide-item">
        <div class="theme-preset-grid" role="group" aria-label="主题预设">
          <button
            v-for="preset in themePresets"
            :key="preset.key"
            :aria-pressed="systemOptions.colorPreset === preset.key"
            :class="[
              'theme-preset-card',
              { 'theme-preset-card--selected': systemOptions.colorPreset === preset.key },
            ]"
            type="button"
            @click="selectThemePreset(preset.key)"
          >
            <span
              class="theme-preset-card__swatch"
              :style="{ background: preset.colors[systemOptions.theme].primary }"
            ></span>
            <span class="theme-preset-card__content">
              <strong>{{ preset.name }}</strong>
              <small>{{ preset.description }}</small>
            </span>
          </button>
        </div>
      </el-form-item>

      <el-form-item label="颜色微调" class="system-settings__wide-item">
        <div class="theme-color-grid">
          <label v-for="colorField in colorFields" :key="colorField.field" class="theme-color-control">
            <span>{{ colorField.label }}</span>
            <span class="theme-color-control__input">
              <input
                :aria-label="`${colorField.label}颜色`"
                :value="themeColorValues[colorField.valueKey]"
                type="color"
                @input="updateThemeColor(colorField.field, $event.target.value)"
              />
              <code>{{ themeColorValues[colorField.valueKey] }}</code>
            </span>
          </label>
        </div>
        <el-button class="theme-color-reset" size="small" @click="resetThemeColors">
          恢复当前预设颜色
        </el-button>
      </el-form-item>

      <el-form-item label="毛玻璃" class="system-settings__wide-item">
        <el-switch
          v-model="systemOptions.glassEffect"
          size="small"
          active-text="开启"
          inactive-text="关闭"
          @change="handleSystemOptionChange"
        />
        <p class="system-settings__hint">开启后，页面容器、导航和弹窗会使用半透明磨砂层与背景柔化效果。</p>
      </el-form-item>

      <el-form-item label="图标">
        <el-switch
          v-model="systemOptions.showLogo"
          size="small"
          active-text="开"
          inactive-text="关"
          @change="handleSystemOptionChange"
        />
      </el-form-item>

      <el-form-item label="资源" v-if="systemOptions.showLogo">
        <component
          v-model="systemOptions.logoURL"
          :max-length="1"
          @change="handleSystemOptionChange"
          fileType="image/*"
          placeholder="请选择系统 Logo"
          :is="Upload"
        ></component>
      </el-form-item>

      <el-form-item label="标签">
        <el-switch
          v-model="systemOptions.showTags"
          size="small"
          active-text="开"
          inactive-text="关"
          @change="handleSystemOptionChange"
        />
      </el-form-item>

      <el-form-item label="刷新">
        <el-switch
          v-model="systemOptions.refresh"
          size="small"
          active-text="开"
          inactive-text="关"
          @change="handleSystemOptionChange"
        />
      </el-form-item>

      <el-form-item label="全屏">
        <el-switch
          v-model="systemOptions.fullScreen"
          size="small"
          active-text="开"
          inactive-text="关"
          @change="handleSystemOptionChange"
        />
      </el-form-item>
    </el-form>
    <p class="system-settings__status" aria-live="polite">
      <span v-if="systemOptionsSaveState === 'saving'">正在保存主题配置…</span>
      <span v-else-if="systemOptionsSaveState === 'dirty'">配置已修改，等待保存</span>
      <span v-else-if="systemOptionsSaveState === 'error'">保存失败，请重试或检查网络连接</span>
      <span v-else-if="systemOptionsSaveState === 'saved'">主题配置已保存</span>
    </p>
  </el-drawer>
</template>


<script setup>
import { ElNotification } from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { Mixins } from "@/mixins/index";
import Parse from "@/service/parse-client";
import store from "@/store";
import {
  applyVisualTheme,
  getEffectiveThemeColors,
  getThemePreset,
  normalizeAppearance,
  persistVisualThemePreference,
  THEME_PRESETS,
} from "@/utils/theme";
import { arrayImgsToString } from "@/utils/utils";
import { elementIconMap } from "@/utils/element";

import LeftLayout from "./LeftLayout.vue";
import TopLayout from "./TopLayout.vue";
import Upload from "./Upload.vue";

const route = useRoute();
const router = useRouter();
const { toPage, historyPage, removeHistoryRoute } = Mixins();
const LayoutComponents = { LeftLayout, TopLayout };
const iconMap = elementIconMap;
const themePresets = THEME_PRESETS;

/**
 * 主题面板的可编辑颜色字段。field 对应系统配置，valueKey 对应实际生效的主题令牌。
 * @type {ReadonlyArray<{field: string, valueKey: string, label: string}>}
 */
const colorFields = Object.freeze([
  { field: "primaryColor", valueKey: "primary", label: "主色" },
  { field: "canvasColor", valueKey: "canvas", label: "页面底色" },
  { field: "surfaceColor", valueKey: "surface", label: "卡片底色" },
  { field: "inkColor", valueKey: "ink", label: "标题颜色" },
  { field: "textColor", valueKey: "text", label: "正文颜色" },
  { field: "mutedColor", valueKey: "muted", label: "辅助颜色" },
  { field: "borderColor", valueKey: "border", label: "边框颜色" },
  { field: "successColor", valueKey: "success", label: "成功颜色" },
  { field: "warningColor", valueKey: "warning", label: "警告颜色" },
  { field: "dangerColor", valueKey: "danger", label: "危险颜色" },
]);

const openKeys = ref([]);
const selectedKeys = ref([""]);
const currentUser = ref(Parse.User.current());
const systemTitle = ref(sessionStorage.getItem("systemTitle") || "后台管理系统");
const avatarUrl = computed(() => currentUser.value?.get("avatar") || "");
const userDisplayName = computed(
  () => currentUser.value?.get("name") || currentUser.value?.get("username") || "管理员"
);
const systemModal = reactive({ show: false });
const systemOptions = reactive(
  Object.assign(
    {
      theme: "light",
      layout: "TopLayout",
      colorPreset: "ocean",
      primaryColor: "",
      canvasColor: "",
      surfaceColor: "",
      inkColor: "",
      textColor: "",
      mutedColor: "",
      borderColor: "",
      successColor: "",
      warningColor: "",
      dangerColor: "",
      glassEffect: true,
      showLogo: true,
      logoURL: "",
      showTags: true,
      refresh: true,
      fullScreen: true,
    },
    currentUser.value?.get("systemOptions")
  )
);
systemOptions.theme = normalizeAppearance(systemOptions.theme);
systemOptions.colorPreset = getThemePreset(systemOptions.colorPreset).key;
if (!LayoutComponents[systemOptions.layout]) systemOptions.layout = "TopLayout";
const themeColorValues = computed(() => getEffectiveThemeColors(systemOptions));
const modules = computed(() => store.getters["GET_MODULES"]);
const isFullScreen = ref(false);
let saveTimer = null;
let isSavingSystemOptions = false;
let hasQueuedSystemOptionSave = false;
const systemOptionsSaveState = ref("idle");
const isListPage = computed(() => route.meta?.listPage === true);

/**
 * 响应 Element Plus 菜单打开子菜单事件并持久化展开项。
 * @param {string} index 被打开的菜单索引。
 * @returns {void} 更新 openKeys 并写入会话级浏览器存储。
 */
const handleMenuOpen = (index) => {
  if (!openKeys.value.includes(index)) openKeys.value.push(index);
  sessionStorage.setItem("openKeys", JSON.stringify(openKeys.value));
};

/**
 * 响应 Element Plus 菜单关闭子菜单事件并持久化剩余展开项。
 * @param {string} index 被关闭的菜单索引。
 * @returns {void} 更新 openKeys 并写入会话存储。
 */
const handleMenuClose = (index) => {
  openKeys.value = openKeys.value.filter((key) => key !== index);
  sessionStorage.setItem("openKeys", JSON.stringify(openKeys.value));
};

/**
 * 从会话存储恢复菜单状态；存储被手工修改或损坏时安全回退为空状态。
 * @returns {void} 更新当前组件的 openKeys 和 selectedKeys 响应式状态。
 */
const recoverMenuStatus = () => {
  try {
    openKeys.value = JSON.parse(sessionStorage.getItem("openKeys") || "[]") || [];
  } catch {
    openKeys.value = [];
  }
  selectedKeys.value = [sessionStorage.getItem("pageKey") || ""];
};

/**
 * 将系统配置写入当前用户资料，并通过队列避免颜色拖动时并发覆盖较新的设置。
 * @returns {Promise<void>} 保存完成或失败通知已显示后结束；不阻塞当前页面交互，并仅提交 systemOptions 字段。
 */
const persistSystemOptions = async () => {
  if (isSavingSystemOptions) {
    hasQueuedSystemOptionSave = true;
    return;
  }

  const user = currentUser.value;
  if (!user) return;
  isSavingSystemOptions = true;
  systemOptionsSaveState.value = "saving";
  try {
    user.set("systemOptions", Object.assign({}, user.get("systemOptions"), systemOptions));
    await user.save({ fields: ["systemOptions"] });
    systemOptionsSaveState.value = "saved";
  } catch {
    systemOptionsSaveState.value = "error";
    ElNotification.error({
      title: "主题配置保存失败",
      message: "当前页面的主题仍可继续使用，请稍后重试或检查网络连接。",
    });
  } finally {
    isSavingSystemOptions = false;
    if (hasQueuedSystemOptionSave) {
      hasQueuedSystemOptionSave = false;
      void persistSystemOptions();
    }
  }
};

/**
 * 延迟合并连续的主题设置修改，减少色彩选择器输入过程中对 BFF 的重复写入。
 * @returns {void} 在 350 毫秒后触发一次用户配置保存。
 */
const scheduleSystemOptionSave = () => {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void persistSystemOptions();
  }, 350);
};

/**
 * 将上传组件的 Logo 值规范为 URL，并保存通用设置面板中发生的变更。
 * @returns {void} 应用视觉令牌、缓存无敏感主题偏好并调度异步用户资料保存。
 */
const handleSystemOptionChange = () => {
  if (typeof systemOptions.logoURL === "object") {
    systemOptions.logoURL = arrayImgsToString(systemOptions.logoURL, "url");
  }
  setIcon();
  applyVisualTheme(systemOptions);
  persistVisualThemePreference(systemOptions);
  systemOptionsSaveState.value = "dirty";
  scheduleSystemOptionSave();
};

/**
 * 选择一套系统内置主题，并清除当前所有颜色覆写以恢复该预设在当前明暗模式下的完整配色。
 * @param {string} presetKey THEME_PRESETS 中的主题键值。
 * @returns {void} 更新本地响应式配置并调度保存。
 */
const selectThemePreset = (presetKey) => {
  if (!themePresets.some((preset) => preset.key === presetKey)) return;
  systemOptions.colorPreset = presetKey;
  colorFields.forEach((colorField) => {
    systemOptions[colorField.field] = "";
  });
  handleSystemOptionChange();
};

/**
 * 更新当前主题的一项自定义颜色；颜色输入仅提供 #RRGGBB，因此不会向 CSS 写入不可信值。
 * @param {string} field systemOptions 中的颜色字段名。
 * @param {string} value 原生 color 输入返回的十六进制颜色。
 * @returns {void} 更新颜色覆写并调度保存。
 */
const updateThemeColor = (field, value) => {
  if (!colorFields.some((colorField) => colorField.field === field)) return;
  systemOptions[field] = value;
  handleSystemOptionChange();
};

/**
 * 清除所有自定义颜色但保留当前选中的预设和明暗模式。
 * @returns {void} 恢复预设颜色并调度保存。
 */
const resetThemeColors = () => {
  colorFields.forEach((colorField) => {
    systemOptions[colorField.field] = "";
  });
  handleSystemOptionChange();
};

/**
 * 打开主题设置抽屉。
 * @returns {void} 仅改变设置抽屉可见状态。
 */
const openThemeSettings = () => {
  systemModal.show = true;
};

/**
 * 跳转到个人中心，并恢复非顶栏布局下的菜单展开状态。
 * @returns {void} 更新路由、页签历史与菜单状态。
 */
const openPersonalCenter = () => {
  toPage("/personalCenter", "personalCenter", "个人中心");
  recoverMenuStatus();
};

/**
 * 将页签点击事件映射为已有导航方法，维持当前页签的高亮状态。
 * @param {{path: string, pageKey: string, pageName: string}} page 已记录的页签对象。
 * @returns {void} 导航到目标页面并更新 selectedKeys。
 */
const handleTag = (page) => {
  toPage(page.path, page.pageKey, page.pageName);
  selectedKeys.value = [sessionStorage.getItem("pageKey") || ""];
};

/**
 * 刷新当前浏览器页面以重新请求已加载的动态路由和数据。
 * @returns {void} 触发浏览器整页重载。
 */
const pageReload = () => {
  window.location.reload();
};

/**
 * 在浏览器支持时切换原生全屏，并在权限被拒绝或 API 不可用时告知用户。
 * @returns {Promise<void>} 全屏 API 完成或错误通知显示后结束。
 */
const zoomPage = async () => {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      await document.exitFullscreen?.();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      throw new Error("FULLSCREEN_UNSUPPORTED");
    }
  } catch {
    ElNotification.warning({
      title: "无法切换全屏",
      message: "当前浏览器或页面权限不支持全屏操作。",
    });
  }
};

/**
 * 退出当前受保护会话，同时清空仅与本账户相关的路由状态；视觉偏好会保留以避免登录页闪烁。
 * @returns {Promise<void>} 服务端退出请求完成后跳转到登录页。
 */
const loginOut = async () => {
  await Parse.User.logOut();
  store.commit("SET_MODULES", []);
  historyPage.value.splice(0, historyPage.value.length);
  sessionStorage.removeItem("historyPage");
  sessionStorage.removeItem("openKeys");
  sessionStorage.removeItem("pageKey");
  sessionStorage.removeItem("pageName");
  await router.replace("/login");
};

/**
 * 读取浏览器全屏状态，保证图标在用户按 Esc 退出全屏后同步更新。
 * @returns {void} 更新 isFullScreen 响应式状态。
 */
const syncFullscreenState = () => {
  isFullScreen.value = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
};

/**
 * 响应 Parse 兼容适配层发出的上下文更新事件，使顶部用户名称和头像与个人中心保存结果同步。
 * @returns {void} 读取最新的当前用户并替换 currentUser 响应式引用。
 */
const syncCurrentUser = () => {
  currentUser.value = Parse.User.current();
};

/**
 * 按当前用户设置更新浏览器标签页图标；未配置 Logo 时保留应用默认 favicon。
 * @returns {void} 仅修改 document.head 内的 favicon 链接。
 */
const setIcon = () => {
  if (typeof systemOptions.logoURL !== "string" || !systemOptions.logoURL.trim()) return;
  const link = document.querySelector("link[rel*='icon']") || document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "icon";
  link.href = systemOptions.logoURL;
  if (!link.parentNode) document.head.appendChild(link);
};

watch(
  () => systemOptions.layout,
  (layout) => {
    if (layout === "TopLayout") openKeys.value = [];
    else recoverMenuStatus();
  },
  { immediate: true }
);

watch(
  systemOptions,
  (options) => {
    applyVisualTheme(options);
    persistVisualThemePreference(options);
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  setIcon();
  recoverMenuStatus();
  syncFullscreenState();
  document.addEventListener("fullscreenchange", syncFullscreenState);
  window.addEventListener("shumian-auth-context-updated", syncCurrentUser);
});

onUnmounted(() => {
  if (saveTimer || systemOptionsSaveState.value === "dirty") {
    window.clearTimeout(saveTimer);
    saveTimer = null;
    void persistSystemOptions();
  }
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  window.removeEventListener("shumian-auth-context-updated", syncCurrentUser);
});
</script>

<style lang="scss">
@import "@/assets/scss/Layout.scss";

.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  min-width: 88px;
  padding-right: 14px;
}

.header-action-icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  margin-right: 0;
  padding: 0;
  color: var(--app-text);
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  place-items: center;
  transition: color var(--app-transition), background-color var(--app-transition),
    transform var(--app-transition);
}

.header-action-icon:hover {
  color: var(--app-primary);
  background: var(--app-primary-soft);
  transform: translateY(-1px);
}

.header-right {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 8px;
  color: inherit;
  font: inherit;
  border: 0;
  background: transparent;
  cursor: pointer;
  user-select: none;
  border-radius: 10px;
  transition: background-color var(--app-transition);
}

.header-right:hover {
  background: var(--app-primary-soft);
}

.header-avatar {
  display: inline-flex;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 9px;
  place-items: center;
  overflow: hidden;
  color: var(--app-primary);
  object-fit: cover;
  background: var(--app-primary-soft);
  border-radius: 50%;
}

.header-avatar--placeholder {
  font-size: 17px;
}

.header-user-name {
  max-width: 116px;
  overflow: hidden;
  color: var(--app-ink);
  font-size: 13px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-user-chevron {
  margin-left: 9px;
  color: var(--app-muted);
  font-size: 11px;
  transition: transform var(--app-transition);
}

.header-right:hover .header-user-chevron {
  transform: rotate(180deg);
}

.user-popover {
  display: grid;
  min-width: 132px;
  gap: 8px;
}

.tags-view {
  display: flex;
  align-items: center;
  overflow-x: auto;
  transition: var(--app-transition);

  &__tag {
    margin-right: 4px;
    cursor: pointer;
  }
}

.tags-view--top {
  // 与横向布局的品牌区保持同一宽度，使页签起点与首个菜单项对齐。
  margin-left: 228px;
}

.system-settings__select {
  width: 142px;
}

.system-settings .system-settings__wide-item {
  display: block;
}

.theme-preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.theme-preset-card {
  display: flex;
  min-width: 0;
  padding: 10px;
  color: var(--app-text);
  text-align: left;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-glass-surface);
  cursor: pointer;
  transition: border-color var(--app-transition), background-color var(--app-transition),
    transform var(--app-transition), box-shadow var(--app-transition);
}

.theme-preset-card:hover,
.theme-preset-card--selected {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  box-shadow: 0 6px 14px rgba(var(--app-primary-rgb), 0.12);
}

.theme-preset-card:hover {
  transform: translateY(-1px);
}

.theme-preset-card__swatch {
  width: 24px;
  height: 24px;
  margin: 1px 8px 0 0;
  border: 2px solid rgba(255, 255, 255, 0.72);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(20, 38, 74, 0.2);
  flex: 0 0 auto;
}

.theme-preset-card__content {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.theme-preset-card__content strong {
  overflow: hidden;
  color: var(--app-ink);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-preset-card__content small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--app-muted);
  font-size: 11px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.theme-color-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.theme-color-control {
  display: grid;
  min-width: 0;
  gap: 5px;
  color: var(--app-text);
  font-size: 12px;
}

.theme-color-control__input {
  display: flex;
  min-width: 0;
  height: 34px;
  padding: 4px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-xs);
  background: var(--app-glass-strong);
  align-items: center;
}

.theme-color-control input {
  width: 28px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.theme-color-control code {
  min-width: 0;
  margin-left: 5px;
  overflow: hidden;
  color: var(--app-muted);
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-color-reset {
  margin-top: 10px;
}

.system-settings__hint {
  margin: 8px 0 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.65;
}

.system-settings__status {
  margin: 8px 0 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.5;
}

.system-settings__status span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.system-settings__status span::before {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  content: "";
}

.system-settings__status span:first-child {
  color: var(--app-primary);
}

.app-menu {
  overflow-y: auto;
  flex: 1;
}

@media (max-width: 768px) {
  .header-actions {
    padding-right: 4px;
  }

  .header-action-icon {
    margin-right: 0;
  }

  .header-user-name,
  .header-user-chevron {
    display: none !important;
  }

  .tags-view--top {
    margin-left: 0;
  }
}

@media (max-width: 420px) {
  .theme-preset-grid,
  .theme-color-grid {
    grid-template-columns: 1fr;
  }
}
</style>
