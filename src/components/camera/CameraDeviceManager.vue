<template>
  <section class="camera-page management-page list-page" :aria-busy="loading">
    <div class="list-page__top">
      <header class="management-page__heading">
        <div><span class="management-page__eyebrow">摄像头管理</span><h1>设备管理</h1><p>关联局域网 IPC，配置组织归属、预览画面与本地录像。</p></div>
        <div class="camera-page__actions">
          <el-button :loading="loading" @click="reload">刷新</el-button>
          <el-button v-if="permissions.insert" :loading="scanning" @click="scan">扫描局域网</el-button>
          <el-button v-if="permissions.insert" type="primary" @click="openCreate()">手动关联</el-button>
          <el-button v-if="permissions.edit" :disabled="!selectedDevices.length" @click="openAssignment">批量归属（{{ selectedDevices.length }}）</el-button>
          <el-button v-if="canAudit" @click="openActivity">操作记录</el-button>
        </div>
      </header>
      <el-alert v-if="loadError" type="error" show-icon :title="loadError" :closable="false" />
      <el-alert v-else-if="!credentialReady" type="warning" show-icon title="设备加密密钥尚未配置，请联系管理员设置 CAMERA_ENCRYPTION_KEY 并重启后端。" :closable="false" />
      <p class="camera-page__hint">仅本地接入。设备需开放 ONVIF 或 RTSP；品牌名称不代表所有型号均兼容。服务器录像保留 {{ retentionDays }} 天，总配额 {{ maxStorageMB }} MB，到期或超额会自动清理最旧录像。</p>
      <div class="camera-page__filters">
        <el-input v-model="keyword" clearable placeholder="搜索设备名称、IP 或安装位置" aria-label="搜索设备" />
        <el-tree-select v-model="filterOrganization" :data="organizationTree" node-key="id" :props="{ label: 'name', value: 'id', children: 'children' }" check-strictly clearable placeholder="筛选归属组织（含下级）" />
        <el-checkbox v-model="onlyUnassigned">仅看未分配设备</el-checkbox>
        <el-button :disabled="!filteredDevices.length" @click="selectAllDevices">{{ allSelected ? '取消全选' : '选择当前设备' }}</el-button>
      </div>
    </div>
    <div class="list-page__middle camera-page__middle" v-loading="loading">
      <el-empty v-if="!loading && !devices.length && !loadError" description="尚未关联摄像头，扫描发现或手动填写设备信息" />
      <el-empty v-if="devices.length && !filteredDevices.length" description="没有符合当前组织和关键词的设备" />
      <div class="camera-page__grid">
        <article v-for="camera in filteredDevices" :key="camera.id" class="camera-page__card">
          <div class="camera-page__cover">
            <img v-if="camera.has_cover" :src="cameraCover(camera)" :alt="`${camera.name}的安装场景封面`" loading="lazy" />
            <div v-else class="camera-page__placeholder"><el-icon :size="36"><VideoCamera /></el-icon><span>尚未设置封面</span></div>
          </div>
          <div class="camera-page__body">
            <div class="camera-page__card-title"><h2>{{ camera.name }}</h2><el-tag :type="camera.recording_enabled ? 'success' : 'info'">{{ camera.recording_enabled ? '录像已启用' : '录像未启用' }}</el-tag></div>
            <p>{{ brandLabel(camera.brand) }} · {{ camera.host }}:{{ camera.rtsp_port }}</p>
            <p>{{ camera.location || '未填写安装位置' }}</p>
            <div class="camera-page__actions"><el-checkbox v-if="permissions.edit" :model-value="selectedDevices.includes(camera.id)" :aria-label="`选择${camera.name}`" @change="toggleDevice(camera.id, $event)">选择</el-checkbox><el-tag :type="camera.organization_id ? 'info' : 'warning'">{{ camera.organization_name || '未分配组织' }}</el-tag></div>
            <div class="camera-page__actions">
              <el-button type="primary" :disabled="connecting" @click="openLive(camera)">实时预览</el-button>
              <el-button @click="openHistory(camera)">录像回放</el-button>
              <el-button v-if="permissions.edit" link @click="openEdit(camera)">配置</el-button>
              <el-button v-if="permissions.edit" link @click="openCover(camera)">封面</el-button>
              <el-button v-if="permissions.remove" type="danger" link @click="removeCamera(camera)">解除关联</el-button>
            </div>
          </div>
        </article>
      </div>
    </div>
    <footer class="list-page__bottom camera-page__footer">当前显示 {{ filteredDevices.length }} / {{ devices.length }} 个通道 · 已选择 {{ selectedDevices.length }} 台 · 发现范围以服务器所在局域网为准</footer>

    <el-dialog v-model="assignmentVisible" title="批量设置设备归属" width="min(520px, 95vw)">
      <el-form ref="assignmentFormRef" :model="assignment" :rules="{ organizationId: [{ required: true, message: '请选择归属组织', trigger: 'change' }] }" label-position="top"><el-form-item label="目标视频组织" prop="organizationId"><el-tree-select v-model="assignment.organizationId" :data="organizationTree" node-key="id" :props="{ label: 'name', value: 'id', children: 'children', disabled: inactiveOrganization }" check-strictly placeholder="请选择目标公司、组织或门店" /></el-form-item></el-form>
      <p>将调整 {{ selectedDevices.length }} 台设备的访问范围，原组织成员可能失去访问权限；正在录制的录像不受归属修改影响。</p>
      <template #footer><el-button @click="assignmentVisible = false">取消</el-button><el-button type="primary" :loading="assigning" @click="assignDevices">确认调整归属</el-button></template>
    </el-dialog>
    <el-drawer v-model="activityVisible" title="视频模块操作记录" size="min(640px, 95vw)"><el-timeline><el-timeline-item v-for="item in activities" :key="item.id" :timestamp="formatTime(item.created_at)">{{ item.summary }}</el-timeline-item></el-timeline><el-empty v-if="!activities.length" description="暂无操作记录" /></el-drawer>

    <el-dialog v-model="discoveryVisible" title="局域网发现" width="min(860px, 95vw)">
      <el-alert type="info" show-icon :closable="false" title="仅发现响应 ONVIF WS-Discovery 的设备；跨 VLAN、关闭发现或仅支持厂商 App 的设备可能不会出现，可手动关联。" />
      <el-table :data="discovered" class="camera-page__discovery">
        <el-table-column prop="name" label="设备名称" min-width="160" />
        <el-table-column prop="host" label="局域网 IP" min-width="150" />
        <el-table-column prop="onvifPort" label="ONVIF 端口" width="120" />
        <el-table-column label="操作" width="110"><template #default="{ row }"><el-button type="primary" link @click="openCreate(row)">关联设备</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!discovered.length" description="未发现设备，请检查摄像头 ONVIF 开关、防火墙 UDP 3702、服务器网卡及网段白名单" />
    </el-dialog>

    <el-dialog v-model="editVisible" :title="form.id ? '配置摄像头' : '关联摄像头'" width="min(720px, 95vw)" :close-on-click-modal="false" @closed="clearPassword">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving">
        <div class="camera-page__form-grid">
          <el-form-item label="摄像头名称" prop="name"><el-input v-model="form.name" maxlength="100" placeholder="例如：一楼入口" /></el-form-item>
          <el-form-item label="品牌 / 协议预设" prop="brand"><el-select v-model="form.brand" placeholder="请选择品牌" @change="applyPreset"><el-option v-for="item in brands" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="局域网 IPv4" prop="host"><el-input v-model="form.host" placeholder="例如：192.168.1.100" /></el-form-item>
          <el-form-item label="安装位置" prop="location"><el-input v-model="form.location" maxlength="200" placeholder="例如：总部一层大厅" /></el-form-item>
          <el-form-item label="ONVIF HTTP 端口" prop="onvifPort"><el-input-number v-model="form.onvifPort" :min="1" :max="65535" :precision="0" placeholder="通常为 80" /></el-form-item>
          <el-form-item label="RTSP 端口" prop="rtspPort"><el-input-number v-model="form.rtspPort" :min="1" :max="65535" :precision="0" placeholder="通常为 554" /></el-form-item>
          <el-form-item label="设备本地账号" prop="username"><el-input v-model="form.username" maxlength="100" autocomplete="off" placeholder="设备的本地 / ONVIF 用户名" /></el-form-item>
          <el-form-item label="设备本地密码 / 验证码" prop="password"><el-input v-model="form.password" type="password" show-password maxlength="200" autocomplete="new-password" :placeholder="form.id ? '留空保留原密码' : '请输入设备本地密码或验证码'" /></el-form-item>
        </div>
        <el-form-item label="RTSP 相对路径（不含 IP、账号或密码）" prop="rtspPath"><el-input v-model="form.rtspPath" maxlength="1000" placeholder="例如：/Streaming/Channels/101" /></el-form-item>
        <el-form-item label="归属视频组织" prop="organizationId"><el-tree-select v-model="form.organizationId" :data="organizationTree" node-key="id" :props="{ label: 'name', value: 'id', children: 'children', disabled: inactiveOrganization }" check-strictly default-expand-all placeholder="请选择公司、组织或门店；无选项时先创建视频组织" /></el-form-item>
        <el-form-item label="服务器持续录像"><el-switch v-model="form.recordingEnabled" active-text="启用" inactive-text="关闭" /></el-form-item>
        <p class="camera-page__hint">录像约每 5 分钟完成一段，完成后可回放；修改配置或停服会丢弃当前未完成段。画面统一转为 H.264、无音频，会消耗服务器 CPU。小米仅支持已开放本地协议的型号/固件。</p>
        <el-alert v-if="probeError" type="warning" show-icon :title="probeError" :closable="false" />
        <div v-if="probeStreams.length" class="camera-page__actions"><span>ONVIF 通道：</span><el-button v-for="(stream, index) in probeStreams" :key="index" @click="selectStream(stream)">{{ stream.name }}</el-button></div>
      </el-form>
      <template #footer><div class="camera-page__actions"><el-button v-if="form.id" :loading="probing" :disabled="saving" @click="probe">读取已保存设备的 ONVIF 通道</el-button><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveCamera">保存配置</el-button></div></template>
    </el-dialog>

    <el-dialog v-model="coverVisible" title="设置摄像头封面" width="min(520px, 95vw)">
      <p>上传 512 KiB 以内的 JPEG、PNG 或 WebP 场景图片。</p>
      <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" aria-label="选择摄像头封面图片" :disabled="coverSaving" @change="uploadCover" />
      <template #footer><el-button :loading="coverSaving" @click="clearCover">清除封面</el-button><el-button @click="coverVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="historyVisible" :title="`${historyCamera?.name || ''} · 录像回放`" width="min(1000px, 95vw)">
      <el-tabs v-model="historyTab">
        <el-tab-pane label="服务器本地录像" name="server">
          <div class="camera-page__actions"><el-button :loading="historyLoading" @click="loadHistory">刷新录像</el-button><el-tag>{{ history.recording ? '正在录像' : history.enabled ? '等待录像任务' : '未启用服务器录像' }}</el-tag></div>
          <el-alert v-if="history.error" type="warning" :title="history.error" show-icon :closable="false" />
          <el-table :data="history.files" max-height="360" v-loading="historyLoading">
            <el-table-column label="开始时间" min-width="180"><template #default="{ row }">{{ formatTime(row.start) }}</template></el-table-column>
            <el-table-column label="文件大小" width="120"><template #default="{ row }">{{ (row.size / 1024 / 1024).toFixed(1) }} MB</template></el-table-column>
            <el-table-column label="操作" width="100"><template #default="{ row }"><el-button type="primary" link @click="playLocal(row)">播放</el-button></template></el-table-column>
          </el-table>
          <p class="camera-page__hint">仅显示已完成录像段，最新 1000 段；录像启用后约 5 分钟出现首段，设备断线期间没有录像。</p>
        </el-tab-pane>
        <el-tab-pane label="设备 SD 卡 / NVR 历史录像" name="device">
          <el-alert type="info" show-icon :closable="false" title="需设备已录制视频并开放 ONVIF Profile G，或支持海康 / 大华本地 RTSP 回放；仅提供云录像的型号无法本地回放。" />
          <el-button class="camera-page__discovery" :loading="deviceLoading" @click="loadDeviceRecordings">读取设备录像服务</el-button>
          <el-alert v-if="deviceError" type="warning" :title="deviceError" show-icon :closable="false" />
          <el-form ref="replayFormRef" :model="replay" :rules="replayRules" label-position="top">
            <el-form-item label="录像源" prop="recordingToken"><el-select v-model="replay.recordingToken" placeholder="先读取设备录像服务"><el-option v-if="vendorPlayback" label="厂商 RTSP 回放（海康 / 大华）" value="" /><el-option v-for="item in deviceRecords" :key="item.token" :label="item.name" :value="item.token" /></el-select></el-form-item>
            <div class="camera-page__form-grid">
              <el-form-item label="开始时间" prop="start"><el-date-picker v-model="replay.start" type="datetime" placeholder="请选择录像开始时间" /></el-form-item>
              <el-form-item label="结束时间（单次最多 1 小时）" prop="end"><el-date-picker v-model="replay.end" type="datetime" placeholder="请选择录像结束时间" /></el-form-item>
              <el-form-item v-if="!replay.recordingToken" label="设备录像通道（从 1 开始）" prop="channel"><el-input-number v-model="replay.channel" :min="1" :max="256" :precision="0" placeholder="例如：1" /></el-form-item>
              <el-form-item v-if="historyCamera?.brand === 'dahua' && !replay.recordingToken" label="设备 UTC 偏移（分钟）" prop="deviceUtcOffsetMinutes"><el-input-number v-model="replay.deviceUtcOffsetMinutes" :min="-720" :max="840" :precision="0" placeholder="中国标准时间为 480" /></el-form-item>
            </div>
            <el-button type="primary" :loading="connecting" :disabled="!deviceServiceLoaded" @click="playDevice">播放设备录像</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="playerVisible" :title="playerTitle" width="min(1100px, 96vw)" destroy-on-close @close="closePlayer">
      <div v-loading="connecting" class="camera-page__player"><CameraPlayer v-if="playerSource" :source="playerSource" /><p v-else role="status">{{ playerError || '正在建立播放连接…' }}</p></div>
      <el-alert v-if="playerError && playerSource" type="error" :title="playerError" :closable="false" />
      <p class="camera-page__hint">实时预览约有数秒缓冲；关闭窗口会释放播放连接，长时间闲置或会话到期请重新打开。</p>
    </el-dialog>
  </section>
