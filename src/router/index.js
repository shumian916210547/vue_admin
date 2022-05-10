import { createRouter, createWebHistory } from "vue-router";
import dashboard from "@/views/dashboard/index.vue";
import moduleManage from "@/views/moduleManage/index.vue";
import routeManage from "@/views/routeManage/index.vue";
const routes = [
  {
    path: "/",
    component: () => import("@/views/index.vue"),
    children: [
      {
        path: "dbdashboard",
        component: dashboard,
      },
      {
        path: "moduleManage",
        component: moduleManage,
      },
      {
        path: "routeManage",
        component: routeManage,
      },
      {
        path: "/",
        redirect: "dbdashboard",
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
