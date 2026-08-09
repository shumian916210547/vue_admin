const DEFAULT_WEATHER_CONFIG = Object.freeze({
  apiBase: "https://api.open-meteo.com/v1/forecast",
  latitude: 39.9042,
  longitude: 116.4074,
  location: "北京",
});

/**
 * 将 Open-Meteo 的天气代码转换为适合管理台阅读的中文天气描述。
 * @param {number} weatherCode Open-Meteo current.weather_code 的数值代码。
 * @returns {string} 中文天气文本；未知代码会回退为“天气未知”。
 */
export const getWeatherDescription = (weatherCode) => {
  const descriptions = {
    0: "晴朗",
    1: "大部晴朗",
    2: "局部多云",
    3: "阴天",
    45: "有雾",
    48: "雾凇",
    51: "毛毛雨",
    53: "中等毛毛雨",
    55: "强毛毛雨",
    56: "冻毛毛雨",
    57: "强冻毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "冻雨",
    67: "强冻雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "霰",
    80: "阵雨",
    81: "中等阵雨",
    82: "强阵雨",
    85: "阵雪",
    86: "强阵雪",
    95: "雷暴",
    96: "雷暴伴冰雹",
    99: "强雷暴伴冰雹",
  };
  return descriptions[weatherCode] || "天气未知";
};

/**
 * 读取不会包含机密的运行时天气配置，并对经纬度做数值回退。
 * @param {Record<string, unknown> | undefined} runtimeConfig window.__SHUMIAN_CONFIG__ 的值。
 * @returns {{apiBase: string, latitude: number, longitude: number, location: string}} 可直接用于天气请求的安全配置。
 */
export const getWeatherRuntimeConfig = (runtimeConfig = window.__SHUMIAN_CONFIG__) => {
  const configured = runtimeConfig?.weather || {};
  const latitude = Number(configured.latitude);
  const longitude = Number(configured.longitude);
  return {
    apiBase: typeof configured.apiBase === "string" && configured.apiBase ? configured.apiBase : DEFAULT_WEATHER_CONFIG.apiBase,
    latitude: Number.isFinite(latitude) ? latitude : DEFAULT_WEATHER_CONFIG.latitude,
    longitude: Number.isFinite(longitude) ? longitude : DEFAULT_WEATHER_CONFIG.longitude,
    location:
      typeof configured.location === "string" && configured.location.trim()
        ? configured.location.trim()
        : DEFAULT_WEATHER_CONFIG.location,
  };
};

/**
 * 获取指定经纬度的实时天气；默认使用 public/config.js 中定义的城市。
 * @param {{apiBase?: string, latitude?: number, longitude?: number, location?: string}} options 覆盖运行时配置的可选天气参数，纬度/经度单位为十进制度。
 * @returns {Promise<{location: string, temperature: number | null, weatherCode: number | null, description: string, windSpeed: number | null, observedAt: string | null}>} 适用于首页卡片的标准天气对象。
 * @throws {Error} 网络、跨域或第三方天气服务响应异常时抛出错误。
 */
export const getCurrentWeather = async (options = {}) => {
  const runtime = getWeatherRuntimeConfig();
  const config = { ...runtime, ...options };
  const latitude = Number(config.latitude);
  const longitude = Number(config.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("天气服务坐标配置无效");
  }
  const endpoint = new URL(config.apiBase, window.location.origin);
  endpoint.searchParams.set("latitude", String(latitude));
  endpoint.searchParams.set("longitude", String(longitude));
  endpoint.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  endpoint.searchParams.set("timezone", "auto");

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);
  let response;
  try {
    response = await fetch(endpoint.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
  if (!response.ok) throw new Error("天气服务暂不可用");

  const payload = await response.json();
  const current = payload?.current;
  if (!current || typeof current !== "object") throw new Error("天气服务返回了无效数据");

  const weatherCode = Number(current.weather_code);
  const temperature = Number(current.temperature_2m);
  const windSpeed = Number(current.wind_speed_10m);

  return {
    location: config.location,
    temperature: Number.isFinite(temperature) ? Math.round(temperature) : null,
    weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
    description: getWeatherDescription(weatherCode),
    windSpeed: Number.isFinite(windSpeed) ? Math.round(windSpeed) : null,
    observedAt: typeof current.time === "string" ? current.time : null,
  };
};
