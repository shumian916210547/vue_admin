import {
  ArrowDown,
  Avatar,
  Brush,
  Calendar,
  CircleCheck,
  CircleCheckFilled,
  Cloudy,
  Delete,
  Edit,
  Expand,
  Fold,
  FullScreen,
  Grid,
  House,
  Lock,
  Location,
  Menu,
  OfficeBuilding,
  Plus,
  Refresh,
  Setting,
  SwitchButton,
  Timer,
  TrendCharts,
  Upload,
  User,
  UserFilled,
} from "@element-plus/icons-vue";

/**
 * 将历史菜单元数据中的图标名称映射为 Element Plus 官方图标组件。
 * @type {Readonly<Record<string, import("vue").Component>>} 兼容历史名称的图标组件字典。
 */
export const elementIconMap = Object.freeze({
  AppstoreOutlined: Grid,
  ApartmentOutlined: OfficeBuilding,
  CalendarOutlined: Calendar,
  CheckCircleFilled: CircleCheckFilled,
  CloudOutlined: Cloudy,
  CompressOutlined: FullScreen,
  DownOutlined: ArrowDown,
  EditOutlined: Edit,
  EnvironmentOutlined: Location,
  ExpandOutlined: FullScreen,
  FieldTimeOutlined: Timer,
  Grid,
  HomeOutlined: House,
  LockOutlined: Lock,
  LoginOutlined: SwitchButton,
  MenuFoldOutlined: Fold,
  MenuUnfoldOutlined: Expand,
  PlusOutlined: Plus,
  ReloadOutlined: Refresh,
  RiseOutlined: TrendCharts,
  SafetyCertificateOutlined: CircleCheck,
  SettingOutlined: Setting,
  SkinOutlined: Brush,
  TeamOutlined: UserFilled,
  UploadOutlined: Upload,
  UserAddOutlined: Avatar,
  UserOutlined: User,
});

const elementFormComponentNames = new Set([
  "ElInput",
  "ElInputNumber",
  "ElInputPassword",
  "ElSelect",
  "ElTreeSelect",
  "ElSwitch",
  "ElDatePicker",
  "ElDateRangePicker",
  "ElUpload",
]);

/**
 * 将 Schema 中的表单组件标识规范化为 Element Plus 命名，并兼容历史记录的首字母前缀。
 * @param {unknown} value Schema 元数据中的编辑组件标识。
 * @returns {string} Element Plus 组件标识、RichTextEditor 或原始未知值。
 */
export const normalizeEditComponent = (value) => {
  const name = typeof value === "string" ? value.trim() : "";
  if (name === "RichTextEditor" || elementFormComponentNames.has(name)) return name;
  if (name.startsWith("A")) {
    const candidate = `El${name.slice(1)}`;
    if (candidate === "ElRangePicker") return "ElDateRangePicker";
    if (elementFormComponentNames.has(candidate)) return candidate;
  }
  return name;
};

/**
 * 根据历史名称或 Element Plus 名称取得图标组件，未知值回退到通用用户图标。
 * @param {unknown} name 菜单、Schema 或记录中的图标名称。
 * @returns {import("vue").Component} 可安全渲染的 Element Plus 图标组件。
 */
export const getElementIcon = (name) => {
  if (typeof name === "string" && elementIconMap[name]) return elementIconMap[name];
  if (typeof name === "string") {
    const directIcon = {
      Avatar,
      Calendar,
      CircleCheck,
      Cloudy,
      Delete,
      Edit,
      Expand,
      Fold,
      FullScreen,
      Grid,
      House,
      Location,
      Menu,
      OfficeBuilding,
      Plus,
      Refresh,
      Setting,
      SwitchButton,
      Timer,
      TrendCharts,
      Upload,
      User,
      UserFilled,
    }[name];
    if (directIcon) return directIcon;
  }
  return User;
};
