const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: "./", // 主要是这行代码，配置打包后的资源路径
  productionSourceMap: false,
  transpileDependencies: true,
})
