import { createStore } from "vuex";
import router from "@/router/index";
import { findList } from "@/apis/company";
import * as schema from "@/apis/schema";
export default createStore({
  state: {
    modules: [],
    company: [],
    schema: [],
    fields: [],
    tables: {},
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

    GETSCHEMA: (state) => {
      return state.schema;
    },

    GETFIELDS: (state) => {
      return state.fields;
    },

    GETTABLES: (state) => {
      return state.tables;
    },
  },
  mutations: {
    SETMODULES(state, value) {
      state.modules = value.map((module) => {
        module.router = module.router.map((route) => {
          route["component"] = () => import("@/views" + route.pagePath);
          route["meta"] = Object.assign(
            {},
            { companyId: module?.meta?.companyId },
            route.option
          );
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

    SETSCHEMA(state, value) {
      state.schema = value.map((s) => {
        return {
          label: s.name,
          value: s.name,
        };
      });
    },

    SETFIELDS(state, value) {
      state.fields = value;
    },

    SETTABLES(state, value) {
      state.tables = value;
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

    SETSCHEMA(ctx) {
      schema.findList().then((result) => {
        if (result.code == 200) {
          let fields = {};
          let tables = {};
          result.data.forEach((s) => {
            tables[s.name] = s.fields;
            fields[s.name] = Object.keys(s.fields).map((key) => {
              return {
                label: key,
                value: key,
              };
            });
          });
          ctx.commit("SETFIELDS", fields);
          ctx.commit("SETSCHEMA", result.data);
          ctx.commit("SETTABLES", tables);
          sessionStorage.setItem("schema", JSON.stringify(result.data));
          sessionStorage.setItem("fields", JSON.stringify(fields));
          sessionStorage.setItem("tables", JSON.stringify(tables));
        }
      });
    },
  },
  modules: {},
});
