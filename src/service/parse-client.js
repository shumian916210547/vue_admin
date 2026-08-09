import { clearCsrfToken, request, setCsrfToken } from "./api-client";

const AUTH_CONTEXT_KEY = "shumian_admin_auth_context";
const RESERVED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const copy = (value) => {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (value instanceof ParseObject) return value.toJSON();
  if (Array.isArray(value)) return value.map(copy);
  return Object.entries(value).reduce((result, [key, child]) => {
    if (!RESERVED_KEYS.has(key)) result[key] = copy(child);
    return result;
  }, {});
};

const pointerLike = (value) =>
  value &&
  typeof value === "object" &&
  typeof value.objectId === "string" &&
  typeof value.className === "string";

const hydrate = (value) => {
  if (Array.isArray(value)) return value.map(hydrate);
  if (pointerLike(value)) return new ParseObject(value.className, value);
  return value;
};

const dehydrate = (value) => {
  if (value instanceof ParseObject) {
    return {
      __type: "Pointer",
      className: value.className,
      objectId: value.id,
    };
  }
  if (Array.isArray(value)) return value.map(dehydrate);
  if (value && typeof value === "object") return copy(value);
  return value;
};

const classNameFrom = (className) => {
  if (typeof className === "string") return className;
  if (className?.className) return className.className;
  throw new Error("A Parse class name is required");
};

const readContext = () => {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_CONTEXT_KEY) || "null");
  } catch {
    return null;
  }
};

/**
 * 通知已挂载组件认证上下文发生变化，使头像、姓名等派生 UI 无需整页刷新即可更新。
 * @returns {void} 在非浏览器环境或事件构造失败时安全跳过。
 */
const dispatchAuthContextUpdate = () => {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent("shumian-auth-context-updated"));
};

const writeContext = (context) => {
  if (!context?.user) return;
  sessionStorage.setItem(AUTH_CONTEXT_KEY, JSON.stringify(context));
  sessionStorage.setItem("companyId", context.company?.objectId || "");
  sessionStorage.setItem("systemTitle", context.company?.name || "");
  if (context.company?.name) document.title = context.company.name;
  if (context.role) localStorage.setItem("role", JSON.stringify(context.role));
  setCsrfToken(context.csrfToken);
  dispatchAuthContextUpdate();
};

/**
 * 接收 Axios 会话恢复后的脱敏上下文，更新本地用户资料但不接触 HttpOnly Cookie。
 * @param {CustomEvent} event 事件 detail 为 BFF `/auth/session` 返回的认证上下文。
 * @returns {void} 写入会话级上下文并通知已挂载组件；无效 detail 会被忽略。
 */
const handleRecoveredAuthContext = (event) => {
  if (event?.detail?.user) writeContext(event.detail);
};

if (typeof window !== "undefined") {
  window.addEventListener("shumian-auth-context-recovered", handleRecoveredAuthContext);
}

const clearContext = () => {
  sessionStorage.removeItem(AUTH_CONTEXT_KEY);
  sessionStorage.removeItem("companyId");
  sessionStorage.removeItem("systemTitle");
  localStorage.removeItem("role");
  clearCsrfToken();
  dispatchAuthContextUpdate();
};

/**
 * 清除当前浏览器中的认证上下文，供路由守卫在会话恢复或权限装配失败时安全降级使用。
 * @returns {void} 仅移除当前应用的会话、租户、角色和 CSRF 缓存，不发起网络请求。
 */
export const clearCurrentAuthContext = () => clearContext();

/**
 * 返回当前已恢复的认证上下文，供动态路由等前端体验逻辑读取角色和管理员标记。
 * @returns {{user?: Record<string, unknown>, company?: Record<string, unknown>, role?: Record<string, unknown> | null, isAdmin?: boolean} | null} 仅包含 BFF 已脱敏返回的会话上下文；无会话或存储损坏时返回 null。
 */
export const getCurrentAuthContext = () => readContext();

class ParseObject {
  constructor(className, attributes = {}) {
    this.className = className;
    this.attributes = copy(attributes || {});
    this.id = this.attributes.objectId;
  }

  get(attribute) {
    return hydrate(this.attributes[attribute]);
  }

  set(attribute, value) {
    this.attributes[attribute] = dehydrate(value);
    return this;
  }

  setACL() {
    // ACL is assigned by the backend. Public ACLs are intentionally ignored.
    return this;
  }

  toJSON() {
    return copy(this.attributes);
  }

  _replace(attributes) {
    this.attributes = copy(attributes || {});
    this.id = this.attributes.objectId;
    return this;
  }

  /**
   * 保存当前对象的全部属性或指定字段，避免把认证上下文中的只读 Pointer 一并提交给 BFF。
   * @param {{fields?: string[]}} options 可选保存选项；fields 指定本次写入的属性名称集合。
   * @returns {Promise<ParseObject>} 服务端返回的规范化对象，并同步当前用户认证上下文。
   * @throws {Error} CSRF、权限、Schema、会话或网络请求失败时抛出统一错误。
   */
  async save(options = {}) {
    const sourceAttributes = copy(this.attributes);
    const requestedFields = Array.isArray(options.fields) ? new Set(options.fields) : null;
    const attributes = requestedFields
      ? Object.fromEntries(
          Object.entries(sourceAttributes).filter(([key]) => requestedFields.has(key))
        )
      : sourceAttributes;
    delete attributes.objectId;
    delete attributes.createdAt;
    delete attributes.updatedAt;
    const result = this.id
      ? await request({ method: "put", url: `/data/${encodeURIComponent(this.className)}/${encodeURIComponent(this.id)}`, data: { attributes } })
      : await request({ method: "post", url: `/data/${encodeURIComponent(this.className)}`, data: { attributes } });
    this._replace(result);
    if (this.className === "_User" && User.current()?.id === this.id) {
      const context = readContext();
      if (context) writeContext({ ...context, user: this.toJSON() });
    }
    return this;
  }

