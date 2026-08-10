import { createRouter, createWebHashHistory } from "vue-router";
import { loadRoutes, resetDynamicRoutes } from "./dynamicRoute";
import { routes } from "./staticRoute";
import Parse, { clearCurrentAuthContext, getCurrentAuthContext } from "@/service/parse-client";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
let shouldRecheckResolvedRoute = true;
const DYNAMIC_ROUTE_PLACEHOLDER_NAME = "动态路由占位";

/**
 * 判断路由是否被部署环境明确列为免认证页面。配置仅支持分号分隔的路径片段，空值安全回退为不跳过。
 * @param {{path: string}} route Vue Router 即将进入的路由对象。
 * @returns {boolean} 当前路由符合任一免认证片段时返回 true。
 */
const isSkip = (route) => {
  const configuredPaths = process.env.VUE_APP_SKIP_VERIFY_ROUTE || "";
  return configuredPaths
    .split(";")
    .map((path) => path.trim())
    .filter(Boolean)
    .some((path) => route.path.includes(path));
};

/**
 * 移除仅属于已退出账户的导航存储，但保留无身份信息的视觉偏好与其他同源应用数据。
 * @returns {void} 清空页签、菜单展开项和当前业务页标识。
 */
const clearProtectedNavigationState = () => {
  ["historyPage", "openKeys", "pageKey", "pageName"].forEach((key) => sessionStorage.removeItem(key));
};

/**
 * 响应 Axios 会话恢复失败事件，清理受保护导航并回到登录页，避免用户停留在过期页面。
 * @returns {void} 更新路由和会话状态；路由跳转失败由 Vue Router 自身处理。
 */
const handleAuthExpired = () => {
  clearCurrentAuthContext();
  resetDynamicRoutes();
  clearProtectedNavigationState();
  shouldRecheckResolvedRoute = true;
  if (router.currentRoute.value.path !== "/login") void router.replace("/login");
};

if (typeof window !== "undefined") {
  window.addEventListener("shumian-auth-expired", handleAuthExpired);
}

/**
 * 保证首页在新的认证会话中有一个稳定的初始页签，避免直接访问 /home 后出现空标签栏。
 * @returns {void} 缓存首页页签和当前选择项；存在有效首页页签时不覆盖用户已有历史。
 */
const ensureHomeHistory = () => {
  try {
    const savedHistory = JSON.parse(sessionStorage.getItem("historyPage") || "[]");
    if (Array.isArray(savedHistory) && savedHistory.some((page) => page?.pageKey === "home")) return;
  } catch {
    // 存储内容损坏时使用下面的安全默认首页页签。
  }

  sessionStorage.setItem(
    "historyPage",
    JSON.stringify([{ path: "/home", pageKey: "home", pageName: "首页" }])
  );
  sessionStorage.setItem("pageKey", "home");
};

/**
 * 判断当前导航是否仍由静态深链接占位路由承接。
 * @param {import("vue-router").RouteLocationNormalized} route 已解析的目标路由。
 * @returns {boolean} 命中动态路由占位项时返回 true。
 */
const isDynamicRoutePlaceholder = (route) =>
  route.matched.some((record) => record.name === DYNAMIC_ROUTE_PLACEHOLDER_NAME);

/**
 * 对已装配的动态页面和绑定元数据的静态首页执行一次前端权限二次检查，避免手工输入深链接绕过菜单体验层。
 * @param {import("vue-router").RouteLocationNormalized} route 已解析的目标路由。
 * @returns {boolean} 管理员或当前岗位包含该页面 Route objectId 时返回 true；静态基础页由认证守卫保护。
 */
const canEnterManagedRoute = (route) => {
  const context = getCurrentAuthContext();
  if (context?.isAdmin) return true;
  const routeId = route.meta?.id;
  const moduleId = route.meta?.moduleId;
  if (!routeId && !moduleId) return true;
  const roleModules = Array.isArray(context?.role?.module) ? context.role.module : [];
  return roleModules.some((item) => item?.objectId === routeId || item?.objectId === moduleId);
};

/**
 * 认证与动态路由守卫。会话恢复、路由装配或权限元数据异常时均回退到登录页，避免无匹配路由造成白屏。
 * @param {import("vue-router").RouteLocationNormalized} to 即将进入的标准化路由。
 * @returns {Promise<true | import("vue-router").RouteLocationRaw>} 允许导航或返回替代路由。
 */
router.beforeEach(async (to) => {
  if (isSkip(to)) return true;

  if (!Parse.User.current()) await Parse.User.restore();

  if (!Parse.User.current()) {
    shouldRecheckResolvedRoute = true;
    resetDynamicRoutes();
    clearProtectedNavigationState();
    return to.path === "/login" ? true : { path: "/login", replace: true };
  }

  if (to.path === "/login") return { path: "/home", replace: true };

  try {
    await loadRoutes(router);
    if (shouldRecheckResolvedRoute) {
      shouldRecheckResolvedRoute = false;
      return { path: to.fullPath, replace: true };
    }
    if (isDynamicRoutePlaceholder(to)) return { path: "/404", replace: true };
    if (!canEnterManagedRoute(to)) return { path: "/404", replace: true };
    if (to.path === "/home") ensureHomeHistory();
    return true;
  } catch {
    clearCurrentAuthContext();
    resetDynamicRoutes();
    clearProtectedNavigationState();
    shouldRecheckResolvedRoute = true;
    return { path: "/login", replace: true };
  }
});

export default router;