</template>

<script setup>
import { VideoCamera } from "@element-plus/icons-vue";
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, onBeforeUnmount, onDeactivated, onMounted, reactive, ref } from "vue";
import CameraPlayer from "@/components/camera/CameraPlayer.vue";
import { cameraCover, cameraRequest } from "@/service/camera.service";
import { organizationIds, workspaceRequest } from "@/service/camera-workspace.service";
import { registerStream, unregisterStream } from "@/service/camera-stream-lifecycle";

/** 品牌仅提供路径预设，实际接入需设备支持本地协议。 */
const brands = [{ value: "generic", label: "通用 ONVIF / RTSP" }, { value: "hikvision", label: "海康威视" }, { value: "dahua", label: "大华" }, { value: "ezviz", label: "萤石" }, { value: "xiaomi", label: "小米（需本地协议）" }];
const loading = ref(false);
const loadError = ref("");
const devices = ref([]);
const permissions = ref({});
const credentialReady = ref(true);
const retentionDays = ref(7);
const maxStorageMB = ref(10240);
const organizationTree = ref([]);
const organizations = ref([]);
const keyword = ref("");
const filterOrganization = ref("");
const onlyUnassigned = ref(false);
const selectedDevices = ref([]);
const assignmentVisible = ref(false);
const assigning = ref(false);
const assignmentFormRef = ref(null);
const assignment = reactive({ organizationId: "" });
const canAudit = ref(false);
const activityVisible = ref(false);
const activities = ref([]);
/** 在已授权设备快照上做展示筛选，无额外分页状态机；服务端对所有媒体与写操作继续校验组织范围。 */
const filteredDevices = computed(() => {
  const ids = filterOrganization.value ? organizationIds(organizations.value, filterOrganization.value) : null;
  const word = keyword.value.trim().toLowerCase();
  return devices.value.filter((row) => (!ids || ids.has(row.organization_id)) && (!onlyUnassigned.value || !row.organization_id) && (!word || `${row.name} ${row.host} ${row.location}`.toLowerCase().includes(word)));
});
const allSelected = computed(() => filteredDevices.value.length > 0 && filteredDevices.value.every((row) => selectedDevices.value.includes(row.id)));
const scanning = ref(false);
const discoveryVisible = ref(false);
const discovered = ref([]);
const editVisible = ref(false);
const saving = ref(false);
const formRef = ref(null);
const form = reactive({});
const probing = ref(false);
const probeStreams = ref([]);
const probeError = ref("");
const coverVisible = ref(false);
const coverCamera = ref(null);
const coverInput = ref(null);
const coverSaving = ref(false);
const historyVisible = ref(false);
const historyCamera = ref(null);
const historyLoading = ref(false);
const historyTab = ref("server");
const history = reactive({ files: [], recording: false, enabled: false, error: "" });
const deviceLoading = ref(false);
const deviceError = ref("");
const deviceRecords = ref([]);
const vendorPlayback = ref(false);
const deviceServiceLoaded = ref(false);
const replayFormRef = ref(null);
const replay = reactive({ start: null, end: null, recordingToken: "", channel: 1, deviceUtcOffsetMinutes: 480 });
const playerVisible = ref(false);
const connecting = ref(false);
const playerSource = ref("");
const playerTitle = ref("");
const playerError = ref("");
let activeStream = null;
let playerVersion = 0;
let historyVersion = 0;

