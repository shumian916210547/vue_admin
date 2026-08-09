/**
 * 用户界面的主题预设。每套预设同时提供亮色和深色令牌，供当前用户在设置面板中恢复默认值。
 * @type {ReadonlyArray<{key: string, name: string, description: string, colors: {light: Record<string, string>, dark: Record<string, string>}}>}
 */
export const THEME_PRESETS = Object.freeze([
  {
    key: "ocean",
    name: "深海蓝",
    description: "清晰、稳重，适合日常运营与数据管理。",
    colors: {
      light: {
        primary: "#2563eb",
        canvas: "#f4f7ff",
        surface: "#ffffff",
        ink: "#172033",
        text: "#526075",
        muted: "#8a94a6",
        border: "#dfe7f5",
      },
      dark: {
        primary: "#60a5fa",
        canvas: "#081324",
        surface: "#0f1d32",
        ink: "#f2f7ff",
        text: "#c7d3e4",
        muted: "#8fa0b8",
        border: "#263b58",
      },
    },
  },
  {
    key: "emerald",
    name: "翡翠绿",
    description: "平衡、自然，适合业务协同和健康状态展示。",
    colors: {
      light: {
        primary: "#059669",
        canvas: "#f1faf6",
        surface: "#ffffff",
        ink: "#102a24",
        text: "#47675d",
        muted: "#82978f",
        border: "#d7e9e1",
      },
      dark: {
        primary: "#34d399",
        canvas: "#071b18",
        surface: "#102924",
        ink: "#effdf7",
        text: "#c3e1d6",
        muted: "#86aa9d",
        border: "#23483f",
      },
    },
  },
  {
    key: "violet",
    name: "暮光紫",
    description: "克制而有辨识度，适合产品与创意团队。",
    colors: {
      light: {
        primary: "#7c3aed",
        canvas: "#f7f5ff",
        surface: "#ffffff",
        ink: "#251a3d",
        text: "#5f5874",
        muted: "#928aa4",
        border: "#e5dff5",
      },
      dark: {
        primary: "#a78bfa",
        canvas: "#151020",
        surface: "#221a31",
        ink: "#faf7ff",
        text: "#d8d0e7",
        muted: "#a59bb8",
        border: "#403255",
      },
    },
  },
  {
    key: "sunset",
    name: "暖阳橙",
    description: "温暖、醒目，适合需要突出行动和告警的工作台。",
    colors: {
      light: {
        primary: "#ea580c",
        canvas: "#fff7f1",
        surface: "#ffffff",
        ink: "#352014",
        text: "#735642",
        muted: "#a58d7b",
        border: "#f2dfd1",
      },
      dark: {
        primary: "#fb923c",
        canvas: "#21130c",
        surface: "#321d12",
        ink: "#fff8f2",
        text: "#ead0bc",
        muted: "#b89a84",
        border: "#583721",
      },
    },
  },
  {
    key: "slate",
    name: "石墨灰",
    description: "低干扰、高对比，适合长期密集操作场景。",
    colors: {
      light: {
        primary: "#475569",
        canvas: "#f5f7fa",
        surface: "#ffffff",
        ink: "#18212d",
        text: "#52606f",
        muted: "#8d99a8",
        border: "#dfe5ec",
      },
      dark: {
        primary: "#94a3b8",
        canvas: "#10151d",
        surface: "#1a222d",
        ink: "#f6f8fb",
        text: "#cbd4df",
        muted: "#8e9dad",
        border: "#34404e",
      },
    },
  },
]);

const DEFAULT_PRESET_KEY = "ocean";
const THEME_PREFERENCE_STORAGE_KEY = "shumian_admin_visual_theme";
const AUTH_CONTEXT_STORAGE_KEY = "shumian_admin_auth_context";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * 生成按企业和用户隔离的主题缓存键，避免同一浏览器切换账号时泄露上一用户的视觉偏好。
 * @returns {string} 当前认证上下文对应的 localStorage 键；未登录时返回匿名键。
 */
const getThemePreferenceStorageKey = () => {
  try {
    const context = JSON.parse(sessionStorage.getItem(AUTH_CONTEXT_STORAGE_KEY) || "null");
    const userId = context?.user?.objectId || context?.user?.id;
    const companyId = context?.company?.objectId || context?.company?.id;
    return userId && companyId
      ? `${THEME_PREFERENCE_STORAGE_KEY}:${companyId}:${userId}`
      : `${THEME_PREFERENCE_STORAGE_KEY}:anonymous`;
  } catch {
    return `${THEME_PREFERENCE_STORAGE_KEY}:anonymous`;
  }
};

