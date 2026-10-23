<template>
  <section ref="center" class="video-center" :aria-busy="loading">
    <header class="video-center__heading"><div><span class="video-center__eyebrow">摄像头管理</span><h1>视频中心</h1><p>按公司、组织和门店选择设备，支持 1–16 分屏与个人监控视图。</p></div><el-button :loading="loading" @click="reload">刷新设备</el-button></header>
    <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" />
    <div class="video-center__workspace">
      <aside class="video-center__sidebar">
        <section class="video-center__organizations"><header><strong>组织树</strong><el-button link @click="selectAllOrganizations">全部组织</el-button></header><OrganizationTree :data="tree" :selected="selectedOrganization" @select="selectOrganization" /></section>
        <section class="video-center__devices"><header><strong>{{ selectedName }} · {{ filteredDevices.length }} 台</strong><el-checkbox v-model="includeDescendants">含下级</el-checkbox></header><el-input v-model="keyword" clearable placeholder="搜索设备名称、IP" aria-label="搜索视频中心设备" /><div class="video-center__device-list app-scrollbar"><button v-for="device in filteredDevices" :key="device.id" type="button" class="video-center__device" :class="{ 'video-center__device--playing': assignedIds.has(device.id) }" :aria-label="`播放${device.name}`" draggable="true" @dragstart="dragDevice($event, device)" @click="placeDevice(device)"><el-icon><VideoCamera /></el-icon><span><strong>{{ device.name }}</strong><small>{{ device.organization_name || '未分配组织' }} · {{ device.host }}</small></span><el-tag v-if="assignedIds.has(device.id)" size="small">已选</el-tag></button><el-empty v-if="!filteredDevices.length" :image-size="48" description="当前组织没有可见设备" /></div><el-button type="primary" :disabled="!filteredDevices.length" @click="playOrganization">播放当前组织</el-button></section>
      </aside>
      <main class="video-center__main">
        <div class="video-center__toolbar">
          <div class="video-center__controls"><label for="camera-screen-count">分屏</label><el-select id="camera-screen-count" :model-value="screenCount" aria-label="视频分屏数量" @change="changeScreens"><el-option v-for="count in 16" :key="count" :label="`${count} 分屏`" :value="count" /></el-select><el-select v-model="quality" aria-label="视频输出质量"><el-option label="流畅 · 640px" value="fluent" /><el-option label="标准 · 1280px" value="standard" /></el-select><el-button @click="togglePause">{{ paused ? '全部播放' : '全部暂停' }}</el-button><el-button @click="clearScreens">清空画面</el-button><el-button @click="toggleFullscreen">{{ fullscreen ? '退出全屏' : '中心全屏' }}</el-button><el-button v-if="focused !== null" type="primary" @click="focused = null">返回多画面</el-button></div>
          <div class="video-center__controls"><el-select v-model="selectedView" clearable placeholder="选择个人监控视图" aria-label="个人监控视图" @change="restoreView"><el-option v-for="view in views" :key="view.id" :label="`${view.name} · ${view.screens}屏`" :value="view.id" /></el-select><el-button :loading="savingView" @click="saveCurrentView">保存视图</el-button><el-button :disabled="!selectedView" @click="removeCurrentView">删除视图</el-button></div>
        </div>
        <div class="video-center__summary" role="status"><span>正在播放 {{ playingCount }} / {{ screenCount }} 屏 · {{ pendingCount }} 屏连接中 · {{ failedCount }} 屏异常</span><span>选中第 {{ selectedSlot + 1 }} 屏后点击设备，或拖入目标画面</span></div>
        <div ref="wall" class="video-center__wall" :class="[`video-center__wall--${screenCount}`, { 'video-center__wall--focus': focused !== null }]" :style="gridStyle" aria-label="多画面视频墙">
          <div v-for="(deviceId, index) in visibleSlots" :key="index" class="video-center__slot" :class="{ 'video-center__slot--selected': selectedSlot === index, 'video-center__slot--hidden': focused !== null && focused !== index }" role="group" :aria-label="`第${index + 1}画面${selectedSlot === index ? '，已选中' : ''}`" tabindex="0" @click="selectSlot(index)" @keydown.enter="selectSlot(index)" @dblclick="maximize(index)" @dragover.prevent @drop.prevent="dropDevice($event, index)"><VideoTile :device="deviceById.get(deviceId) || null" :index="index" :paused="paused" :quality="quality" @status="updateStatus" @remove="removeSlot(index)" @maximize="maximize(index)" /></div>
        </div>
        <p class="video-center__hint">多画面预览有数秒缓冲，流畅档适合分屏；断线最多自动重试三次。离开视频中心会释放全部连接。录像及 SD 卡 / NVR 回放可在设备管理中打开。</p>
      </main>
    </div>
  </section>
