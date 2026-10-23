<template>
  <section class="video-tile" :aria-label="device ? `${device.name}画面` : `空画面${index + 1}`">
    <header class="video-tile__header"><strong>{{ index + 1 }} · {{ device?.name || '未选择设备' }}</strong><div class="video-tile__buttons"><el-button v-if="device" link :aria-label="`重连${device.name}`" @click.stop="manualRetry">重连</el-button><el-button v-if="device" link :aria-label="`放大${device.name}`" @click.stop="emit('maximize')">放大</el-button><el-button v-if="device" link :aria-label="`移除${device.name}画面`" @click.stop="emit('remove')">移除</el-button></div></header>
    <div class="video-tile__body">
      <CameraPlayer v-if="source" :source="source" compact @status="playerStatus" />
      <div v-else class="video-tile__placeholder"><el-icon :size="28"><VideoCamera /></el-icon><span>{{ message }}</span><el-button v-if="error && device && !paused" size="small" @click.stop="manualRetry">重新连接</el-button></div>
    </div>
    <footer class="video-tile__footer"><span :class="{ 'video-tile__status--error': error }">{{ statusText }}</span><span v-if="device">{{ device.organization_name || '未分配组织' }}</span></footer>
  </section>
</template>

<script setup>
import { VideoCamera } from "@element-plus/icons-vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import CameraPlayer from "@/components/camera/CameraPlayer.vue";
import { cameraRequest } from "@/service/camera.service";
import { enqueuePreview } from "@/service/camera-preview-queue";
import { registerStream, unregisterStream } from "@/service/camera-stream-lifecycle";

const props = defineProps({ device: { type: Object, default: null }, index: { type: Number, default: 0 }, paused: { type: Boolean, default: false }, quality: { type: String, default: "fluent" } });
const emit = defineEmits(["status", "remove", "maximize"]);
const source = ref("");
const message = ref("选中此画面，再点击左侧设备播放");
const statusText = ref("空闲");
const error = ref(false);
let currentStream;
let version = 0;
let retryCount = 0;
let retryTimer;
let destroyed = false;
let unloading = false;

/**
 * 上报画面状态给中心汇总。
 * @param {string} state 必填，idle/queued/loading/playing/paused/error。
 * @param {string} text 必填，用户可读状态。
 * @returns {void} 更新本画面状态并发出 status 事件，不包含设备密码。
 */
function state(state, text) { statusText.value = text; emit("status", { index: props.index, state, message: text }); }

/**
 * 释放指定的后端流，不需要当前组织读取权限也应允许关闭自己原来创建的任务。
 * @param {object} stream 必填，cameraId/id。
 * @returns {Promise<void>} 关闭后台任务；已过期、已撤权视为释放完成，其余错误显示在画面中，后端仍会超时回收。
 */
async function releaseStream(stream) {
  try {
    if (unloading) return; // 整页离开由统一的单次keepalive批量释放，避免浏览器并发限额丢请求。
    await cameraRequest("delete", `/${stream.cameraId}/streams/${stream.id}`);
    unregisterStream(stream.id);
  }
  catch (failure) { if ([401, 403, 404].includes(failure.status)) unregisterStream(stream.id); else if (!destroyed) { message.value = `连接释放失败：${failure.message}`; error.value = true; } }
}

/** 无参数；返回 Promise<void>，取消排队/重试并释放当前流，旧请求返回时会被版本检查清理。 */
async function stop() {
  version += 1; clearTimeout(retryTimer); retryTimer = null; source.value = "";
  const stream = currentStream; currentStream = null;
  if (stream) await releaseStream(stream);
}

/**
 * 启动画面任务，最多四条并行，主动关闭或切换设备后不再启动已过期任务。
 * @param {number} ownVersion 必填，此次连接代次。
 * @param {object} device 必填，启动时的设备快照。
 * @returns {Promise<void>} 创建用户绑定的 HLS 流并加载；故障可有界重试。
 */
