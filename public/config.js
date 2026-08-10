// Runtime configuration intentionally contains only browser-safe values.
// Keep credentials, database URLs, and Parse configuration on the API server.
window.__SHUMIAN_CONFIG__ = Object.freeze({
  apiBase: "/api",
  dashboardUrl: "",
  mapKey: "",
  // 默认使用无密钥天气服务的北京坐标。企业部署可改为本地城市或受控天气网关地址。
  weather: {
    apiBase: "https://api.open-meteo.com/v1/forecast",
    ipApi: "https://ipapi.co/json/",
    latitude: 39.9042,
    longitude: 116.4074,
    location: "北京",
  },
});
