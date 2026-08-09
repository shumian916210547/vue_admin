import { findAll } from "@/service/base.service";
import store from "@/store";
import { chil_routes } from "./staticRoute";
import { getCurrentAuthContext } from "@/service/parse-client";
import { ensureSystemConfiguration } from "@/service/system-configuration.service";

const STATIC_ROUTE_PATHS = new Set(chil_routes.map((route) => route.path));
const ROUTE_PATH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_/-]*$/;
const COMPONENT_PATH_PATTERN = /^\/[A-Za-z0-9_./-]+$/;
const REQUIRED_SYSTEM_ROUTE_PATHS = new Set(["module", "table", "organization", "member", "position"]);
/** 旧版将组织与成员配置合并在同一入口时使用的菜单名称，发现后触发一次幂等迁移。 */
const LEGACY_ORGANIZATION_MEMBER_ROUTE_NAME = "组织与成员";
let routes = [...chil_routes];
let activeRouteRemovers = [];
let loadingRoutesPromise = null;
let routeLoadVersion = 0;

/**
 * 判断数据库中的路由 path 是否可安全作为 Vue Router 的相对路径。
 * @param {unknown} value Module 或 Route 元数据中的 path 值。
 * @returns {boolean} 仅当值为不包含 “..” 的相对路径时返回 true。
 */
const isSafeRoutePath = (value) =>
  typeof value === "string" &&
  ROUTE_PATH_PATTERN.test(value) &&
  !value.includes("..") &&
  !value.startsWith("/");

/**
 * 判断页面组件路径是否可用于受限的 views/components 动态导入。
 * @param {unknown} value Module 或 Route 元数据中的 pageComponent 值。
 * @returns {boolean} 仅当值为以 / 开头且不含目录回退的组件路径时返回 true。
 */
const isSafeComponentPath = (value) =>
  typeof value === "string" &&
  COMPONENT_PATH_PATTERN.test(value) &&
  !value.includes("..") &&
  value.startsWith("/");

/**
 * 将排序字段转换为稳定的数值，避免缺失 rank 时产生不确定的菜单顺序。
 * @param {Record<string, unknown>} item Module 或 Route 元数据对象。
 * @returns {number} 可用于升序排序的 rank；缺失或无效值排在末尾。
 */
const getRank = (item) => {
  const rank = Number(item?.rank);
  return Number.isFinite(rank) ? rank : Number.MAX_SAFE_INTEGER;
};

/**
 * 判断当前管理员所属企业是否缺少基础系统配置。仅在 Module 或关键 Route 缺失时触发后端幂等修复，
 * 不覆盖已配置的自定义业务模块。
 * @param {Array<Record<string, unknown>>} moduleRecords BFF 返回的当前企业 Module 记录。
 * @param {{isAdmin?: boolean} | null} authContext 当前可信认证上下文。
 * @returns {boolean} 系统管理员且缺少任一基础配置路由，或仍使用旧的组织成员合并入口名称时返回 true。
 */
const needsSystemConfigurationRepair = (moduleRecords, authContext) => {
  if (!authContext?.isAdmin) return false;
  const systemModule = moduleRecords.find((module) => module?.path === "system");
  if (!systemModule || !Array.isArray(systemModule.routes)) return true;
  const currentPaths = new Set(systemModule.routes.map((route) => route?.path));
  const organizationRoute = systemModule.routes.find((route) => route?.path === "organization");
  return (
    [...REQUIRED_SYSTEM_ROUTE_PATHS].some((path) => !currentPaths.has(path)) ||
    organizationRoute?.name === LEGACY_ORGANIZATION_MEMBER_ROUTE_NAME
  );
};

/**
 * 解析动态路由对应的页面组件。仅允许受限路径，未知或失效配置回退到 404 页面，避免无限加载或白屏。
 * @param {unknown} pageComponent Module 或 Route 元数据中的页面组件路径。
 * @returns {Function} Vue 异步组件工厂或 404 异步组件工厂。
 */
const resolvePageComponent = (pageComponent) => {
  const fallback = () => import("@/views/404");
  if (!isSafeComponentPath(pageComponent)) return fallback;

  try {
    require("@/views" + pageComponent);
    return () => import("@/views" + pageComponent);
  } catch {
    try {
      require("@/components" + pageComponent);
      return () => import("@/components" + pageComponent);
    } catch {
      return fallback;
    }
  }
};

/**
 * 按当前可信会话过滤并规范化一组 Module 记录；不会修改从 BFF 返回的原始对象。
 * @param {Array<Record<string, unknown>>} moduleRecords BFF 返回的 Module 元数据数组。
 * @param {{role?: {module?: Array<{objectId?: string}>}, isAdmin?: boolean} | null} authContext 当前认证上下文。
 * @returns {Array<Record<string, unknown>>} 已授权、路径合法且已配置 Vue 组件的一级路由记录。
 */
