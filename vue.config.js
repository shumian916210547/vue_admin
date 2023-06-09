const {
  defineConfig
} = require("@vue/cli-service");
const URL = process.env.VUE_APP_BASE_URL;
const API = process.env.VUE_APP_BASE_API;
module.exports = defineConfig({
  publicPath: "./", // 主要是这行代码，配置打包后的资源路径
  productionSourceMap: false,
  transpileDependencies: true,
  devServer: {
    hot: true,
    liveReload: true,
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