/** 必填表单规则；设备密码在编辑时允许留空以保留原值。 */
const rules = {
  name: [{ required: true, message: "请输入摄像头名称", trigger: "blur" }],
  host: [{ required: true, message: "请输入局域网 IPv4 地址", trigger: "blur" }, { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: "请输入点分十进制 IPv4", trigger: "blur" }],
  username: [{ required: true, message: "请输入设备本地账号", trigger: "blur" }],
  rtspPath: [{ required: true, message: "请输入 RTSP 相对路径", trigger: "blur" }, { pattern: /^\/(?!\/)/, message: "路径必须以单个 / 开头", trigger: "blur" }],
  password: [{ validator: validatePassword, trigger: "blur" }],
  organizationId: [{ required: true, message: "请选择设备归属的视频组织", trigger: "change" }],
};
const replayRules = { start: [{ required: true, message: "请选择开始时间", trigger: "change" }], end: [{ required: true, message: "请选择结束时间", trigger: "change" }] };

/**
 * 验证新增设备密码，编辑留空由 BFF 保留密码。
 * @param {object} rule 必填，Element Plus 校验规则。
 * @param {string} value 必填，密码输入值。
 * @param {Function} callback 必填，校验完成回调。
 * @returns {void} 不发网络请求，不持久化密码。
 */