</template>

<script setup>
import { VideoCamera } from "@element-plus/icons-vue";
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref } from "vue";
import OrganizationTree from "@/components/camera/OrganizationTree.vue";
import VideoTile from "@/components/camera/VideoTile.vue";
import { cameraRequest } from "@/service/camera.service";
import { organizationIds, workspaceRequest } from "@/service/camera-workspace.service";

const loading = ref(false);
const loadError = ref("");
const tree = ref([]);
const organizations = ref([]);
const devices = ref([]);
const selectedOrganization = ref("");
const includeDescendants = ref(true);
const keyword = ref("");
const screenCount = ref(4);
const slots = ref(Array(16).fill(null));
const selectedSlot = ref(0);
const quality = ref("fluent");
const paused = ref(false);
const focused = ref(null);
const center = ref(null);
const wall = ref(null);
const fullscreen = ref(false);
const statuses = reactive({});
const views = ref([]);
const selectedView = ref("");
const savingView = ref(false);
let loaded = false;
let version = 0;

const deviceById = computed(() => new Map(devices.value.map((device) => [device.id, device])));
const visibleSlots = computed(() => slots.value.slice(0, screenCount.value));
const assignedIds = computed(() => new Set(visibleSlots.value.filter(Boolean)));
const selectedName = computed(() => organizations.value.find((row) => row.id === selectedOrganization.value)?.name || "全部设备");
const filteredDevices = computed(() => {
  const ids = selectedOrganization.value ? organizationIds(organizations.value, selectedOrganization.value, includeDescendants.value) : null;
  const word = keyword.value.trim().toLowerCase();
  return devices.value.filter((device) => (!ids || ids.has(device.organization_id)) && (!word || `${device.name} ${device.host}`.toLowerCase().includes(word)));
});
/** CSS 自定义属性仅表达动态网格数量，颜色与尺寸基础令牌继续复用全局定义。 */
const gridStyle = computed(() => { const columns = Math.ceil(Math.sqrt(screenCount.value)); return { "--camera-columns": columns, "--camera-rows": Math.ceil(screenCount.value / columns) }; });
const playingCount = computed(() => visibleSlots.value.filter((id, index) => id && statuses[index]?.state === "playing").length);
const pendingCount = computed(() => visibleSlots.value.filter((id, index) => id && ["loading", "queued"].includes(statuses[index]?.state)).length);
const failedCount = computed(() => visibleSlots.value.filter((id, index) => id && statuses[index]?.state === "error").length);

