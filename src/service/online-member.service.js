import { request } from "./api-client";

/**
 * 读取当前企业仍有有效管理端会话的在线成员设备列表。
 * @returns {Promise<{sessions: Array<Record<string, unknown>>, count: number}>} 脱敏在线会话数据；不含 JWT 或内部 sessionId。
 * @throws {Error} 会话失效、权限不足或 BFF 请求失败时抛出统一错误。
 */
export const getOnlineMemberSessions = () => request({ method: "get", url: "/online-members" });

/**
 * 撤销目标成员的全部管理端会话，使其下一次 API 请求立即失效。
 * @param {string} userId 目标成员 objectId。
 * @returns {Promise<{userId: string, revokedCount: number}>} 被撤销的会话数量。
 * @throws {Error} CSRF、权限或目标成员校验失败时抛出统一错误。
 */
export const forceLogoutOnlineMember = (userId) =>
  request({
    method: "post",
    url: `/online-members/${encodeURIComponent(userId)}/force-logout`,
  });

/**
 * 冻结目标成员并撤销其所有在线会话。
 * @param {string} userId 目标成员 objectId。
 * @param {number} durationMinutes 冻结时长，单位为分钟。
 * @returns {Promise<{userId: string, frozenUntil: string}>} 冻结截止时间。
 * @throws {Error} CSRF、权限或冻结时长校验失败时抛出统一错误。
 */
export const freezeOnlineMember = (userId, durationMinutes) =>
  request({
    method: "post",
    url: `/online-members/${encodeURIComponent(userId)}/freeze`,
    data: { durationMinutes },
  });
