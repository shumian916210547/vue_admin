import { createRouter, createWebHistory } from 'vue-router'
import { loadRoutes } from './dynamicRoute'
import { routes } from './staticRoute'
import Parse from 'parse'
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})
let oneEnter = true;
router.beforeEach(async (to, from, next) => {
  if (!Parse.User.current()) {
    if (to.path === "/login") {
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
    } else {
      next()
    }
  }
});

export default router
