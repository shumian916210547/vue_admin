import api, { request } from "@/service/api-client";

/**
 * 查询当前登录成员可见的协同文档，并由 BFF 负责 Company、组织和文档 ACL 过滤。
 * @param {{page?: number, pageSize?: number, keyword?: string, status?: string}} query 文档列表筛选与分页参数。
 * @returns {Promise<{documents: Array<Record<string, unknown>>, count: number, page: number, pageSize: number}>} 文档列表和分页信息。
 * @throws {Error} 页面权限、会话或 BFF 数据库状态异常时抛出统一 API 错误。
 */
export const getCollabDocuments = (query) =>
  request({ method: "get", url: "/collab/documents", params: query });

/**
 * 创建一个默认指定成员访问、禁止下载且未设置文档级容量上限的空白工作簿。
 * @param {{name: string, accessMode?: "members" | "company_public", organizationId?: string | null, allowDownload?: boolean, storageLimit?: {value: number, unit: "KB" | "MB" | "GB"} | null}} payload 文档业务字段；租户和 owner 不由前端传入。
 * @returns {Promise<Record<string, unknown>>} 新建文档安全 DTO。
 * @throws {Error} CSRF、页面权限、组织范围或存储失败时抛出。
 */
export const createCollabDocument = (payload) =>
  request({ method: "post", url: "/collab/documents", data: payload });

/**
 * 获取当前用户可访问的文档详情和权限摘要。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<Record<string, unknown>>} 文档安全 DTO。
 * @throws {Error} 文档不存在、跨租户或 ACL 不满足时抛出。
 */
export const getCollabDocument = (documentId) =>
  request({ method: "get", url: `/collab/documents/${encodeURIComponent(documentId)}` });

/**
 * 修改文档名称、归档状态、下载总开关或文档容量上限。
 * @param {string} documentId 文档 UUID。
 * @param {{name?: string, status?: "active" | "archived", allowDownload?: boolean, storageLimit?: {value: number, unit: "KB" | "MB" | "GB"} | null}} payload 可修改业务字段。
 * @returns {Promise<Record<string, unknown>>} 更新后的文档安全 DTO。
 * @throws {Error} CSRF、文档编辑/分享权限或输入校验失败时抛出。
 */
export const updateCollabDocument = (documentId, payload) =>
  request({ method: "patch", url: `/collab/documents/${encodeURIComponent(documentId)}`, data: payload });

/**
 * 软删除文档；对象文件和版本在服务端保留给恢复窗口使用。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<void>} BFF 返回 204 后兑现。
 * @throws {Error} CSRF、owner 权限或文档状态校验失败时抛出。
 */
export const deleteCollabDocument = (documentId) =>
  request({ method: "delete", url: `/collab/documents/${encodeURIComponent(documentId)}` });

/**
 * 恢复一份软删除文档。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<Record<string, unknown>>} 恢复后的文档安全 DTO。
 * @throws {Error} CSRF、恢复权限或文档状态冲突时抛出。
 */
export const restoreCollabDocument = (documentId) =>
  request({ method: "post", url: `/collab/documents/${encodeURIComponent(documentId)}/restore` });

/**
 * 请求编辑器初始化配置；未配置 ONLYOFFICE 时返回 available=false 的明确降级状态。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<{document: Record<string, unknown>, editor: Record<string, unknown>}>} 文档权限与编辑器配置。
 * @throws {Error} 文档 ACL、服务状态或会话失效时抛出。
 */
export const getCollabEditorConfig = (documentId) =>
  request({ method: "get", url: `/collab/documents/${encodeURIComponent(documentId)}/editor-config` });

/**
 * 将用户选择的 xlsx/csv 文件导入当前文档。
 * @param {string} documentId 文档 UUID。
 * @param {File} file 浏览器文件对象；服务端会再次校验 MIME、文件头和压缩包内容。
 * @returns {Promise<Record<string, unknown>>} 导入后的文档安全 DTO。
 * @throws {Error} CSRF、文件安全检查、编辑权限或版本保存失败时抛出。
 */
export const importCollabDocument = (documentId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request({
    method: "post",
    url: `/collab/documents/${encodeURIComponent(documentId)}/import`,
    data: formData,
  });
};

/**
 * 下载当前用户被明确授予导出权限的工作簿，并在浏览器中触发一次本地保存。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<string>} 服务端返回的建议文件名；下载失败时由 API 层抛出错误。
 * @throws {Error} 页面 export 权限、文档下载 ACL 或文件状态不满足时抛出。
 */
export const exportCollabDocument = async (documentId) => {
  const response = await api.get(`/collab/documents/${encodeURIComponent(documentId)}/export`, {
    responseType: "blob",
  });
  const contentDisposition = String(response.headers["content-disposition"] || "");
  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const fallbackName = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = encodedName ? decodeURIComponent(encodedName) : fallbackName || "协同工作簿.xlsx";
  const objectUrl = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  return fileName;
};

/**
 * 查询当前用户有权查看的文档修改记录；记录由服务端审计表分页返回，包含 Office 自动保存和管理操作。
 * @param {string} documentId 文档 UUID。
 * @param {{page?: number, pageSize?: number}} [query] 修改记录分页参数。
 * @returns {Promise<{documentId: string, events: Array<Record<string, unknown>>, count: number, page: number, pageSize: number}>} 修改记录分页结果。
 * @throws {Error} 页面历史权限、文档 ACL 或 BFF 请求失败时抛出。
 */
