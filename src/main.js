import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Antd from "ant-design-vue";
import "./registerServiceWorker";
import "ant-design-vue/dist/antd.css";

import Parse from "parse";

Parse.initialize(
  process.env.VUE_APP_PARSE_SERVER_APPLICATION_ID,
  "shumian100329",
  process.env.VUE_APP_PARSE_SERVER_MASTER_KEY
);
Parse.serverURL = process.env.VUE_APP_PARSE_SERVER_HOST + "/parse";
Parse.masterKey = process.env.VUE_APP_PARSE_SERVER_MASTER_KEY;

const hasPermission = (value, arr) => {
  return arr.includes(value);
};

const app = createApp(App).use(store).use(router).use(Antd);
app.directive("permission", {
  mounted(el, binding) {
    const { value } = binding;
    if (value && !hasPermission(value[0], value[1])) {
      el.style.display = "none";
    }
  },
});

app.config.errorHandler = (err, vm, info) => {
  // 在这里处理错误
  console.error("Error:", err);
  console.error("Component:", vm);
  console.error("Additional Info:", info);
};

app.mount("#app");