function validatePassword(rule, value, callback) { callback(!form.id && !value ? new Error("请输入设备本地密码或验证码") : undefined); }

/**
 * 将失败统一通知用户。
 * @param {Error} error 必填，统一 API 或浏览器错误。
 * @returns {void} 显示中文错误通知，不记录敏感配置。
 */
function report(error) { ElNotification({ title: "摄像头操作失败", message: error.message || "操作失败，请重试", type: "error" }); }
/**
 * 映射品牌中文名。
 * @param {string} value 必填，品牌标识。
 * @returns {string} 中文名，无副作用。
 */
function brandLabel(value) { return brands.find((brand) => brand.value === value)?.label || "通用设备"; }
/**
 * 格式化 UTC 为当前浏览器本地时间。
 * @param {string} value 必填，ISO-8601 时间。
 * @returns {string} 中文日期时间，无副作用。
 */
function formatTime(value) { return new Date(value).toLocaleString("zh-CN", { hour12: false }); }

/** 无参数；返回 Promise<void>，读取设备、权限和配额，失败保留可见错误，更新 loading。 */
async function reload() {
  loading.value = true;
  loadError.value = "";
  try { const [data, overview] = await Promise.all([cameraRequest("get"), workspaceRequest("get", "/overview")]); devices.value = data.devices; permissions.value = data.permissions; credentialReady.value = data.credentialReady; retentionDays.value = data.retentionDays; maxStorageMB.value = data.maxStorageMB; canAudit.value = data.canAudit; organizationTree.value = overview.tree; organizations.value = overview.organizations; selectedDevices.value = selectedDevices.value.filter((id) => devices.value.some((row) => row.id === id)); }
  catch (error) { loadError.value = error.message; report(error); }
  finally { loading.value = false; }
}