/** @param {Error} error 必填，统一 API/浏览器错误。 @returns {void} 显示中文通知，不记录设备凭据。 */
function report(error) { ElNotification.error({ title: "视频中心操作失败", message: error.message }); }
/** 无参数；返回 Promise<void>，读取权限裁剪的组织、设备和个人视图；刷新会移除已失去权限的槽位。 */
async function reload() {
  const own = ++version; loading.value = true; loadError.value = "";
  try { const [overview, list, saved] = await Promise.all([workspaceRequest("get", "/overview"), cameraRequest("get"), workspaceRequest("get", "/views")]); if (own !== version) return; tree.value = overview.tree; organizations.value = overview.organizations; devices.value = list.devices; views.value = saved; const allowed = new Set(list.devices.map((device) => device.id)); slots.value = slots.value.map((id) => allowed.has(id) ? id : null); loaded = true; }
  catch (error) { if (own === version) { loadError.value = error.message; slots.value = Array(16).fill(null); report(error); } }
  finally { if (own === version) loading.value = false; }
}
/** @param {object} row 必填，选中组织节点。 @returns {void} 更新左下设备范围，不自动替换正在播放的画面。 */
function selectOrganization(row) { selectedOrganization.value = row.id; }
/** 无参数；返回 void，显示当前授权范围内所有设备。 */
function selectAllOrganizations() { selectedOrganization.value = ""; }
/** @param {number} index 必填，0至15画面序号。 @returns {void} 选择设备放置目标。 */
function selectSlot(index) { selectedSlot.value = index; }
/** @param {number} count 必填，1至16分屏数。 @returns {void} 缩减分屏自动卸载额外播放器，保留槽位分配供重新扩展。 */
function changeScreens(count) { screenCount.value = count; selectedSlot.value = Math.min(selectedSlot.value, count - 1); focused.value = null; for (const key of Object.keys(statuses)) if (Number(key) >= count) delete statuses[key]; }
/** @param {object} device 必填，已授权设备摘要。 @returns {void} 放入所选槽位并自动选择下一个空画面。 */
function placeDevice(device) { slots.value[selectedSlot.value] = device.id; delete statuses[selectedSlot.value]; paused.value = false; const next = slots.value.findIndex((id, index) => index < screenCount.value && !id); if (next >= 0) selectedSlot.value = next; }
/** @param {number} index 必填，画面序号。 @returns {void} 卸载该播放器并释放流，不修改设备信息。 */
function removeSlot(index) { slots.value[index] = null; delete statuses[index]; if (focused.value === index) focused.value = null; }
/** @param {number} index 必填，画面序号。 @returns {void} 切换单画面放大，其他流继续保持连接。 */
function maximize(index) { focused.value = focused.value === index ? null : index; }
/** 无参数；返回 void，填入当前组织前N台设备并开始播放，N为当前分屏数。 */
function playOrganization() { slots.value = Array.from({ length: 16 }, (_, index) => index < screenCount.value ? filteredDevices.value[index]?.id || null : null); for (const key of Object.keys(statuses)) delete statuses[key]; paused.value = false; selectedSlot.value = 0; }
/** 无参数；返回 void，暂停会释放媒体连接，恢复时重新进入有界启动队列。 */
function togglePause() { paused.value = !paused.value; }
/** 无参数；返回 Promise<void>，确认后清空当前所有槽位并停止连接；保存的个人视图保持不变。 */
async function clearScreens() { try { await ElMessageBox.confirm("确认清空当前全部画面并停止视频连接？设备资料和已保存视图保留。", "清空视频画面", { confirmButtonText: "确认清空", cancelButtonText: "取消", type: "warning" }); slots.value = Array(16).fill(null); for (const key of Object.keys(statuses)) delete statuses[key]; focused.value = null; } catch (error) { if (error !== "cancel" && error !== "close") report(error); } }
/** @param {object} payload 必填，index/state/message画面状态。 @returns {void} 汇总当前槽位的连接、播放和失败状态。 */
function updateStatus(payload) { if (payload.index < screenCount.value) statuses[payload.index] = payload; }
/** @param {DragEvent} event 必填，设备拖拽事件。 @param {object} device 必填，设备摘要。 @returns {void} 只写内部UUID，不传密码或视频URL。 */
function dragDevice(event, device) { event.dataTransfer.setData("application/x-camera-id", device.id); event.dataTransfer.effectAllowed = "copy"; }
/** @param {DragEvent} event 必填，目标槽位放置事件。 @param {number} index 必填，目标画面序号。 @returns {void} 仅允许当前可见设备放入画面。 */
function dropDevice(event, index) { const device = deviceById.value.get(event.dataTransfer.getData("application/x-camera-id")); if (device) { selectedSlot.value = index; placeDevice(device); } }
/** 无参数；返回 Promise<void>，使用用户手势进入或退出视频中心全屏，失败通知。 */
async function toggleFullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (center.value?.requestFullscreen) await center.value.requestFullscreen(); else throw new Error("当前浏览器不支持全屏，请使用新版 Chrome、Edge 或 Safari"); } catch (error) { report(error); } }
/** 无参数；返回 void，同步浏览器原生全屏状态。 */
function syncFullscreen() { fullscreen.value = document.fullscreenElement === center.value; }
/** @param {string} id 必填，个人视图UUID；空值只清除选择。 @returns {void} 恢复已按服务端权限裁剪的分屏和设备分配。 */
function restoreView(id) { const view = views.value.find((item) => item.id === id); if (!view) return; changeScreens(view.screens); slots.value = Array.from({ length: 16 }, (_, index) => deviceById.value.has(view.devices[index]) ? view.devices[index] : null); paused.value = false; }
/** 无参数；返回 Promise<void>，按名称保存个人视图，同名覆盖前中文确认，不保存媒体凭据。 */
async function saveCurrentView() {
  try {
    const result = await ElMessageBox.prompt("请输入监控视图名称，保存当前分屏与设备位置", "保存个人视图", { inputValue: views.value.find((item) => item.id === selectedView.value)?.name || "", inputPattern: /^\S.{0,99}$/, inputErrorMessage: "请输入 1 至 100 个字符的视图名称", confirmButtonText: "保存视图", cancelButtonText: "取消" });
    const name = result.value.trim();
    if (views.value.some((item) => item.name === name)) await ElMessageBox.confirm(`确认覆盖个人视图“${name}”？`, "覆盖监控视图", { confirmButtonText: "确认覆盖", cancelButtonText: "取消", type: "warning" });
    savingView.value = true;
    const saved = await workspaceRequest("post", "/views", { name, screens: screenCount.value, devices: visibleSlots.value }); views.value = await workspaceRequest("get", "/views"); selectedView.value = saved.id; ElNotification.success({ title: "监控视图已保存" });
  } catch (error) { if (error !== "cancel" && error !== "close") report(error); }
  finally { savingView.value = false; }
}
/** 无参数；返回 Promise<void>，确认后只删除当前用户所选视图。 */
async function removeCurrentView() { try { const view = views.value.find((item) => item.id === selectedView.value); if (!view) return; await ElMessageBox.confirm(`确认删除个人视图“${view.name}”？`, "删除监控视图", { confirmButtonText: "确认删除", cancelButtonText: "取消", type: "warning" }); await workspaceRequest("delete", `/views/${view.id}`); selectedView.value = ""; views.value = await workspaceRequest("get", "/views"); ElNotification.success({ title: "监控视图已删除" }); } catch (error) { if (error !== "cancel" && error !== "close") report(error); } }
/** 无参数；返回 void，离开缓存页立即清空设备槽位，触发所有播放器释放连接。 */
function leave() { version += 1; paused.value = true; slots.value = Array(16).fill(null); focused.value = null; if (document.fullscreenElement === center.value) document.exitFullscreen().catch(report); }
/** 无参数；返回 Promise<void>，首次挂载安装原生全屏监听并加载数据。 */
async function mount() { document.addEventListener("fullscreenchange", syncFullscreen); window.addEventListener("pagehide", leave); await reload(); }
/** 无参数；返回 void，缓存页再进入时刷新权限，不自动恢复离开前的视频连接。 */
function activate() { if (loaded) reload(); }
/** 无参数；返回 void，卸载时释放画面并移除全屏监听。 */
function dispose() { leave(); document.removeEventListener("fullscreenchange", syncFullscreen); window.removeEventListener("pagehide", leave); }
onMounted(mount);
onActivated(activate);
onDeactivated(leave);
onBeforeUnmount(dispose);
</script>

