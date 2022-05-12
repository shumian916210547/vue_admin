import { createStore } from "vuex";
import router from "@/router/index";
import { findList } from "@/apis/company";
export default createStore({
  state: {
    modules: [],
    company: [],
    currentCompany: "",
  },
  getters: {
    GETMODULES: (state) => {
      return state.modules;
    },

    GETCOMPANY: (state) => {
      return state.company;
    },

    GETCURRENTCOMPANY: (state) => {
      return state.currentCompany;
    },
  },
  mutations: {
    SETMODULES(state, value) {
      state.modules = value.map((module) => {
        module.router = module.router.map((route) => {
          route["component"] = () => import("@/views" + route.pagePath);
          route["meta"] = { companyId: module?.meta?.companyId };
          router.addRoute("index", route);
          return route;
        });
        return module;
      });
    },

    SETCOMPANY(state, value) {
      state.company = value.map((c) => {
        return {
          value: c.objectId,
          label: c.name,
        };
      });
    },

    SETCURRENTCOMPANY(state, value) {
      state.currentCompany = value;
    },
  },
  actions: {
    SETCOMPANY(ctx) {
      findList().then((result) => {
        if (result.code == 200) {
          ctx.commit("SETCOMPANY", result.data);
          sessionStorage.setItem("company", JSON.stringify(result.data));
        }
      });
    },
  },
  modules: {},
});