/** 无参数；返回 Promise<void>，发起四秒 ONVIF 发现并显示结果，错误统一反馈。 */
async function scan() {
  scanning.value = true;
  try { discovered.value = (await cameraRequest("post", "/discover")).devices; discoveryVisible.value = true; }
  catch (error) { report(error); }
  finally { scanning.value = false; }
}

/**
 * 打开新增表单，可从发现结果预填地址。
 * @param {object} [device={}] 可选，发现的 host/onvifPort/name，不包含凭据。
 * @returns {void} 重置表单、错误与密码，不创建设备。
 */
function openCreate(device = {}) {
  Object.assign(form, { id: "", name: device.name || "", brand: "generic", host: device.host || "", onvifPort: device.onvifPort || 80, rtspPort: 554, rtspPath: "/", location: "", username: "", password: "", recordingEnabled: false, organizationId: filterOrganization.value || "" });
  probeStreams.value = [];
  probeError.value = "";
  formRef.value?.clearValidate();
  discoveryVisible.value = false;
  editVisible.value = true;
}

/**
 * 读取脱敏编辑配置；不向前端返回原密码。
 * @param {object} camera 必填，列表设备摘要。
 * @returns {Promise<void>} 更新表单并显示对话框，错误统一通知。
 */
async function openEdit(camera) {
  try { const data = await cameraRequest("get", `/${camera.id}`); openCreate(); Object.assign(form, data); }
  catch (error) { report(error); }
}
/** 无参数；返回 void，关闭配置窗口时立即清空明文密码。 */
function clearPassword() { form.password = ""; }
/** @param {object} node 必填，组织 DTO。 @returns {boolean} 停用节点不可用于新增归属。 */
function inactiveOrganization(node) { return !node.is_active; }
/** @param {string} id 必填，设备 UUID。 @param {boolean} checked 必填，勾选状态。 @returns {void} 更新批量选择，最多100台。 */
function toggleDevice(id, checked) { if (checked) { if (selectedDevices.value.length >= 100) { report(new Error("每次最多选择 100 台设备")); return; } selectedDevices.value = [...new Set([...selectedDevices.value, id])]; } else selectedDevices.value = selectedDevices.value.filter((value) => value !== id); }
/** 无参数；返回 void，选择当前筛选结果最多100台，或取消当前筛选的选择。 */
function selectAllDevices() { selectedDevices.value = allSelected.value ? selectedDevices.value.filter((id) => !filteredDevices.value.some((row) => row.id === id)) : [...new Set([...selectedDevices.value, ...filteredDevices.value.map((row) => row.id)])].slice(0, 100); }
/** 无参数；返回 void，打开批量组织归属表单。 */
function openAssignment() { assignment.organizationId = filterOrganization.value || ""; assignmentVisible.value = true; }
/** 无参数；返回 Promise<void>，验证并确认访问范围影响后原子调整设备归属。 */
async function assignDevices() {
  if (!await assignmentFormRef.value.validate().catch(() => false)) return;
  try { await ElMessageBox.confirm(`确认调整 ${selectedDevices.value.length} 台设备的归属组织？访问范围将立即变更。`, "调整设备归属", { confirmButtonText: "确认调整", cancelButtonText: "取消", type: "warning" }); assigning.value = true; await workspaceRequest("post", "/devices/assign", { deviceIds: selectedDevices.value, organizationId: assignment.organizationId }); assignmentVisible.value = false; selectedDevices.value = []; ElNotification.success({ title: "设备归属已更新" }); await reload(); }
  catch (error) { if (error !== "cancel" && error !== "close") report(error); }
  finally { assigning.value = false; }
}
/** 无参数；返回 Promise<void>，读取管理员可见的最新操作审计。 */
async function openActivity() { try { activities.value = await workspaceRequest("get", "/activity"); activityVisible.value = true; } catch (error) { report(error); } }
/**
 * 应用用户明确选中的品牌路径预设。
 * @param {string} brand 必填，品牌标识。
 * @returns {void} 修改表单路径，不调用设备；未知品牌保留现有路径。
 */