/**
 * 将任意主题名规范为系统支持的亮色或深色值。
 * @param {unknown} appearance 原始主题值；允许为空或来自历史配置。
 * @returns {"light" | "dark"} 可用于 CSS 与 Ant Design Vue 菜单的主题值。
 */
export const normalizeAppearance = (appearance) => (appearance === "dark" ? "dark" : "light");

/**
 * 校验并规范化十六进制颜色，避免用户输入非法 CSS 值影响整站样式。
 * @param {unknown} value 待校验颜色，格式应为 #RRGGBB。
 * @param {string} fallback 校验失败时使用的安全颜色，格式应为 #RRGGBB。
 * @returns {string} 小写的合法十六进制颜色。
 */
export const normalizeHexColor = (value, fallback) => {
  const candidate = typeof value === "string" ? value.trim() : "";
  return (HEX_COLOR_PATTERN.test(candidate) ? candidate : fallback).toLowerCase();
};

/**
 * 根据键值查询主题预设；未知键会安全回退到深海蓝。
 * @param {unknown} key 用户保存的预设键值。
 * @returns {(typeof THEME_PRESETS)[number]} 已知主题预设对象。
 */
export const getThemePreset = (key) =>
  THEME_PRESETS.find((preset) => preset.key === key) ||
  THEME_PRESETS.find((preset) => preset.key === DEFAULT_PRESET_KEY);

/**
 * 将 #RRGGBB 颜色转换为 RGB 数组，供透明背景和阴影令牌生成使用。
 * @param {string} color 已经通过 normalizeHexColor 校验的十六进制颜色。
 * @returns {[number, number, number]} 红、绿、蓝通道的整数数组，范围为 0 到 255。
 */
const hexToRgb = (color) => {
  const normalized = normalizeHexColor(color, "#000000");
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
};

/**
 * 生成透明 RGBA 颜色，避免把透明度配置散落在各个组件内。
 * @param {string} color 已校验或可校验的十六进制颜色。
 * @param {number} opacity 透明度，范围为 0 到 1。
 * @returns {string} 可直接写入 CSS 自定义属性的 rgba() 字符串。
 */
const toRgba = (color, opacity) => {
  const [red, green, blue] = hexToRgb(color);
  const safeOpacity = Math.min(Math.max(Number(opacity) || 0, 0), 1);
  return `rgba(${red}, ${green}, ${blue}, ${safeOpacity})`;
};

/**
 * 将一套颜色混合到目标色，用于生成主色的悬停态而不依赖第三方颜色库。
 * @param {string} source 原始十六进制颜色。
 * @param {string} target 混合目标十六进制颜色。
 * @param {number} amount 目标色占比，范围为 0 到 1。
 * @returns {string} 混合后的 #RRGGBB 颜色。
 */
const blendHexColor = (source, target, amount) => {
  const [sourceRed, sourceGreen, sourceBlue] = hexToRgb(source);
  const [targetRed, targetGreen, targetBlue] = hexToRgb(target);
  const safeAmount = Math.min(Math.max(Number(amount) || 0, 0), 1);
  const toHex = (value) => Math.round(value).toString(16).padStart(2, "0");
  return `#${toHex(sourceRed + (targetRed - sourceRed) * safeAmount)}${toHex(
    sourceGreen + (targetGreen - sourceGreen) * safeAmount
  )}${toHex(sourceBlue + (targetBlue - sourceBlue) * safeAmount)}`;
};

/**
 * 计算颜色的 WCAG 相对亮度，用于判断自定义文字与背景是否仍保持可读。
 * @param {string} color 已校验或可校验的十六进制颜色。
 * @returns {number} 介于 0 与 1 之间的相对亮度。
 */
