import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import Home from "@/views/home/index.vue"
import Login from "@/views/login/index.vue"
import store from "@/store/index";
const routes = [{
    path: "/login",
    name: "login",
    component: Login,
  },
  {
    path: "/",
    name: "index",
    component: () => import("@/views/index.vue"),
    children: [{
        path: "/home",
        name: "home",
        component: Home,
      },
      {
        path: "/",
        redirect: "/home",
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

let oneEnter = true;

router.beforeEach(async (to, from, next) => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    if (to.path === "/login") {
      next();
    } else {
      next({
        path: "/login"
      });
    }
  } else {
    if (oneEnter) {
      oneEnter = false;
      next({
        ...to,
        replace: true
      });
    }
    if (to.path != "/home" && to.path != "/") {
      store.commit("SETCURRENTCOMPANY", to?.meta?.companyId);
    }
  }
  next();
});

export default router;
