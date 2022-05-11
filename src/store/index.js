import { createStore } from "vuex";
import router from "@/router/index";
export default createStore({
  state: {
    modules: [],
  },
  getters: {
    GETMODULES: (state) => {
      return state.modules;
    },
  },
  mutations: {
    SETMODULES(state, value) {
      state.modules = value.map((module) => {
        module.router = module.router.map((route) => {
          route["component"] = () => import("@/views" + route.pagePath);
          router.addRoute("index", route);
          return route;
        });
        return module;
      });
    },
  },
  actions: {},
  modules: {},
});
