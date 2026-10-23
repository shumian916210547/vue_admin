import { request } from "@/service/api-client";

/**
 * 调用受会话、CSRF 与租户保护的摄像头 API，所有设备密码只在保存请求中传给 BFF。
 * @param {string} method 必填，get/post/put/delete。
 * @param {string} [suffix=""] 可选，服务代码拼接的设备 UUID 和子资源路径，不接受设备 URL。
 * @param {object} [data] 可选，设备表单/回放区间/封面 JSON。
 * @returns {Promise<unknown>} BFF data 字段；失败抛统一 API 错误，媒体创建允许 45 秒超时。
 */
export const cameraRequest = (method, suffix = "", data) => request({ method, url: `/cameras${suffix}`, data, timeout: 45000 });

/**
 * 生成受鉴权的同源封面地址；只支持默认同源 /api 部署。
 * @param {object} camera 必填，id/updated_at/has_cover 设备摘要。
 * @returns {string} 封面 URL，未设置返回空字符串；不访问设备。
 */
export const cameraCover = (camera) => camera.has_cover ? `/api/cameras/${encodeURIComponent(camera.id)}/cover?v=${encodeURIComponent(camera.updated_at)}` : "";
