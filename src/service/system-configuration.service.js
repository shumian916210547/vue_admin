import { request } from "@/service/api-client";

/**
 * 为当前系统管理员所在企业补齐 Module、Route、Schema 等缺失基础配置。
 * @returns {Promise<{created: string[], updated: string[]}>} 本次新建或补齐配置的摘要。
 * @throws {Error} 非系统管理员、CSRF 校验失败或服务端配置修复失败时抛出统一错误。
 */
export const ensureSystemConfiguration = () =>
  request({ method: "post", url: "/system/ensure-configuration" });