  async destroy() {
    if (!this.id) return this;
    await request({ method: "delete", url: `/data/${encodeURIComponent(this.className)}/${encodeURIComponent(this.id)}` });
    return this;
  }
}

class Query {
  constructor(className) {
    this.className = classNameFrom(className);
    this.filters = [];
    this.includePaths = [];
    this.selectedFields = [];
    this.limitValue = undefined;
    this.skipValue = undefined;
    this.descendingField = undefined;
    this.shouldIncludeAll = false;
  }

  equalTo(field, value) {
    this.filters.push({ field, operator: "equalTo", value: dehydrate(value) });
    return this;
  }

  containedIn(field, values) {
    this.filters.push({ field, operator: "containedIn", value: dehydrate(values) });
    return this;
  }

  contains(field, value) {
    this.filters.push({ field, operator: "contains", value });
    return this;
  }

  descending(field) {
    this.descendingField = field;
    return this;
  }

  includeAll() {
    this.shouldIncludeAll = true;
    return this;
  }

  include(paths) {
    this.includePaths.push(...(Array.isArray(paths) ? paths : [paths]));
    return this;
  }

  select(...fields) {
    this.selectedFields.push(...fields.flat());
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  skip(value) {
    this.skipValue = value;
    return this;
  }

  async _execute(overrides = {}) {
    return request({
      method: "post",
      url: "/data/query",
      data: {
        className: this.className,
        filters: this.filters,
        includeAll: this.shouldIncludeAll,
        include: this.includePaths,
        select: this.selectedFields,
        descending: this.descendingField,
        limit: overrides.limit ?? this.limitValue,
        skip: overrides.skip ?? this.skipValue,
      },
    });
  }

  async find() {
    const result = await this._execute();
    return result.data.map((record) => new ParseObject(this.className, record));
  }

  async first() {
    const result = await this._execute({ limit: 1, skip: 0 });
    return result.data[0] ? new ParseObject(this.className, result.data[0]) : undefined;
  }

  async count() {
    const result = await this._execute({ limit: 1, skip: 0 });
    return result.count;
  }
}

class User extends ParseObject {
  constructor(attributes = {}) {
    super("_User", attributes);
  }

  static current() {
    const context = readContext();
    return context?.user ? new User(context.user) : null;
  }

  static async restore() {
    if (User.current()) return User.current();
    try {
      const context = await request({ method: "get", url: "/auth/session" });
      writeContext(context);
      return new User(context.user);
    } catch {
      clearContext();
      return null;
    }
  }

  static async logIn(username, password) {
    const context = await request({ method: "post", url: "/auth/login", data: { username, password } });
    writeContext(context);
    return new User(context.user);
  }

  static async logOut() {
    try {
      await request({ method: "post", url: "/auth/logout" });
    } finally {
      clearContext();
    }
  }

  static async loginOut() {
    return User.logOut();
  }
}

User.className = "_User";

class Schema {
  constructor(className) {
    this.className = className;
    this.addedFields = [];
    this.deletedFields = [];
    this.shouldPurge = false;
  }

  addField(name, type, options = {}) {
    this.addedFields.push({ name, type, options: copy(options) });
    return this;
  }

  addPointer(name, targetClass) {
    return this.addField(name, "Pointer", { targetClass });
  }

  deleteField(name) {
    this.deletedFields.push(name);
    return this;
  }

  setCLP() {
    // All class-level permissions are private; the BFF enforces authorization.
    return this;
  }

  async save() {
    await request({ method: "post", url: "/schema", data: { className: this.className, fields: this.addedFields } });
    return this;
  }

  async update() {
    await request({
      method: "patch",
      url: `/schema/${encodeURIComponent(this.className)}`,
      data: { addFields: this.addedFields, deleteFields: this.deletedFields },
    });
    return this;
  }

  async purge() {
    this.shouldPurge = true;
    return this;
  }

  async delete() {
    await request({
      method: "delete",
      url: `/schema/${encodeURIComponent(this.className)}?purge=${this.shouldPurge ? "true" : "false"}`,
    });
    return this;
  }

  static async all() {
    return request({ method: "get", url: "/schema/definitions" });
  }
}

class ACL {
  setPublicReadAccess() {}
  setPublicWriteAccess() {}
}

class CLP {
  setPublicCountAccess() {}
  setPublicGetAccess() {}
  setPublicFindAccess() {}
  setPublicDeleteAccess() {}
  setPublicUpdateAccess() {}
  setPublicAddFieldAccess() {}
  setPublicCreateAccess() {}
}

const Parse = {
  initialize: () => {},
  Object: {
    extend: (className) =>
      class extends ParseObject {
        constructor(attributes = {}) {
          super(className, attributes);
        }
      },
  },
  Query,
  User,
  Schema,
  ACL,
  CLP,
  Error: { INVALID_SESSION_TOKEN: 209 },
};

export { ParseObject, Query, User, Schema };
export default Parse;
