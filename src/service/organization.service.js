import { request } from "@/service/api-client";

/**
 * 请求当前系统管理员可维护的组织树与角色配置。成员数据由独立的分页接口读取，避免概览响应随员工数量线性增长。
 * @returns {Promise<{tree: Array<Record<string, unknown>>, organizations: Array<Record<string, unknown>>, roles: Array<Record<string, unknown>>}>} 组织管理页面所需的基础配置。
 * @throws {Error} 会话失效、权限不足或 BFF 请求失败时抛出统一错误。
 */
export const getOrganizationOverview = () => request({ method: "get", url: "/organization/overview" });

/**
 * 分页检索当前企业的成员账号及其组织授权范围；仅系统管理员可以调用。
 * @param {{page?: number, pageSize?: number, keyword?: string, organizationId?: string, includeDescendants?: boolean}} query 成员列表查询参数；组织范围由 BFF 按同租户组织树解析。
 * @returns {Promise<{members: Array<Record<string, unknown>>, count: number, page: number, pageSize: number}>} 当前页成员、安全总数和服务端确认的分页信息。
 * @throws {Error} 会话失效、无系统管理员权限或查询参数非法时抛出统一错误。
 */
export const getOrganizationMembers = (query) =>
  request({ method: "get", url: "/organization/members", params: query });

/**
 * 创建一个组织节点，支持总部、区域、地方公司和部门层级。
 * @param {{name: string, code?: string, type: string, parentId?: string | null, rank?: number, remark?: string}} payload 组织表单数据。
 * @returns {Promise<Record<string, unknown>>} BFF 返回的新建组织安全 DTO。
 * @throws {Error} 上级组织、编码或权限不合法时抛出统一错误。
 */
export const createOrganization = (payload) => request({ method: "post", url: "/organization/nodes", data: payload });

/**
 * 修改一个组织节点；服务端会阻止循环树和跨企业上级引用。
 * @param {string} organizationId 需要修改的组织 objectId。
 * @param {Record<string, unknown>} payload 组织编辑表单数据。
 * @returns {Promise<Record<string, unknown>>} 更新后的组织安全 DTO。
 * @throws {Error} 节点不存在、输入无效或权限不足时抛出统一错误。
 */
export const updateOrganization = (organizationId, payload) =>
  request({ method: "put", url: `/organization/nodes/${encodeURIComponent(organizationId)}`, data: payload });

/**
 * 删除没有子节点且没有成员引用的空组织；前端必须先要求管理员二次确认。
 * @param {string} organizationId 需要删除的组织 objectId。
 * @returns {Promise<void>} BFF 删除成功后兑现。
 * @throws {Error} 组织仍被使用、会话失效或权限不足时抛出统一错误。
 */
export const deleteOrganization = (organizationId) =>
  request({ method: "delete", url: `/organization/nodes/${encodeURIComponent(organizationId)}` });

/**
 * 创建普通成员或子管理员账号，并由服务器绑定单个岗位、多个关联组织和多个组织数据权限。
 * @param {{username: string, password: string, name?: string, nickname?: string, email?: string, roleId?: string | null, organizationIds: string[], scopeIds: string[], organizationAdmin: boolean}} payload 成员账号与授权范围数据。
 * @returns {Promise<Record<string, unknown>>} 不含密码和会话凭据的新建成员 DTO。
 * @throws {Error} 账号、密码、角色或组织范围校验失败时抛出统一错误。
 */
export const createOrganizationMember = (payload) => request({ method: "post", url: "/organization/members", data: payload });

/**
 * 更新成员资料、单个岗位、多个关联组织、组织数据权限、账号状态或密码；未提供的字段保持原值。
 * @param {string} userId 需要更新的成员 objectId。
 * @param {Record<string, unknown>} payload 成员编辑表单数据。
 * @returns {Promise<Record<string, unknown>>} 更新后的脱敏成员 DTO。
 * @throws {Error} 不能停用自己、跨企业账号或输入非法时抛出统一错误。
 */
export const updateOrganizationMember = (userId, payload) =>
  request({ method: "put", url: `/organization/members/${encodeURIComponent(userId)}`, data: payload });
