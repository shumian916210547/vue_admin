import { createStore } from "vuex";
import router from "@/router/index";
import { findList } from "@/apis/company";
import * as schema from "@/apis/schema";
import * as devModule from "@/apis/devModule";
import * as commonAPI from "@/apis/base";
export default createStore({
  state: {
    modules: [],
    company: [],
    schema: [],
    fields: {},
    tables: {},
    currentCompany: "",
    antdComponents: [],
    schools: [],
    departments: [],
    class: [],
  },
  getters: {
    GETANTDCOMPONENTS: (state) => {
      return state.antdComponents;
    },

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

    GETSCHOOLS: (state) => {
      return state.schools;
    },

    GETDEPARTMENTS: (state) => {
      return state.departments;
    },

    GETCLASS: (state) => {
      return state.class;
    },
  },
  mutations: {
    SETANTDCOMPONENTS(state, value) {
      state.antdComponents = value;
    },

    SETMODULES(state, value) {
      state.modules = value.map((module) => {
        module.router = module.router.map((route) => {
          try {
            require("@/views" + route.pagePath);
            route["component"] = () => import("@/views" + route.pagePath);
          } catch (error) {
            route["component"] = () => import("@/components" + route.pagePath);
          }
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
        let value, label;
        value = label = s.name;
        return {
          label,
          value,
        };
      });
    },

    SETFIELDS(state, value) {
      state.fields = value;
    },

    SETTABLES(state, value) {
      state.tables = value;
    },

    SETSCHOOLS(state, value) {
      state.schools = value;
    },

    SETDEPARTMENTS(state, value) {
      state.departments = value;
    },

    SETCLASS(state, value) {
      state.class = value;
    },
  },
  actions: {
    SETMODULES(ctx) {
      devModule.findList().then((result) => {
        if (result.code == 200) {
          ctx.commit("SETMODULES", result.data);
          sessionStorage.setItem("MODULES", JSON.stringify(result.data));
        }
      });
    },

    SETCOMPANY(ctx) {
      findList().then((result) => {
        if (result.code == 200) {
          ctx.commit("SETCOMPANY", result.data);
        }
      });
    },

    SETSCHEMA(ctx) {
      schema.findList().then((result) => {
        if (result.code == 200) {
          ctx.commit("SETSCHEMA", result.data);
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
          ctx.commit("SETTABLES", tables);
        }
      });
    },

    SETSCHOOLS(ctx) {
      commonAPI
        .findList({ className: "School", companyId: "RIZjCRsWcZ", name: "" })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETSCHOOLS", result.data);
          }
        });
    },

    SETDEPARTMENTS(ctx) {
      commonAPI
        .findList({
          className: "Department",
          companyId: "RIZjCRsWcZ",
          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETDEPARTMENTS", result.data);
          }
        });
    },

    SETCLASS(ctx) {
      commonAPI
        .findList({
          className: "Class",
          companyId: "RIZjCRsWcZ",
          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETCLASS", result.data);
          }
        });
    },

    UpdateStore(ctx) {
      ctx.dispatch("SETCOMPANY");
      ctx.dispatch("SETSCHEMA");
      ctx.dispatch("SETMODULES");
      ctx.dispatch("SETSCHOOLS");
      ctx.dispatch("SETDEPARTMENTS");
      ctx.dispatch("SETCLASS");
    },
  },
  modules: {},
});
