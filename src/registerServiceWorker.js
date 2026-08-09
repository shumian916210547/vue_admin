import { register } from "register-service-worker";

/**
 * 广播可用的新版本，由已经挂载的应用统一决定如何提醒用户刷新，避免在生产控制台输出调试日志。
 * @returns {void} 在浏览器支持事件机制时派发版本更新事件。
 */
const announceServiceWorkerUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("shumian-service-worker-updated"));
};

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    updated: announceServiceWorkerUpdate,
  });
}