const buildAuthorizedModules = (moduleRecords, authContext) => {
  const roleModules = Array.isArray(authContext?.role?.module) ? authContext.role.module : [];
  const allowedRouteIds = new Set(roleModules.map((item) => item?.objectId).filter(Boolean));
  const isAdmin = Boolean(authContext?.isAdmin);
  const canAccess = (record) => isAdmin || allowedRouteIds.has(record?.objectId);

  return moduleRecords
    .filter((module) => isSafeRoutePath(module?.path) && !STATIC_ROUTE_PATHS.has(module.path))
    .map((module) => {
      const authorizedChildren = Array.isArray(module.routes)
        ? module.routes
            .filter((route) => canAccess(route) && isSafeRoutePath(route?.path))
            .sort((left, right) => getRank(left) - getRank(right))
            .map((route) => ({
              ...route,
              component: resolvePageComponent(route.pageComponent),
              meta: {
                targetClass: route.targetClass,
                id: route.objectId,
                menu: route.menu,
              },
            }))
        : [];

      return {
        ...module,
        // Module 仅作为菜单分组时通常没有 pageComponent。此时必须使用含
        // router-view 的容器承载已授权的子路由，不能降级为 404，否则深链接
        // 虽然匹配成功却没有位置渲染子页面。
        component:
          authorizedChildren.length && !isSafeComponentPath(module.pageComponent)
            ? () => import("@/components/PageLoading")
            : resolvePageComponent(module.pageComponent),
        children: authorizedChildren.length ? authorizedChildren : undefined,
        meta: {
          targetClass: module.targetClass,
          id: module.objectId,
          icon: module.icon,
          menu: module.menu,
        },
      };
    })
    .filter((module) => canAccess(module) || module.children?.length)
    .sort((left, right) => getRank(left) - getRank(right));
};

/**
 * 向 Layout 父路由注册一项动态路由，并保存路由器提供的移除函数用于退出会话时回收。
 * @param {import("vue-router").Router} router 已初始化的 Vue Router 实例。
 * @param {Record<string, unknown>} route 已规范化的动态 Module 路由记录。
 * @returns {void} 路由完成注册后保存其移除函数。
 */
const addManagedRoute = (router, route) => {
  const removeRoute = router.addRoute("Layout", route);
  if (typeof removeRoute === "function") activeRouteRemovers.push(removeRoute);
};

/**
 * 清除当前会话动态装配的路由与菜单缓存，防止租户或账户切换后保留旧权限页面。
 * @returns {void} 移除已注册动态路由，重置 Vuex 菜单与进行中的加载版本。
 */
export const resetDynamicRoutes = () => {
  routeLoadVersion += 1;
  loadingRoutesPromise = null;
  activeRouteRemovers.splice(0).reverse().forEach((removeRoute) => {
    try {
      removeRoute();
    } catch {
      // 路由已经被 Vue Router 移除时可安全忽略，避免退出流程被中断。
    }
  });
  routes = [...chil_routes];
  store.commit("SET_MODULES", []);
};

/**
 * 登录后按照 BFF 提供的角色和管理员身份动态装配前端菜单路由。
 * @param {import("vue-router").Router} router 已初始化的 Vue Router 实例，用于向 Layout 注册已授权页面。
 * @returns {Promise<Array<Record<string, unknown>>>} 当前会话允许访问的静态与动态路由列表。
 * @throws {Error} 路由器实例无效或 BFF 元数据请求失败时向路由守卫抛出，以便安全回退到登录页。
 */
export const loadRoutes = async (router) => {
  if (!router || typeof router.addRoute !== "function") {
    throw new Error("ROUTER_UNAVAILABLE");
  }

  if (store.getters["GET_MODULES"].length) {
    routes = [...chil_routes, ...store.getters["GET_MODULES"].filter((route) => !STATIC_ROUTE_PATHS.has(route.path))];
    return routes;
  }

  if (loadingRoutesPromise) return loadingRoutesPromise;

  const loadVersion = routeLoadVersion;
  const pendingLoad = (async () => {
    let moduleRecords = (await findAll("Module", {})) || [];
    if (loadVersion !== routeLoadVersion) return routes;

    if (needsSystemConfigurationRepair(moduleRecords, getCurrentAuthContext())) {
      try {
        await ensureSystemConfiguration();
        moduleRecords = (await findAll("Module", {})) || [];
      } catch {
        // 前后端滚动发布期间旧 BFF 可能暂未提供修复接口；保留已有路由，避免管理员被强制退出。
      }
    }
    if (loadVersion !== routeLoadVersion) return routes;

    const modules = buildAuthorizedModules(moduleRecords, getCurrentAuthContext());
    modules.forEach((module) => addManagedRoute(router, module));
    if (loadVersion !== routeLoadVersion) {
      resetDynamicRoutes();
      return routes;
    }

    routes = [...chil_routes, ...modules];
    store.commit("SET_MODULES", routes);
    return routes;
  })();

  loadingRoutesPromise = pendingLoad;
  try {
    return await pendingLoad;
  } finally {
    if (loadingRoutesPromise === pendingLoad) loadingRoutesPromise = null;
  }
};

