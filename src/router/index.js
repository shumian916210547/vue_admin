import { createRouter, createWebHashHistory } from 'vue-router'
import { loadRoutes } from './dynamicRoute'
import { routes } from './staticRoute'
import Parse from 'parse'
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
let oneEnter = true;
router.beforeEach(async (to, from, next) => {
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
    } else { next() }
  }
});

export default router
