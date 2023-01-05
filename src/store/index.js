import { createStore } from "vuex";
import school from "./school";
import system from "./system";
export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {
    UpdateStore(ctx) {
      ctx.dispatch("SETCOMPANY");
      ctx.dispatch("SETIDENTITY");
      ctx.dispatch("SETSCHEMA");
    },
  },
  modules: { school, system },
});
