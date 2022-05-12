import { createRouter, createWebHistory } from "vue-router";
import store from "@/store/index";
const routes = [
  {
    path: "/",
    name: "index",
    component: () => import("@/views/index.vue"),
    children: [
      {
        path: "/home",
        name: "home",
        component: () => import("@/views/home/index.vue"),
      },
      {
        path: "/",
        redirect: "/home",
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

let oneEnter = true;
router.beforeEach(async (to, from, next) => {
  if (oneEnter) {
    oneEnter = false;
    next({ ...to, replace: true });
  }

  if (to.path != "/home" && to.path != "/") {
    store.commit("SETCURRENTCOMPANY", to.meta.companyId);
  }
  next();
});

export default router;
