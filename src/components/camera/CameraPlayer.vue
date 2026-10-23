<template>
  <div class="camera-player" :class="{ 'camera-player--compact': compact }" :aria-busy="loading">
    <video ref="video" class="camera-player__video" controls autoplay muted playsinline preload="metadata" @error="handleVideoError" @playing="handlePlaying" @waiting="handleWaiting" @ended="handleEnded" />
    <p v-if="loading" role="status">正在连接媒体流…</p>
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />
  </div>
</template>

<script setup>
import Hls from "hls.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({ source: { type: String, default: "" }, compact: { type: Boolean, default: false } });
const emit = defineEmits(["status"]);
const video = ref(null);
const error = ref("");
const loading = ref(false);
let hls;

/**
 * 清理播放器及网络请求，无参数。
 * @returns {void} 停止 HLS 加载与 video 缓冲；后端会话由父页面关闭。
 */
function release() {
  hls?.destroy();
  hls = null;
  if (video.value) { video.value.pause(); video.value.removeAttribute("src"); video.value.load(); }
}

/**
 * 加载同源服务器 MP4 或 HLS，使用 MSE 兼容 Chrome/Edge，Safari 优先原生 HLS。
 * @returns {void} 重置加载/错误状态并发起媒体请求；浏览器不支持时显示中文提示。
 */
function load() {
  release();
  error.value = "";
  loading.value = Boolean(props.source);
  emit("status", props.source ? "loading" : "idle");
  if (!video.value || !props.source) return;
  if (!props.source.startsWith("/api/cameras/")) { error.value = "媒体地址无效"; loading.value = false; return; }
  const isHls = props.source.endsWith(".m3u8");
  // 优先使用可控的 MSE/HLS.js，避免部分 Edge 版本声明原生 HLS 支持但多实例解码失败。
  if (isHls && Hls.isSupported()) {
    hls = new Hls({ maxBufferLength: 20, backBufferLength: 30 });
    hls.on(Hls.Events.ERROR,
      /**
       * 将 HLS 致命错误反馈到页面，不暴露协议内部信息。
       * @param {string} event 必填，HLS 事件名。
       * @param {object} data 必填，含 fatal 标志的 HLS 错误。
       * @returns {void} 错误时停止网络请求并更新提示。
       */
      (event, data) => { if (data.fatal) { error.value = "视频连接已中断或会话已失效，请关闭后重新播放"; loading.value = false; hls?.stopLoad(); emit("status", "error"); } }
    );
    hls.loadSource(props.source);
    hls.attachMedia(video.value);
  } else if (!isHls || video.value.canPlayType("application/vnd.apple.mpegurl")) video.value.src = props.source;
  else { error.value = "当前浏览器不支持 HLS，请使用新版 Chrome、Edge 或 Safari"; loading.value = false; emit("status", "error"); }
}

/** 无参数；画面开始播放时清除加载提示，返回 void，无网络写入。 */
function handlePlaying() { loading.value = false; emit("status", "playing"); }
/** 无参数；返回 void，缓冲期间通知多画面中心，不把缓冲误显示为正常播放。 */
function handleWaiting() { if (props.source) emit("status", "buffering"); }
/** 无参数；返回 void，直播结束交由画面进行有界重连，MP4/设备回放正常结束无需错误通知。 */
function handleEnded() { loading.value = false; emit("status", "ended"); }
/** 无参数；媒体解码/权限故障时显示中文提示，返回 void，不吞掉失败状态。 */
function handleVideoError() { if (props.source && video.value?.error && video.value?.getAttribute("src")) { error.value = "视频无法播放，请检查录像是否仍存在、会话权限及浏览器解码支持"; loading.value = false; emit("status", "error"); } }

watch(() => props.source, load);
onMounted(load);
onBeforeUnmount(release);
</script>

<style lang="scss" scoped>
.camera-player {
  display: grid;
  gap: var(--app-space-sm);
  &__video { width: 100%; max-height: 65vh; min-height: 180px; background: var(--app-ink); border-radius: var(--app-radius); }
  p { color: var(--app-muted); margin: 0; }
  &--compact { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 2px; .camera-player__video { flex: 1; min-height: 0; height: 100%; max-height: none; object-fit: contain; } p { font-size: 11px; } :deep(.el-alert) { padding: 3px 6px; } }
}
</style>