const relativeLuminance = (color) => {
  const channels = hexToRgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

/**
 * 计算两种颜色的 WCAG 对比度。
 * @param {string} foreground 前景色，格式为 #RRGGBB。
 * @param {string} background 背景色，格式为 #RRGGBB。
 * @returns {number} 对比度比值，范围为 1 到 21。
 */
const contrastRatio = (foreground, background) => {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * 从深墨色和白色中选择对多个背景都最清晰的前景色，保证用户自定义背景后不出现看不清文字的情况。
 * @param {string[]} backgrounds 需要同时适配的背景颜色集合。
 * @returns {"#000000" | "#ffffff"} 最小对比度最高的安全前景色。
 */
const bestContrastForeground = (backgrounds) =>
  ["#000000", "#ffffff"].reduce((best, candidate) => {
    const candidateScore = Math.min(...backgrounds.map((background) => contrastRatio(candidate, background)));
    const bestScore = Math.min(...backgrounds.map((background) => contrastRatio(best, background)));
    return candidateScore > bestScore ? candidate : best;
  }, "#000000");

/**
 * 确保页面底色和卡片底色可共享同一套文字令牌。若用户把两个背景设置成黑白等相反极端颜色，
 * 任意一个单一文字色都无法同时可读；此时保留页面底色，并把卡片底色安全回退为页面底色。
 * @param {string} canvas 已校验的页面背景色。
 * @param {string} surface 已校验的卡片背景色。
 * @returns {string} 能与 canvas 共用至少 4.5:1 前景对比度的安全卡片背景色。
 */
const ensureReadableSurface = (canvas, surface) => {
  const foreground = bestContrastForeground([canvas]);
  return contrastRatio(foreground, surface) >= 4.5 ? surface : canvas;
};

/**
 * 保留用户颜色前提下强制满足最低对比度；不达标时自动回退到对目标背景最清晰的安全颜色。
 * @param {string} foreground 用户选择或预设提供的前景色。
 * @param {string[]} backgrounds 文字可能出现的背景色集合。
 * @param {number} minimumRatio 最低对比度，普通文字通常为 4.5，辅助信息为 3。
 * @returns {string} 原前景色或自动选择的高对比安全颜色。
 */
const ensureContrast = (foreground, backgrounds, minimumRatio) =>
  backgrounds.every((background) => contrastRatio(foreground, background) >= minimumRatio)
    ? foreground
    : bestContrastForeground(backgrounds);

/**
 * 计算指定用户配置在当前明暗模式下实际生效的主题颜色。
 * @param {Record<string, unknown>} options 用户的 systemOptions 或本地恢复的主题偏好。
 * @returns {{appearance: "light" | "dark", presetKey: string, primary: string, primaryContrast: string, primaryHoverContrast: string, canvas: string, surface: string, ink: string, text: string, muted: string, border: string, success: string, warning: string, danger: string, primaryHover: string, primarySoft: string, primaryRgb: string, surfaceRgb: string, successRgb: string, warningRgb: string, dangerRgb: string}} 完整的可视令牌集合。
 */
export const getEffectiveThemeColors = (options = {}) => {
  const appearance = normalizeAppearance(options.theme);
  const preset = getThemePreset(options.colorPreset);
  const defaults = preset.colors[appearance];
  const primary = normalizeHexColor(options.primaryColor, defaults.primary);
  const canvas = normalizeHexColor(options.canvasColor, defaults.canvas);
  const surface = ensureReadableSurface(canvas, normalizeHexColor(options.surfaceColor, defaults.surface));
  const readableBackgrounds = [surface, canvas];
  const ink = ensureContrast(normalizeHexColor(options.inkColor, defaults.ink), readableBackgrounds, 4.5);
  const text = ensureContrast(normalizeHexColor(options.textColor, defaults.text), readableBackgrounds, 4.5);
  const muted = ensureContrast(normalizeHexColor(options.mutedColor, defaults.muted), readableBackgrounds, 3);
  const border = normalizeHexColor(options.borderColor, defaults.border);
  const success = normalizeHexColor(options.successColor, appearance === "dark" ? "#34d399" : "#12a594");
  const warning = normalizeHexColor(options.warningColor, appearance === "dark" ? "#fbbf24" : "#f59e0b");
  const danger = normalizeHexColor(options.dangerColor, appearance === "dark" ? "#fb7185" : "#e84a5f");
  const [primaryRed, primaryGreen, primaryBlue] = hexToRgb(primary);
  const [surfaceRed, surfaceGreen, surfaceBlue] = hexToRgb(surface);
  const [successRed, successGreen, successBlue] = hexToRgb(success);
  const [warningRed, warningGreen, warningBlue] = hexToRgb(warning);
  const [dangerRed, dangerGreen, dangerBlue] = hexToRgb(danger);

  const primaryHover = blendHexColor(primary, appearance === "dark" ? "#ffffff" : "#000000", 0.15);
  return {
    appearance,
    presetKey: preset.key,
    primary,
    primaryContrast: bestContrastForeground([primary]),
    primaryHoverContrast: bestContrastForeground([primaryHover]),
    canvas,
    surface,
    ink,
    text,
    muted,
    border,
    success,
    warning,
    danger,
    primaryHover,
    primarySoft: toRgba(primary, appearance === "dark" ? 0.2 : 0.1),
    primaryRgb: `${primaryRed}, ${primaryGreen}, ${primaryBlue}`,
    surfaceRgb: `${surfaceRed}, ${surfaceGreen}, ${surfaceBlue}`,
    successRgb: `${successRed}, ${successGreen}, ${successBlue}`,
    warningRgb: `${warningRed}, ${warningGreen}, ${warningBlue}`,
    dangerRgb: `${dangerRed}, ${dangerGreen}, ${dangerBlue}`,
  };
};

/**
 * 将主题令牌写入根节点，使静态页面、动态 CRUD 页面和 Ant Design Vue 覆写同步更新。
 * @param {Record<string, unknown>} options 用户的 systemOptions 或本地恢复的主题偏好。
 * @returns {void} 仅更新浏览器 DOM，不发起网络请求。
 */
export const applyVisualTheme = (options = {}) => {
  if (typeof document === "undefined") return;

  const colors = getEffectiveThemeColors(options);
  const root = document.documentElement;
  const glassEnabled = options.glassEffect !== false;

  root.dataset.appTheme = colors.appearance;
  root.dataset.appGlass = glassEnabled ? "true" : "false";
  root.style.setProperty("--app-primary", colors.primary);
  root.style.setProperty("--app-primary-contrast", colors.primaryContrast);
  root.style.setProperty("--app-primary-hover", colors.primaryHover);
  root.style.setProperty("--app-primary-hover-contrast", colors.primaryHoverContrast);
  root.style.setProperty("--app-primary-soft", colors.primarySoft);
  root.style.setProperty("--app-primary-rgb", colors.primaryRgb);
  root.style.setProperty("--app-canvas", colors.canvas);
  root.style.setProperty("--app-surface", colors.surface);
  root.style.setProperty("--app-surface-rgb", colors.surfaceRgb);
  root.style.setProperty("--app-ink", colors.ink);
  root.style.setProperty("--app-text", colors.text);
  root.style.setProperty("--app-muted", colors.muted);
  root.style.setProperty("--app-border", colors.border);
  root.style.setProperty("--app-success", colors.success);
  root.style.setProperty("--app-success-rgb", colors.successRgb);
  root.style.setProperty("--app-warning", colors.warning);
  root.style.setProperty("--app-warning-rgb", colors.warningRgb);
  root.style.setProperty("--app-danger", colors.danger);
  root.style.setProperty("--app-danger-rgb", colors.dangerRgb);
  root.style.setProperty(
    "--app-glass-surface",
    glassEnabled ? toRgba(colors.surface, colors.appearance === "dark" ? 0.8 : 0.72) : colors.surface
  );
  root.style.setProperty(
    "--app-glass-strong",
    glassEnabled ? toRgba(colors.surface, colors.appearance === "dark" ? 0.92 : 0.88) : colors.surface
  );
  root.style.setProperty(
    "--app-glass-border",
    glassEnabled ? toRgba(colors.border, colors.appearance === "dark" ? 0.72 : 0.9) : colors.border
  );
  root.style.setProperty(
    "--app-shadow",
    colors.appearance === "dark"
      ? "0 18px 42px rgba(0, 0, 0, 0.32)"
      : "0 18px 42px rgba(20, 38, 74, 0.1)"
  );
  root.style.setProperty(
    "--app-shadow-soft",
    colors.appearance === "dark"
      ? "0 6px 20px rgba(0, 0, 0, 0.2)"
      : "0 5px 18px rgba(20, 38, 74, 0.07)"
  );
};

/**
 * 将不含身份信息的视觉偏好缓存到浏览器，以便登录页和刷新前避免主题闪烁。
 * @param {Record<string, unknown>} options 当前用户的完整 systemOptions。
 * @returns {void} 本地存储不可用时静默跳过，不影响业务登录或页面操作。
 */
export const persistVisualThemePreference = (options = {}) => {
  try {
    const preference = {
      theme: normalizeAppearance(options.theme),
      colorPreset: getThemePreset(options.colorPreset).key,
      primaryColor: options.primaryColor || "",
      canvasColor: options.canvasColor || "",
      surfaceColor: options.surfaceColor || "",
      inkColor: options.inkColor || "",
      textColor: options.textColor || "",
      mutedColor: options.mutedColor || "",
      borderColor: options.borderColor || "",
      successColor: options.successColor || "",
      warningColor: options.warningColor || "",
      dangerColor: options.dangerColor || "",
      glassEffect: options.glassEffect !== false,
    };
    localStorage.setItem(getThemePreferenceStorageKey(), JSON.stringify(preference));
  } catch {
    // 浏览器隐私模式可能禁止本地存储；主题仍会在当前页面生效。
  }
};

/**
 * 在 Vue 应用挂载前恢复最近的视觉偏好，保证登录页也能使用已选择的主题风格。
 * @returns {Record<string, unknown> | null} 恢复到的偏好对象；无有效缓存时返回 null。
 */
export const restoreVisualThemePreference = () => {
  try {
    const preference = JSON.parse(localStorage.getItem(getThemePreferenceStorageKey()) || "null");
    if (!preference || typeof preference !== "object" || Array.isArray(preference)) return null;
    applyVisualTheme(preference);
    return preference;
  } catch {
    return null;
  }
};
