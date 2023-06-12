import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";

import { permission } from "./directives";

createApp(App).use(store).use(router).directive('permission', permission).use(Antd).mount("#app");
