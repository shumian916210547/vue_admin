const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: "./", // 主要是这行代码，配置打包后的资源路径
  productionSourceMap: false,
  transpileDependencies: true,
  devServer: {
    proxy: {
      "/api": {
        target: process.env.VUE_APP_API_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
      },
    },
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (error?.message === "ResizeObserver loop completed with undelivered notifications.") {
            console.error(error)
            return false;
          }
          return true;
        },
      },
    },
  },
})