function applyPreset(brand) { const presets = { hikvision: "/Streaming/Channels/101", dahua: "/cam/realmonitor?channel=1&subtype=0", ezviz: "/h264/ch1/main/av_stream" }; if (presets[brand]) form.rtspPath = presets[brand]; }
/**
 * 应用 ONVIF 返回的脱敏通道地址。
 * @param {object} stream 必填，port/path/name。
 * @returns {void} 更新表单端口路径，不立即保存。
 */
function selectStream(stream) { form.rtspPort = stream.port; form.rtspPath = stream.path; }

/** 无参数；返回 Promise<void>，读取已保存设备的 ONVIF 通道，错误保留在弹窗中。 */
async function probe() {
  probing.value = true;
  probeError.value = "";
  try { probeStreams.value = (await cameraRequest("post", `/${form.id}/probe`)).streams; }
  catch (error) { probeError.value = error.message; report(error); }
  finally { probing.value = false; }
}

/** 无参数；返回 Promise<void>，Element Plus 验证通过后保存配置，成功清空密码刷新列表。 */
async function saveCamera() {
  if (!await formRef.value.validate().catch(() => false)) return;
  saving.value = true;
  try { await cameraRequest(form.id ? "put" : "post", form.id ? `/${form.id}` : "", { ...form }); editVisible.value = false; clearPassword(); ElNotification.success({ title: "保存成功", message: "摄像头配置已保存，启用录像后服务会自动启动任务" }); await reload(); }
  catch (error) { report(error); }
  finally { saving.value = false; }
}

/**
 * 二次确认解除关联，说明录像与凭据影响。
 * @param {object} camera 必填，当前设备摘要。
 * @returns {Promise<void>} 确认后删除配置、停止媒体并刷新；取消无副作用，错误通知。
 */
async function removeCamera(camera) {
  try {
    await ElMessageBox.confirm(`确认解除“${camera.name}”的关联？将删除设备配置、密码和封面，停止预览与录像并丢弃当前未完成段；已完成录像保留到自动清理，但解除后无法在页面回放。`, "解除摄像头关联", { type: "warning", confirmButtonText: "确认解除", cancelButtonText: "取消" });
    await cameraRequest("delete", `/${camera.id}`);
    ElNotification.success({ title: "已解除关联", message: camera.name });
    await reload();
  } catch (error) { if (error !== "cancel" && error !== "close") report(error); }
}

