const { defineConfig } = require("@vue/cli-service");
const URL = process.env.VUE_APP_BASE_URL;
const API = process.env.VUE_APP_BASE_API;
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    hot: true,
    liveReload: true,
    host: "localhost",
    port: 4200,
    open: false,
    proxy: {
      "/admin": {
        target: API,
        pathRewrite: {
          ["^" + URL]: "/admin",
        },
      },
      "/cmn": {
        target: API,
        pathRewrite: {
          ["^" + "/cmn"]: "/cmn",
        },
      },
    },
  },
});
