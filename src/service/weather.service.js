const DEFAULT_WEATHER_CONFIG = Object.freeze({
  apiBase: "https://api.open-meteo.com/v1/forecast",
  ipApi: "https://ipapi.co/json/",
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
 * @returns {{apiBase: string, ipApi: string, latitude: number, longitude: number, location: string}} 可直接用于天气请求的安全配置。
 */
export const getWeatherRuntimeConfig = (runtimeConfig = window.__SHUMIAN_CONFIG__) => {
  const configured = runtimeConfig?.weather || {};
  const latitude = Number(configured.latitude);
  const longitude = Number(configured.longitude);
  return {
    apiBase: typeof configured.apiBase === "string" && configured.apiBase ? configured.apiBase : DEFAULT_WEATHER_CONFIG.apiBase,
    ipApi: typeof configured.ipApi === "string" && configured.ipApi ? configured.ipApi : DEFAULT_WEATHER_CONFIG.ipApi,
    latitude: Number.isFinite(latitude) ? latitude : DEFAULT_WEATHER_CONFIG.latitude,
    longitude: Number.isFinite(longitude) ? longitude : DEFAULT_WEATHER_CONFIG.longitude,
    location:
      typeof configured.location === "string" && configured.location.trim()
        ? configured.location.trim()
        : DEFAULT_WEATHER_CONFIG.location,
  };
};

/**
 * 使用设备原生 Geolocation API 获取坐标；权限拒绝、超时和浏览器不支持均交给调用方降级处理。
 * @param {{timeoutMs?: number}} options 定位超时时间，单位为毫秒，默认 5000 毫秒。
 * @returns {Promise<{latitude: number, longitude: number}>} 设备当前的十进制度纬度和经度。
 * @throws {Error} 浏览器不支持定位、用户拒绝授权、定位超时或坐标无效时抛出异常。
 */
export const getDeviceCoordinates = ({ timeoutMs = 5_000 } = {}) =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("当前浏览器不支持设备定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords?.latitude);
        const longitude = Number(position.coords?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error("设备定位返回了无效坐标"));
          return;
        }
        resolve({ latitude, longitude });
      },
      (error) => reject(new Error(error?.message || "设备定位失败")),
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: timeoutMs }
    );
  });

/**
 * 使用无密钥 IP 定位服务获取城市与坐标，作为设备定位失败后的第二级保障。
 * @param {string} apiUrl IP 定位 API 地址，只使用运行时公开配置。
 * @returns {Promise<{latitude: number, longitude: number, location: string}>} IP 服务返回的坐标和城市名称。
 * @throws {Error} IP API 网络失败、响应非 2xx 或缺少有效坐标时抛出异常。
 */
export const getIpLocation = async (apiUrl) => {
  const response = await fetchJsonWithTimeout(apiUrl, 8_000);
  if (response?.error) throw new Error("IP 城市定位服务返回错误");
  const latitude = Number(response?.latitude);
  const longitude = Number(response?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("IP 城市定位返回了无效坐标");
  }
  const location = [response?.city, response?.region, response?.country_name]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim())
    .slice(0, 2)
    .join(" · ") || "IP 定位城市";
  return { latitude, longitude, location };
};

/**
 * 按设备定位、IP 城市定位、运行时默认城市的优先级解析天气坐标。
 * @param {{apiBase?: string, ipApi?: string, latitude?: number, longitude?: number, location?: string, geolocationTimeoutMs?: number}} options 天气请求可选覆盖配置；显式传入经纬度时跳过自动定位。
 * @returns {Promise<{apiBase: string, latitude: number, longitude: number, location: string, locationSource: "device" | "ip" | "config"}>} 天气服务可直接消费的最终位置配置。
 * @throws {Error} 显式坐标和运行时默认坐标均无效，或天气位置无法解析时抛出异常。
 */
export const resolveWeatherLocation = async (options = {}) => {
  const runtime = getWeatherRuntimeConfig();
  const config = { ...runtime, ...options };
  const explicitLatitude = Number(options.latitude);
  const explicitLongitude = Number(options.longitude);
  if (Number.isFinite(explicitLatitude) && Number.isFinite(explicitLongitude)) {
    return {
      ...config,
      latitude: explicitLatitude,
      longitude: explicitLongitude,
      location: typeof options.location === "string" && options.location.trim() ? options.location.trim() : runtime.location,
      locationSource: "config",
    };
  }

  try {
    const device = await getDeviceCoordinates({ timeoutMs: options.geolocationTimeoutMs });
    return { ...config, ...device, location: "当前位置", locationSource: "device" };
  } catch {
    try {
      const ipLocation = await getIpLocation(config.ipApi);
      return { ...config, ...ipLocation, locationSource: "ip" };
    } catch {
      const fallbackLatitude = Number(runtime.latitude);
      const fallbackLongitude = Number(runtime.longitude);
      if (!Number.isFinite(fallbackLatitude) || !Number.isFinite(fallbackLongitude)) {
        throw new Error("设备定位和 IP 城市定位均不可用");
      }
      return { ...runtime, latitude: fallbackLatitude, longitude: fallbackLongitude, locationSource: "config" };
    }
  }
};

/**
 * 请求公开 JSON 服务并设置超时，统一处理 HTTP 状态和 AbortController 清理。
 * @param {string} url 公开 JSON API 地址。
 * @param {number} timeoutMs 超时时间，单位为毫秒。
 * @returns {Promise<Record<string, unknown>>} 解析后的 JSON 对象。
 * @throws {Error} 请求失败、超时、非 2xx 响应或返回值不是对象时抛出异常。
 */
const fetchJsonWithTimeout = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
  if (!response.ok) throw new Error("公开定位服务暂不可用");
  const payload = await response.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("公开定位服务返回了无效数据");
  }
  return payload;
};

/**
 * 获取实时天气；未显式传入坐标时严格按设备定位、IP 城市定位、运行时默认城市执行。
 * @param {{apiBase?: string, ipApi?: string, latitude?: number, longitude?: number, location?: string, geolocationTimeoutMs?: number}} options 覆盖运行时配置的可选天气参数，坐标单位为十进制度，定位超时单位为毫秒。
 * @returns {Promise<{location: string, locationSource: "device" | "ip" | "config", temperature: number | null, weatherCode: number | null, description: string, windSpeed: number | null, observedAt: string | null}>} 适用于首页卡片的标准天气对象。
 * @throws {Error} 网络、跨域或第三方天气服务响应异常时抛出错误。
 */
export const getCurrentWeather = async (options = {}) => {
  const config = await resolveWeatherLocation(options);
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

  const payload = await fetchJsonWithTimeout(endpoint.toString(), 8_000);
  const current = payload?.current;
  if (!current || typeof current !== "object") throw new Error("天气服务返回了无效数据");

  const weatherCode = Number(current.weather_code);
  const temperature = Number(current.temperature_2m);
  const windSpeed = Number(current.wind_speed_10m);

  return {
    location: config.location,
    locationSource: config.locationSource,
    temperature: Number.isFinite(temperature) ? Math.round(temperature) : null,
    weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
    description: getWeatherDescription(weatherCode),
    windSpeed: Number.isFinite(windSpeed) ? Math.round(windSpeed) : null,
    observedAt: typeof current.time === "string" ? current.time : null,
  };
};