/**
 * 打开封面窗口。
 * @param {object} camera 必填，当前设备摘要。
 * @returns {void} 设置目标并清空文件选择，不上传文件。
 */
function openCover(camera) { coverCamera.value = camera; if (coverInput.value) coverInput.value.value = ""; coverVisible.value = true; }

/**
 * 验证封面尺寸并编码上传，文件内容仍由 BFF 再验证。
 * @param {Event} event 必填，文件 input change 事件，仅读取首个文件。
 * @returns {Promise<void>} 上传后刷新列表；失败通知，始终解除加载状态。
 */
async function uploadCover(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 512 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { report(new Error("请选择 512 KiB 以内的 JPEG、PNG 或 WebP")); return; }
  coverSaving.value = true;
  try {
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("封面文件读取失败")); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); });
    await cameraRequest("put", `/${coverCamera.value.id}/cover`, { type: file.type, data });
    coverVisible.value = false;
    ElNotification.success({ title: "封面已保存" });
    await reload();
  } catch (error) { report(error); }
  finally { coverSaving.value = false; }
}

/** 无参数；返回 Promise<void>，二次确认清除当前设备封面，错误统一通知。 */
async function clearCover() {
  try { await ElMessageBox.confirm("确认清除当前摄像头封面？", "清除封面", { confirmButtonText: "确认清除", cancelButtonText: "取消", type: "warning" }); coverSaving.value = true; await cameraRequest("put", `/${coverCamera.value.id}/cover`, { clear: true }); coverVisible.value = false; ElNotification.success({ title: "封面已清除" }); await reload(); }
  catch (error) { if (error !== "cancel" && error !== "close") report(error); }
  finally { coverSaving.value = false; }
}

/**
 * 打开历史录像窗口并重置旧设备状态，防止切换设备后显示上一台的录像。
 * @param {object} camera 必填，设备摘要。
 * @returns {Promise<void>} 读取服务器录像；错误保留在窗口和通知中。
 */
async function openHistory(camera) {
  historyVersion += 1;
  historyCamera.value = camera;
  historyTab.value = "server";
  deviceRecords.value = [];
  vendorPlayback.value = false;
  deviceServiceLoaded.value = false;
  deviceLoading.value = false;
  historyLoading.value = false;
  deviceError.value = "";
  Object.assign(history, { files: [], recording: false, enabled: false, error: "" });
  Object.assign(replay, { recordingToken: "", start: new Date(Date.now() - 3600000), end: new Date(), channel: 1, deviceUtcOffsetMinutes: -new Date().getTimezoneOffset() });
  historyVisible.value = true;
  await loadHistory();
}

/** 无参数；返回 Promise<void>，读取当前设备录像，使用版本防止旧设备请求覆盖新窗口。 */
async function loadHistory() {
  const version = historyVersion;
  const id = historyCamera.value?.id;
  if (!id) return;
  historyLoading.value = true;
  try { const data = await cameraRequest("get", `/${id}/recordings`); if (version === historyVersion) Object.assign(history, data); }
  catch (error) { if (version === historyVersion) { history.error = error.message; report(error); } }
  finally { if (version === historyVersion) historyLoading.value = false; }
}

/** 无参数；返回 Promise<void>，查询设备录像服务，保留能力错误，成功后允许设备回放。 */
async function loadDeviceRecordings() {
  const version = historyVersion;
  deviceLoading.value = true;
  deviceError.value = "";
  try { const data = await cameraRequest("post", `/${historyCamera.value.id}/device-recordings`); if (version !== historyVersion) return; deviceRecords.value = data.recordings; vendorPlayback.value = data.vendorPlayback; replay.recordingToken = data.recordings[0]?.token || ""; deviceServiceLoaded.value = Boolean(data.recordings.length || data.vendorPlayback); deviceError.value = data.message || (deviceServiceLoaded.value ? "" : "设备未返回可用录像，请检查 SD 卡/NVR 录像计划"); }
  catch (error) { if (version === historyVersion) { deviceError.value = error.message; report(error); } }
  finally { if (version === historyVersion) deviceLoading.value = false; }
}

/**
 * 关闭并清理当前播放连接，递增版本可丢弃尚未返回的旧启动请求。
 * @returns {Promise<void>} 停止前端资源和后端 HLS；失败显示通知，闲置会话仍由后端超时回收。
 */
async function closePlayer() {
  playerVersion += 1;
  const previous = activeStream;
  activeStream = null;
  playerSource.value = "";
  connecting.value = false;
  if (previous) { try { await cameraRequest("delete", `/${previous.cameraId}/streams/${previous.id}`); unregisterStream(previous.id); } catch (error) { if ([401, 403, 404].includes(error.status)) unregisterStream(previous.id); else report(error); } }
}