<style lang="scss" scoped>
.video-center {
  display: flex; flex-direction: column; gap: var(--app-space-sm); height: 100%; min-height: 0; padding: var(--app-space); background: var(--app-canvas); color: var(--app-text);
  &:fullscreen { overflow: auto; }
  &__heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--app-space-sm); h1 { margin: 2px 0; color: var(--app-ink); font-size: var(--app-page-title-size); } p { margin: 0; color: var(--app-muted); font-size: 12px; } }
  &__eyebrow { color: var(--app-primary); font-size: 11px; }
  &__workspace { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: var(--app-space); min-height: 0; flex: 1; }
  &__sidebar { display: grid; grid-template-rows: minmax(160px, 40%) minmax(220px, 1fr); gap: var(--app-space-sm); min-height: 0; }
  &__organizations, &__devices { min-height: 0; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: var(--app-radius); padding: var(--app-space-sm); display: flex; flex-direction: column; gap: var(--app-space-sm); > header { display: flex; align-items: center; gap: 4px; justify-content: space-between; font-size: 12px; } }
  &__organizations :deep(.camera-tree) { min-height: 0; flex: 1; }
  &__device-list { overflow: auto; min-height: 0; flex: 1; }
  &__device { width: 100%; border: 1px solid var(--app-border-soft); border-radius: var(--app-radius-xs); background: var(--app-surface); padding: 8px 6px; display: flex; align-items: center; gap: 6px; text-align: left; cursor: pointer; margin-bottom: 4px; color: var(--app-text); > span { min-width: 0; flex: 1; } strong, small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } strong { font-size: 12px; } small { font-size: 10px; color: var(--app-muted); margin-top: 3px; } &:hover, &--playing { border-color: var(--app-primary); background: var(--app-primary-soft); } }
  &__main { min-height: 0; min-width: 0; display: flex; flex-direction: column; gap: var(--app-space-sm); }
  &__toolbar, &__controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  &__toolbar { justify-content: space-between; }
  &__controls { .el-select { width: 145px; } .el-button + .el-button { margin-left: 0; } label { font-size: 12px; } }
  &__summary { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; color: var(--app-muted); font-size: 11px; }
  &__wall { flex: 1; min-height: 480px; display: grid; gap: 6px; grid-template-columns: repeat(var(--camera-columns), minmax(0, 1fr)); grid-template-rows: repeat(var(--camera-rows), minmax(0, 1fr)); }
  &__wall--focus { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
  &__slot { min-width: 0; min-height: 0; border: 2px solid var(--app-border); border-radius: var(--app-radius); overflow: hidden; cursor: pointer; &--selected { border-color: var(--app-primary); box-shadow: var(--app-focus-ring); } &--hidden { display: none; } }
  &__hint { margin: 0; color: var(--app-muted); font-size: 11px; line-height: 1.6; }
  @media (min-width: 1400px) { &__wall { min-height: 560px; } }
  @media (max-width: 1000px) { &__workspace { grid-template-columns: 210px minmax(0, 1fr); } &__wall { min-height: 560px; } }
  @media (max-width: 700px) { height: auto; min-height: 100%; &__workspace { grid-template-columns: minmax(0, 1fr); } &__sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: 260px; } &__wall { min-height: 720px; } &__slot { :deep(.video-tile__header) { flex-direction: column; align-items: start; gap: 0; } :deep(.video-tile__placeholder) { font-size: 10px; } } &__controls { .el-select { width: 138px; } } }
}
</style>
