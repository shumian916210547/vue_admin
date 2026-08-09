import axios from "axios";

const CSRF_STORAGE_KEY = "shumian_admin_csrf";
const AUTH_CONTEXT_RECOVERED_EVENT = "shumian-auth-context-recovered";
const AUTH_EXPIRED_EVENT = "shumian-auth-expired";
const runtimeConfig = window.__SHUMIAN_CONFIG__ || {};

const api = axios.create({
  baseURL: runtimeConfig.apiBase || process.env.VUE_APP_API_BASE || "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const isUnsafeMethod = (method = "get") => !["get", "head", "options"].includes(method.toLowerCase());

/**
 * 判断请求是否属于认证恢复的排除路径，避免登录、恢复本身触发无限递归。
 * @param {string | undefined} url Axios 请求 URL，可能包含 API 前缀或查询参数。
 * @returns {boolean} 当前请求不应被 401 会话恢复逻辑再次处理时返回 true。
 */
const isAuthRecoveryExcluded = (url = "") =>
  ["/auth/login", "/auth/session", "/auth/logout"].some((path) => url.includes(path));

/**
 * 向 Parse 兼容适配层广播服务端返回的最新认证上下文，保持用户资料与会话 Cookie 同步。
 * @param {Record<string, unknown>} context BFF `/auth/session` 返回的脱敏认证上下文。
 * @returns {void} 在浏览器环境派发一次自定义事件，不把 Token 暴露给页面脚本。
 */
const dispatchRecoveredAuthContext = (context) => {
  if (typeof window === "undefined" || !context) return;
  window.dispatchEvent(new CustomEvent(AUTH_CONTEXT_RECOVERED_EVENT, { detail: context }));
};

/**
 * 通知路由层会话恢复失败，触发清理上下文和跳转登录页的统一降级流程。
 * @returns {void} 仅派发浏览器事件并清除 CSRF 缓存，不直接操作 Vue Router。
 */
const dispatchAuthExpired = () => {
  clearCsrfToken();
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};

/**
 * 将 Axios 错误转换为应用统一错误对象，保留业务错误码和 HTTP 状态。
 * @param {unknown} error Axios 或恢复流程抛出的原始错误。
 * @returns {Error} 含 code、status 和 normalized 标记的统一错误对象。
 */
const normalizeApiError = (error) => {
  if (error?.normalized) return error;
  const payload = error?.response?.data?.error;
  const normalized = new Error(payload?.message || error?.message || "Request failed");
  normalized.code = payload?.code;
  normalized.status = error?.response?.status;
  normalized.normalized = true;
  return normalized;
};

let sessionRecoveryPromise = null;

/**
 * 以单飞方式恢复仍然有效的 Cookie 会话，避免多个并发 401 同时请求恢复接口。
 * @returns {Promise<unknown>} `/auth/session` 的 Axios 响应；失败时由调用方清理上下文。
 */
const recoverSession = () => {
  if (!sessionRecoveryPromise) {
    sessionRecoveryPromise = api
      .request({ method: "get", url: "/auth/session", skipAuthRecovery: true })
      .then((response) => {
        dispatchRecoveredAuthContext(response.data?.data);
        return response;
      })
      .finally(() => {
        sessionRecoveryPromise = null;
      });
  }
  return sessionRecoveryPromise;
};

api.interceptors.request.use((request) => {
  if (isUnsafeMethod(request.method)) {
    const csrfToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (csrfToken) request.headers["X-CSRF-Token"] = csrfToken;
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestConfig = error?.config;
    const shouldRecover =
      error?.response?.status === 401 &&
      requestConfig &&
      !requestConfig._authRetry &&
      !requestConfig.skipAuthRecovery &&
      !isAuthRecoveryExcluded(requestConfig.url);

    if (shouldRecover) {
      requestConfig._authRetry = true;
      return recoverSession()
        .then(() => api.request(requestConfig))
        .catch((recoveryError) => {
          dispatchAuthExpired();
          return Promise.reject(normalizeApiError(recoveryError));
        });
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export const setCsrfToken = (token) => {
  if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token);
};

export const clearCsrfToken = () => sessionStorage.removeItem(CSRF_STORAGE_KEY);

export const getCsrfToken = () => sessionStorage.getItem(CSRF_STORAGE_KEY);

export const request = async (options) => {
  const response = await api.request(options);
  return response.data?.data;
};

export default api;