/**
 * 打开实时预览或设备回放；快速关闭窗口时会停止随后返回的流，避免后台泄漏。
 * @param {object} camera 必填，设备摘要。
 * @param {object} [options={mode:"live"}] 可选，设备回放区间、token/通道。
 * @returns {Promise<void>} 创建媒体会话并显示播放器；失败保持可见中文错误。
 */
async function openStream(camera, options = { mode: "live" }) {
  await closePlayer();
  const version = playerVersion;
  playerTitle.value = `${camera.name} · ${options.mode === "device" ? "设备历史录像" : "实时预览"}`;
  playerError.value = "";
  playerVisible.value = true;
  connecting.value = true;
  try {
    const stream = await cameraRequest("post", `/${camera.id}/streams`, options);
    if (version !== playerVersion || !playerVisible.value) { await cameraRequest("delete", `/${camera.id}/streams/${stream.id}`); return; }
    activeStream = { cameraId: camera.id, id: stream.id };
    registerStream(activeStream);
    playerSource.value = stream.url;
  } catch (error) { if (version === playerVersion) { playerError.value = error.message; report(error); } }
  finally { if (version === playerVersion) connecting.value = false; }
}

/**
 * 模板事件显式只传设备，避免 Vue 将鼠标事件作为回放 options。
 * @param {object} camera 必填，设备摘要。
 * @returns {Promise<void>} 建立实时预览，失败由 openStream 反馈。
 */
async function openLive(camera) { await openStream(camera); }
/**
 * 播放服务器已完成 MP4，浏览器原生支持 Range 拖动。
 * @param {object} file 必填，含 start/url 的录像摘要。
 * @returns {Promise<void>} 关闭旧流，更新播放器，不创建转码任务。
 */
async function playLocal(file) { await closePlayer(); playerTitle.value = `${historyCamera.value.name} · ${formatTime(file.start)}`; playerError.value = ""; playerSource.value = file.url; playerVisible.value = true; }
/** 无参数；返回 Promise<void>，验证区间后启动设备回放，日期转换为 UTC 传给 BFF。 */
async function playDevice() {
  if (!await replayFormRef.value.validate().catch(() => false)) return;
  await openStream(historyCamera.value, { ...replay, mode: "device", start: new Date(replay.start).toISOString(), end: new Date(replay.end).toISOString() });
}
/** 无参数；返回 void，离开缓存页/卸载时关闭所有对话框与媒体并清空密码。 */
function leavePage() { playerVisible.value = false; historyVisible.value = false; editVisible.value = false; discoveryVisible.value = false; coverVisible.value = false; clearPassword(); closePlayer(); }

onMounted(reload);
onDeactivated(leavePage);
onBeforeUnmount(leavePage);
</script>

<style lang="scss" scoped>
.camera-page {
  &__filters { display: flex; flex-wrap: wrap; gap: var(--app-space-sm); align-items: center; margin-top: var(--app-space-sm); > .el-input, > .el-select { width: min(280px, 100%); } }
  &__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--app-space-sm); .el-button + .el-button { margin-left: 0; } }
  &__hint { color: var(--app-muted); font-size: 12px; line-height: 1.7; margin: var(--app-space-sm) 0; }
  &__middle { padding-bottom: var(--app-space); }
  &__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)); gap: var(--app-space); }
  &__card { border: 1px solid var(--app-border); border-radius: var(--app-radius); overflow: hidden; background: var(--app-surface); }
  &__cover { aspect-ratio: 16 / 9; background: var(--app-surface-muted); img { width: 100%; height: 100%; object-fit: cover; } }
  &__placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--app-space-sm); height: 100%; color: var(--app-muted); }
  &__body { padding: var(--app-space); p { color: var(--app-muted); font-size: 13px; overflow-wrap: anywhere; } }
  &__card-title { display: flex; flex-wrap: wrap; gap: var(--app-space-sm); align-items: center; justify-content: space-between; h2 { font-size: 16px; margin: 0; color: var(--app-ink); overflow-wrap: anywhere; } }
  &__footer { padding: var(--app-space-sm) 0; color: var(--app-muted); font-size: 12px; }
  &__form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 var(--app-space); }
  &__discovery { margin-top: var(--app-space); }
  &__player { min-height: 180px; }
  :deep(.el-select), :deep(.el-date-editor.el-input) { width: 100%; }
  @media (max-width: 640px) { &__form-grid { grid-template-columns: minmax(0, 1fr); } }
}
</style>
