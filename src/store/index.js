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
      ctx.dispatch("SETSCHEMA");
      ctx.dispatch("SETMODULES");
      ctx.dispatch("SETSCHOOLS");
      ctx.dispatch("SETDEPARTMENTS");
      ctx.dispatch("SETCLASS");
      ctx.dispatch("SETMAJORS");
      ctx.dispatch("SETCOURSE");
      ctx.dispatch("SETTEACHER");
    },
  },
  modules: { school, system },
});
