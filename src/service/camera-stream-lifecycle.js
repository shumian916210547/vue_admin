import { getCsrfToken } from "@/service/api-client";

/** 当前页面已创建的视频墙流；仅存内存中的随机会话ID和设备ID，不保存播放URL或密码。 */
const streams = new Map();

/**
 * 登记已创建的画面，整页刷新时通过一次keepalive请求释放全部流，避免浏览器丢弃十六个离页请求。
 * @param {{id:string,cameraId:string}} stream 必填，当前用户的媒体会话。
 * @returns {void} 更新本页内存注册表。
 */
export function registerStream(stream) { streams.set(stream.id, stream); }
/** @param {string} id 必填，已正常关闭的流ID。 @returns {void} 移除本页资源记录。 */
export function unregisterStream(id) { streams.delete(id); }

/**
 * 页面离开时批量释放媒体，失败交由服务器90秒闲置回收；请求始终携带会话与CSRF。
 * @returns {void} 发出一个小于64KiB的keepalive请求，不阻止页面离开。
 */
function pageHidden() {
  if (!streams.size) return;
  const owned = [...streams.values()]; streams.clear();
  fetch("/api/camera-workspace/streams/close", { method: "POST", credentials: "same-origin", keepalive: true, headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() || "" }, body: JSON.stringify({ streams: owned }) }).then(
    /** @param {Response} response 必填，关闭请求结果。 @returns {void} 失败时重新登记，供bfcache恢复后的下次离页重试。 */
    (response) => { if (!response.ok) for (const stream of owned) streams.set(stream.id, stream); },
    /** @param {Error} error 必填，页面离开导致的网络失败。 @returns {void} 保留资源记录以便可恢复页面重试，服务端另有闲置回收。 */
    (error) => { for (const stream of owned) streams.set(stream.id, stream); }
  );
}

if (typeof window !== "undefined") window.addEventListener("pagehide", pageHidden);
