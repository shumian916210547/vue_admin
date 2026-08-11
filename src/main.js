import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementPlus, { ElNotification } from "element-plus";
import "./registerServiceWorker";
import "element-plus/dist/index.css";
import "./assets/scss/global.scss";

import Parse, { getCurrentAuthContext } from "@/service/parse-client";
import { restoreVisualThemePreference } from "@/utils/theme";

// Parse is now an API adapter. Credentials and Parse Server access remain on
// the backend and are never embedded in the browser bundle.
Parse.initialize();
restoreVisualThemePreference();

/**
 * 判断当前权限集合是否包含指定权限标识，仅用于按钮和页面的体验优化。
 * @param {string} value 需要检查的权限标识，例如 permission:edit。
 * @param {string[]} arr 当前页面已加载的权限标识数组。
 * @returns {boolean} 指定权限存在时返回 true；服务端仍会执行最终授权校验。
 */
const hasPermission = (value, arr) => {
  if (getCurrentAuthContext()?.isAdmin) return true;
  return Array.isArray(arr) && arr.includes(value);
};

/**
 * 解析 v-auth/v-permission 的绑定值，兼容“权限代码 + 当前页面权限数组”的旧调用格式。
 * @param {unknown} value 指令绑定值，可以是字符串或 [code, permissions] 数组。
 * @returns {{code: string, permissions: string[]}} 规范化后的按钮权限输入。
 */
const normalizeDirectiveValue = (value) => {
  if (Array.isArray(value)) return { code: value[0], permissions: value[1] };
  if (typeof value === "string") return { code: value, permissions: [] };
  return { code: "", permissions: [] };
};

/**
 * 根据当前认证上下文更新按钮可见性；服务端仍是最终授权边界，指令只改善前端体验。
 * @param {HTMLElement} el 需要隐藏或恢复的 DOM 元素。
 * @param {unknown} value 指令绑定值，支持字符串或权限数组。
 * @returns {void} 更新元素 display 样式，不发起请求或改变服务端权限。
 */
const updateAuthVisibility = (el, value) => {
  const { code, permissions } = normalizeDirectiveValue(value);
  if (!el.dataset.authOriginalDisplay) el.dataset.authOriginalDisplay = el.style.display || "";
  el.style.display = hasPermission(code, permissions) ? el.dataset.authOriginalDisplay : "none";
};

const app = createApp(App)
  .use(store)
  .use(router)
  .use(ElementPlus, { size: "small" });

/**
 * 提示用户已有可用的新前端版本；不会自动刷新，以免中断当前正在编辑的业务数据。
 * @returns {void} 显示一次可操作的版本更新通知。
 */
const notifyServiceWorkerUpdate = () => {
  ElNotification.info({
    title: "发现新版本",
    message: "系统已在后台下载最新版本，完成当前操作后刷新页面即可使用。",
    duration: 0,
  });
};

window.addEventListener("shumian-service-worker-updated", notifyServiceWorkerUpdate);
const permissionDirective = {
  mounted(el, binding) {
    updateAuthVisibility(el, binding.value);
  },
  updated(el, binding) {
    updateAuthVisibility(el, binding.value);
  },
};

app.directive("permission", permissionDirective);
app.directive("auth", permissionDirective);

/**
 * 统一处理未被组件捕获的前端异常，向用户提供可操作的反馈而不泄露内部错误细节。
 * @param {unknown} err Vue 捕获的运行时错误对象。
 * @param {object | null} vm 发生异常的组件实例，当前仅由 Vue 传入且不会写入浏览器日志。
 * @param {string} info Vue 提供的错误阶段说明，当前仅用于保留函数签名兼容性。
 * @returns {void} 显示一次统一的错误通知，不抛出新的异常。
 */
app.config.errorHandler = (err, vm, info) => {
  void err;
  void vm;
  void info;
  ElNotification.error({
    title: "页面运行异常",
    message: "请刷新页面后重试；若问题持续出现，请联系系统管理员。",
  });
};

app.mount("#app");
