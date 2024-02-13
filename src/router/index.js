import { createRouter, createWebHashHistory } from 'vue-router'
import { loadRoutes } from './dynamicRoute'
import { routes } from './staticRoute'
import Parse from 'parse'
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
let oneEnter = true;

//是否跳过验证此路由
const isSkip = (arg) => {
  let t = false
  process.env.VUE_APP_SKIP_VERIFY_ROUTE.split(";").forEach(key => {
    if (arg.path.includes(key)) { t = true; }
  })
  return t
}


router.beforeEach(async (to, from, next) => {
  if (isSkip(to)) { next() } else {
    if (!Parse.User.current()) {
      if (to.path === "/login") {
        sessionStorage.clear()
        localStorage.clear()
        next();
      } else {
        next({
          path: "/login"
        });
      }
    } else {
      await loadRoutes()
      if (oneEnter) {
        oneEnter = false;
        next({
          ...to,
          replace: true
        });
      } else if (to.path == '/') {
        next({
          path: "/home"
        });
        sessionStorage.setItem('historyPage', JSON.stringify([{ path: "/home", pageKey: "tuFQjORBab", pageName: "首页" }]))
        sessionStorage.setItem('pageKey', "tuFQjORBab")
      } else { next() }
    }
  }
});

export default router