async function connect(ownVersion, device) {
  try {
    await enqueuePreview(async () => {
      if (destroyed || ownVersion !== version || props.paused) return;
      state("loading", "正在连接"); message.value = "正在建立本地视频连接…";
      const stream = await cameraRequest("post", `/${device.id}/streams`, { mode: "live", quality: props.quality });
      if (destroyed || ownVersion !== version || props.paused) { await releaseStream({ id: stream.id, cameraId: device.id }); return; }
      currentStream = { id: stream.id, cameraId: device.id };
      registerStream(currentStream);
      source.value = stream.url;
    });
  } catch (failure) { if (!destroyed && ownVersion === version) fail(failure.message, ![401, 403, 404, 429].includes(failure.status)); }
}

/**
 * 显示错误并至多重试三次，权限撤销和资源上限错误不自动持续重试。
 * @param {string} text 必填，安全错误提示。
 * @param {boolean} [retry=true] 可选，是否允许自动重试。
 * @returns {void} 更新画面状态并调度 2/4/8 秒重试，不吞掉最终错误。
 */
function fail(text, retry = true) {
  if (error.value && retryTimer) return;
  error.value = true; message.value = text; state("error", text);
  if (retry && retryCount < 3 && !props.paused && !destroyed) {
    const timeout = 2000 * (2 ** retryCount); retryCount += 1;
    clearTimeout(retryTimer);
    state("error", `${text}；${timeout / 1000} 秒后重试（${retryCount}/3）`);
    retryTimer = setTimeout(restart, timeout);
  }
}

/** 无参数；返回 Promise<void>，保留重试计数重建当前设备连接，暂停和空槽不发请求。 */
async function restart() {
  const own = version + 1;
  await stop();
  if (destroyed || own !== version) return;
  error.value = false;
  if (!props.device) { message.value = "选中此画面，再点击左侧设备播放"; state("idle", "空闲"); return; }
  if (props.paused) { message.value = "画面已暂停，可点击全部播放恢复"; state("paused", "已暂停"); return; }
  message.value = "等待视频连接队列…"; state("queued", "排队中");
  await connect(own, props.device);
}
/** 无参数；返回 Promise<void>，用户明确重试时清零自动重试计数。 */
async function manualRetry() { retryCount = 0; await restart(); }
/**
 * 接收解码器状态，HLS 致命错误触发有界重试。
 * @param {string} value 必填，loading/playing/error/idle。
 * @returns {void} 更新汇总状态，实际画面开始播放后清除错误。
 */
function playerStatus(value) { if (value === "playing") { error.value = false; state("playing", "正在播放"); } else if (value === "error" || value === "ended") fail("视频中断或会话到期"); else if (value === "buffering" && !error.value) state("loading", "视频缓冲中"); }
/** 无参数；返回 Promise<void>，切换设备、质量或暂停状态时重置重试并释放旧流。 */
async function change() { retryCount = 0; await restart(); }
/** 无参数；返回 void，组件卸载立即取消队列任务和定时器，并异步清理正在运行的流。 */
function dispose() { destroyed = true; stop(); window.removeEventListener("pagehide", pageHidden); }
/** 无参数；返回 void，整页导航/刷新时以带CSRF的keepalive请求释放任务，不依赖Vue卸载钩子。 */
function pageHidden() { unloading = true; destroyed = true; stop(); }
/** 无参数；返回 void，安装整页离开监听，与组件生命周期共同覆盖资源清理。 */
function mount() { window.addEventListener("pagehide", pageHidden); }
watch(() => [props.device?.id, props.paused, props.quality], change, { immediate: true });
onMounted(mount);
onBeforeUnmount(dispose);
</script>

<style lang="scss" scoped>
.video-tile {
  height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--app-surface); border-radius: var(--app-radius-sm);
  &__header { display: flex; gap: 4px; align-items: center; justify-content: space-between; padding: 4px 6px; min-height: 28px; border-bottom: 1px solid var(--app-border); strong { color: var(--app-ink); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } }
  &__buttons { display: flex; flex-shrink: 0; gap: 5px; .el-button { margin: 0; padding: 0; font-size: 11px; } }
  &__body { flex: 1; min-height: 0; background: var(--app-ink); }
  &__placeholder { height: 100%; min-height: 60px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px; padding: 6px; color: var(--app-primary-contrast); font-size: 12px; text-align: center; overflow: auto; }
  &__footer { display: flex; gap: 5px; justify-content: space-between; padding: 2px 6px; color: var(--app-muted); font-size: 11px; > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } }
  &__status--error { color: var(--app-danger); }
}
</style>
