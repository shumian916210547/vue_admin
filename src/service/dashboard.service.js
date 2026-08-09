import { request } from "./api-client";

/**
 * 获取当前登录用户的仪表盘统计数据。
 * @returns {Promise<{totalLogins: number, loginToday: number, activeDaysLast30: number, consecutiveActiveDays: number, currentSessionStartedAt: string | null, lastLoginAt: string | null, weeklyActivity: Array<{date: string, label: string, count: number}>}>} 由 BFF 按当前会话和租户范围生成的只读概览。
 * @throws {Error} 会话失效、网络异常或服务端统计不可用时抛出标准化错误。
 */
export const getDashboardOverview = () => request({ method: "get", url: "/dashboard/overview" });
