const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  // 使用根路径生成静态资源 URL，避免深层前端路由刷新时相对路径指向错误目录。
  publicPath: "/",
  productionSourceMap: false,
  transpileDependencies: true,
  devServer: {
    // 监听所有网络接口，使同一局域网内的设备可以访问开发服务器。
    host: "0.0.0.0",
    // 将未匹配的页面请求回退到 index.html，由 Vue Router 解析前端路由。
    historyApiFallback: {
      disableDotRule: true,
    },
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
