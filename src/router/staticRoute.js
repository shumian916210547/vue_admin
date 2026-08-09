import Layout from "@/components/Layout";

/**
 * 所有已认证用户均可访问的固定工作页。它们不依赖 Module 元数据，因此首次部署、
 * 菜单元数据尚未初始化或动态路由加载失败时，仍能提供可用的首页和账户入口。
 * @type {Array<Record<string, unknown>>}
 */
export const chil_routes = [
  {
    path: "home",
    name: "首页",
    objectId: "home",
    component: () => import("@/views/home"),
    meta: {
      icon: "HomeOutlined",
      menu: true,
    },
    menu: true,
  },
  {
    path: "personalCenter",
    name: "个人中心",
    objectId: "personalCenter",
    component: () => import("@/views/personalCenter"),
    meta: {
      icon: "UserOutlined",
      menu: false,
    },
    menu: false,
  },
];

/**
 * 布局内的系统辅助页。404 不加入业务菜单或页签；动态路由占位项用于在
 * 登录守卫装配 Module 前保留深链接，避免过早重定向导致有效业务页变成 404。
 * @type {Array<Record<string, unknown>>}
 */
const layoutSystemRoutes = [
  {
    path: "404",
    name: "页面不存在",
    component: () => import("@/views/404"),
    menu: false,
  },
  {
    path: ":pathMatch(.*)*",
    name: "动态路由占位",
    component: () => import("@/components/PageLoading"),
    menu: false,
  },
];

export const routes = [
  {
    path: "/",
    name: "Layout",
    component: Layout,
    redirect: "/home",
    children: [...chil_routes, ...layoutSystemRoutes],
  },
  {
    path: "/login",
    name: "登录",
    component: () => import("@/views/login"),
  },
];
