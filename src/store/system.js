import router from "@/router/index";
import {
  findList
} from "@/apis/company";
import * as schema from "@/apis/schema";
import * as devModule from "@/apis/devModule";
import * as commonAPI from "@/apis/base";
export default {
  state: {
    modules: [],
    company: [],
    schema: [],
    fields: {},
    tables: {},
    currentCompany: "",
    antdComponents: [],
    identity: [],
    users: []
  },
  getters: {
    GETUSERS: state => {
      return state.users;
    },

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

    GETIDENTITY: (state) => {
      return state.identity;
    },
  },

  mutations: {

    SETUSERS(state, value) {
      state.users = value;
    },

    SETANTDCOMPONENTS(state, value) {
      state.antdComponents = value;
    },

    SETMODULES(state, value) {
      sessionStorage.setItem("MODULES", JSON.stringify(value));
      state.modules = value.map((module) => {
        module.router = module.router.map((route) => {
          try {
            require("@/views" + route.pagePath);
            route["component"] = () => import("@/views" + route.pagePath);
          } catch (error) {
            route["component"] = () => import("@/components" + route.pagePath);
          }
          route["meta"] = Object.assign({}, {
              companyId: module?.meta?.companyId
            },
            route.option, {
              switchs: route.switchs
            }
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

    SETIDENTITY(state, value) {
      state.identity = value;
    },
  },

  actions: {

    SETUSERS(ctx) {
      commonAPI.findList({
        className: "_User",
        name: "",
      }).then(result => {
        if (result.code == 200) {
          let users = []
          const res = new Map()
          const {
            userid: objectId,
            username: name
          } = JSON.parse(sessionStorage.getItem('userInfo'))
          users = result.data.map(item => {
            item.name = item.username
            return item
          })
          users.push({
            objectId,
            name
          })
          ctx.commit("SETUSERS", users.filter(u => {
            return !res.has(u.objectId) && res.set(u.objectId, 1) && !res.has(u.name) && res.set(u.name, 1)
          }));
        }
      })
    },

    SETCOMPANY(ctx) {
      findList({
        isDelete: false
      }).then((result) => {
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

    SETIDENTITY(ctx) {
      commonAPI
        .findList({
          className: "Identity",

          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETIDENTITY", result.data);
          }
        });
    },
  },
  modules: {},
};
