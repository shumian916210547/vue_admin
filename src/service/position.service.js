import { request } from "@/service/api-client";

/**
 * 读取岗位列表、当前企业可下放的业务页面和每页可选按钮权限。
 * @returns {Promise<{positions: Array<Record<string, unknown>>, routes: Array<Record<string, unknown>>, buttonPermissions: string[]}>} 岗位管理页的完整配置数据。
 * @throws {Error} 会话失效、权限不足或 BFF 请求失败时抛出统一错误。
 */
export const getPositionOverview = () => request({ method: "get", url: "/positions/overview" });

/**
 * 创建一个岗位，并同时保存其可访问页面及每个页面内的按钮权限。
 * @param {{name: string, pagePermissions: Array<{routeId: string, permissions: string[]}>}} payload 岗位名称和逐页权限配置。
 * @returns {Promise<Record<string, unknown>>} BFF 返回的新建岗位安全 DTO。
 * @throws {Error} 岗位名称、页面或按钮权限无效时抛出统一错误。
 */
export const createPosition = (payload) => request({ method: "post", url: "/positions", data: payload });

/**
 * 修改一个普通岗位的名称、页面访问权限和逐页按钮权限；系统岗位由服务端拒绝修改。
 * @param {string} positionId 需要修改的岗位 Role objectId。
 * @param {{name?: string, pagePermissions?: Array<{routeId: string, permissions: string[]}>}} payload 岗位编辑数据。
 * @returns {Promise<Record<string, unknown>>} 更新后的岗位安全 DTO。
 * @throws {Error} 岗位不存在、已被保护或权限配置非法时抛出统一错误。
 */
export const updatePosition = (positionId, payload) =>
  request({ method: "put", url: `/positions/${encodeURIComponent(positionId)}`, data: payload });

/**
 * 删除一个未被成员使用的普通岗位；页面会先以中文提示确认不可逆影响。
 * @param {string} positionId 需要删除的岗位 Role objectId。
 * @returns {Promise<void>} BFF 删除成功后兑现。
 * @throws {Error} 岗位仍被成员使用、会话失效或权限不足时抛出统一错误。
 */
export const deletePosition = (positionId) =>
  request({ method: "delete", url: `/positions/${encodeURIComponent(positionId)}` });
