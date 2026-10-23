/** 同一浏览器最多并行启动四条 RTSP 拉流，避免十六屏同时占满 HTTP 连接与转码启动 CPU。 */
const waiting = [];
let running = 0;

/**
 * 调度下一项媒体启动任务，任务终结后继续，不阻塞已经播放的 HLS 请求。
 * @returns {void} 更新内存队列，不保存设备信息。
 */
function pump() {
  while (running < 4 && waiting.length) {
    const task = waiting.shift();
    running += 1;
    Promise.resolve().then(task.work).then(task.resolve, task.reject).finally(() => { running -= 1; pump(); });
  }
}

/**
 * 将可取消检查的启动函数加入浏览器队列；调用方须在 work 内检查画面代次，防止已关闭槽位重新启动。
 * @param {()=>Promise<unknown>} work 必填，带版本检查的媒体启动处理器。
 * @returns {Promise<unknown>} 启动结果或原始接口错误，不吞掉失败。
 */
export function enqueuePreview(work) { return new Promise((resolve, reject) => { waiting.push({ work, resolve, reject }); pump(); }); }