export const getCollabDocumentActivity = (documentId, query) =>
  request({
    method: "get",
    url: `/collab/documents/${encodeURIComponent(documentId)}/activity`,
    params: query,
  });

/**
 * 查询文档成员 ACL 和当前 accessVersion。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<{documentId: string, accessVersion: number, accessMode: "members" | "company_public", organizationId: string | null, allowDownload: boolean, storageLimitBytes: number | null, members: Array<Record<string, unknown>>}>} 分享配置、文档级下载设置和容量上限。
 * @throws {Error} 无分享权限、会话失效或请求失败时抛出。
 */
export const getCollabDocumentMembers = (documentId) =>
  request({ method: "get", url: `/collab/documents/${encodeURIComponent(documentId)}/members` });

/**
 * 查询可分享的同 Company 有效成员选项。
 * @param {string} documentId 文档 UUID。
 * @param {string} [keyword] 可选姓名或账号关键词。
 * @returns {Promise<Array<{userId: string, username: string, name: string, email: string}>>} 脱敏成员选项。
 * @throws {Error} 无分享权限、组织范围或请求失败时抛出。
 */
export const getCollabMemberOptions = (documentId, keyword = "") =>
  request({
    method: "get",
    url: `/collab/documents/${encodeURIComponent(documentId)}/member-options`,
    params: { keyword },
  });

/**
 * 切换文档访问模式，并用服务端返回的 accessVersion 完成乐观锁更新。
 * @param {string} documentId 文档 UUID。
 * @param {{accessMode: "members" | "company_public", organizationId?: string | null, expectedAccessVersion: number}} payload 访问模式和乐观锁版本。
 * @returns {Promise<Record<string, unknown>>} 更新后的文档安全 DTO。
 * @throws {Error} CSRF、分享权限、组织范围或版本冲突时抛出。
 */
export const updateCollabAccess = (documentId, payload) =>
  request({ method: "patch", url: `/collab/documents/${encodeURIComponent(documentId)}/access`, data: payload });

/**
 * 批量保存文档成员角色和下载权限。
 * @param {string} documentId 文档 UUID。
 * @param {{expectedAccessVersion: number, members: Array<{userId: string, role: "editor" | "commenter" | "viewer", canDownload: boolean}>}} payload 成员 ACL 和乐观锁版本。
 * @returns {Promise<{documentId: string, accessVersion: number, members: Array<Record<string, unknown>>}>} 更新后的 ACL。
 * @throws {Error} CSRF、成员跨租户/组织、角色或版本校验失败时抛出。
 */
export const saveCollabDocumentMembers = (documentId, payload) =>
  request({ method: "put", url: `/collab/documents/${encodeURIComponent(documentId)}/members`, data: payload });

/**
 * 将工作簿所有权转移给当前 Company 内的有效成员，并使用 accessVersion 防止并发权限覆盖。
 * @param {string} documentId 文档 UUID。
 * @param {{newOwnerUserId: string, expectedAccessVersion: number}} payload 新所有者 objectId 和当前乐观锁版本。
 * @returns {Promise<Record<string, unknown>>} 转移后的文档安全 DTO。
 * @throws {Error} CSRF、分享权限、成员组织范围或版本冲突时抛出。
 */
export const transferCollabDocumentOwnership = (documentId, payload) =>
  request({
    method: "post",
    url: `/collab/documents/${encodeURIComponent(documentId)}/transfer-ownership`,
    data: payload,
  });

/**
 * 撤销指定文档成员的 active 访问权。
 * @param {string} documentId 文档 UUID。
 * @param {string} userId 成员 objectId。
 * @returns {Promise<{documentId: string, userId: string, accessVersion: number}>} 撤销结果。
 * @throws {Error} CSRF、owner 保护或成员不存在时抛出。
 */
export const removeCollabDocumentMember = (documentId, userId) =>
  request({
    method: "delete",
    url: `/collab/documents/${encodeURIComponent(documentId)}/members/${encodeURIComponent(userId)}`,
  });

/**
 * 查询文档版本历史。
 * @param {string} documentId 文档 UUID。
 * @returns {Promise<{documentId: string, currentVersionId: string | null, currentRevision: number, versions: Array<Record<string, unknown>>}>} 版本列表。
 * @throws {Error} 页面 history 权限或文档 ACL 校验失败时抛出。
 */
export const getCollabDocumentVersions = (documentId) =>
  request({ method: "get", url: `/collab/documents/${encodeURIComponent(documentId)}/versions` });

/**
 * 为当前工作簿创建命名版本。
 * @param {string} documentId 文档 UUID。
 * @param {string} label 版本名称。
 * @returns {Promise<Record<string, unknown>>} 新版本 DTO。
 * @throws {Error} CSRF、编辑权限或版本名称校验失败时抛出。
 */
export const createCollabDocumentVersion = (documentId, label) =>
  request({ method: "post", url: `/collab/documents/${encodeURIComponent(documentId)}/versions`, data: { label } });

/**
 * 从历史版本创建新的恢复版本。
 * @param {string} documentId 文档 UUID。
 * @param {string} versionId 历史版本 UUID。
 * @returns {Promise<{document: Record<string, unknown>, version: Record<string, unknown>}>} 恢复后的文档和新版本。
 * @throws {Error} CSRF、编辑权限、版本不存在或状态冲突时抛出。
 */
export const restoreCollabDocumentVersion = (documentId, versionId) =>
  request({
    method: "post",
    url: `/collab/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}/restore`,
  });
