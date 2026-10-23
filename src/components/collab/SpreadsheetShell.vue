<template>
  <section ref="editorShell" :class="['spreadsheet-shell', { 'spreadsheet-shell--fullscreen': isFullscreen }]"
    :aria-busy="loading || (editorAvailable && !editorMounted)">
    <div class="spreadsheet-shell__toolbar">
      <div class="spreadsheet-shell__title-wrap">
        <span class="spreadsheet-shell__eyebrow">工作簿编辑器</span>
        <h2>{{ document.name }}</h2>
        <p>
          <span class="spreadsheet-shell__status-dot"
            :class="`spreadsheet-shell__status-dot--${connectionState}`"></span>
          {{ connectionLabel }} · 修订 {{ document.currentRevision }}
        </p>
      </div>
      <div class="spreadsheet-shell__actions">
        <el-button size="small" @click="reloadEditor" :loading="loading">重新连接</el-button>
        <el-button v-if="document.permission?.canShare" size="small" type="primary" plain @click="$emit('open-share')">
          分享与权限
        </el-button>
        <el-button v-if="document.permission?.canHistory" size="small" @click="$emit('open-history')">版本历史</el-button>
        <el-button
          v-if="document.permission?.canExport"
          size="small"
          type="success"
          :loading="exporting"
          @click="downloadDocument"
        >
          <template #icon><el-icon><Download /></el-icon></template>
          下载/导出
        </el-button>
        <el-button class="spreadsheet-shell__fullscreen-button" size="small" :aria-pressed="isFullscreen"
          :aria-label="isFullscreen ? '退出全屏编辑' : '全屏编辑'" @click="toggleFullscreen">
          <el-icon v-if="isFullscreen">
            <Close />
          </el-icon>
          <el-icon v-else>
            <FullScreen />
          </el-icon>
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </el-button>
      </div>
    </div>

    <el-alert v-if="editorError" class="spreadsheet-shell__alert" type="error" show-icon :title="editorError" />

    <div v-if="loading" class="spreadsheet-shell__loading" aria-live="polite">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      正在连接编辑器…
    </div>

    <div v-else-if="!editorAvailable" class="spreadsheet-shell__unavailable">
      <div class="spreadsheet-shell__unavailable-icon" aria-hidden="true"><el-icon>
          <Grid />
        </el-icon></div>
      <h3>文档中心已就绪，编辑器待部署</h3>
      <p>{{ editorMessage }}</p>
      <p class="spreadsheet-shell__hint">当前文档、权限、导入、导出和版本接口已经由 BFF 保护；配置 ONLYOFFICE 后即可启用单元格协同编辑。</p>
      <el-button size="small" type="primary" @click="reloadEditor">检查编辑器配置</el-button>
    </div>

    <div v-else class="spreadsheet-shell__editor-wrap">
      <div :id="editorContainerId" ref="editorContainer" class="spreadsheet-shell__editor" aria-label="在线电子表格编辑器"></div>
      <p class="spreadsheet-shell__collaboration-tip" role="status">
        多人协同编辑时，将鼠标悬停在其他成员的彩色选中单元格上即可查看成员姓名。
      </p>
      <div v-if="!editorMounted" class="spreadsheet-shell__editor-loading" aria-live="polite">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        正在载入在线工作簿…
      </div>
    </div>

    <footer class="spreadsheet-shell__footer">
      <span>引擎：{{ editorLabel }}</span>
      <span v-if="document.permission?.canEdit" class="spreadsheet-shell__footer-success">当前成员拥有编辑权限</span>
      <span v-else>当前成员为只读</span>
    </footer>
  </section>
</template>

<script setup>
import { Close, Download, FullScreen, Grid, Loading } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { exportCollabDocument, getCollabEditorConfig } from "@/service/collab-spreadsheet.service";

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
});

defineEmits(["open-share", "open-history"]);

const editorContainer = ref();
const editorShell = ref();
/**
 * 为 ONLYOFFICE API 提供当前组件实例唯一的字符串占位符 ID，避免多个编辑器容器互相覆盖。
 * @type {string}
 */
const editorContainerId = `spreadsheet-editor-${Math.random().toString(36).slice(2)}`;
const loading = ref(false);
const editorError = ref("");
const editorAvailable = ref(false);
const editorMounted = ref(false);
const editorMessage = ref("当前环境没有配置 ONLYOFFICE Document Server。");
const editorConfig = ref(null);
const connectionState = ref("offline");
const isFullscreen = ref(false);
const fallbackFullscreen = ref(false);
const exporting = ref(false);
let editorInstance = null;
let scriptLoadPromise = null;
let reloadSequence = 0;

/**
 * 将编辑器连接状态转换成用户可理解的中文状态。
 * @returns {string} 当前连接状态文案。
 */
const connectionLabel = computed(() => {
  if (connectionState.value === "connected") return "已连接";
  if (connectionState.value === "connecting") return "连接中";
  return "未连接";
});

/**
 * 读取后端返回的编辑器引擎名称，并在未配置时显示安全降级文案。
 * @returns {string} 编辑器名称。
 */
const editorLabel = computed(() => (editorAvailable.value ? "ONLYOFFICE" : "待配置 ONLYOFFICE"));

/**
 * 下载当前文档的最新工作簿文件；服务端再次校验文档 ACL、页面导出权限和下载开关。
 * @returns {Promise<void>} 文件下载触发后兑现；失败时显示统一错误通知并恢复按钮状态。
 */
const downloadDocument = async () => {
  if (exporting.value || props.document.permission?.canExport !== true) return;
  exporting.value = true;
  try {
    const fileName = await exportCollabDocument(props.document.id);
    ElNotification.success({ title: "协同表格", message: `已开始下载 ${fileName}。` });
  } catch (error) {
    ElNotification.error({ title: "导出失败", message: error?.message || "文档未能导出，请检查下载权限。" });
  } finally {
    exporting.value = false;
  }
};

/**
 * 同步浏览器原生全屏事件与本地全屏降级状态，保证按 Esc 退出后按钮文案立即恢复。
 * @returns {void} 更新 isFullscreen 和 fallbackFullscreen，不发起网络请求。
 */
const syncFullscreenState = () => {
  const activeElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (activeElement === editorShell.value) {
    isFullscreen.value = true;
    fallbackFullscreen.value = false;
    return;
  }
  if (!fallbackFullscreen.value) isFullscreen.value = false;
};

/**
 * 切换 ONLYOFFICE 工作簿的局部全屏编辑模式；不改变应用全局布局或当前文档权限。
 * @returns {Promise<void>} 全屏切换完成或错误通知显示后兑现。
 */
const toggleFullscreen = async () => {
  if (isFullscreen.value) {
    if (fallbackFullscreen.value) {
      fallbackFullscreen.value = false;
      isFullscreen.value = false;
      return;
    }
    const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
    if (exitFullscreen) {
      await exitFullscreen.call(document);
    } else {
      isFullscreen.value = false;
    }
    return;
  }

  const requestFullscreen = editorShell.value?.requestFullscreen || editorShell.value?.webkitRequestFullscreen;
  if (!requestFullscreen) {
    fallbackFullscreen.value = true;
    isFullscreen.value = true;
    return;
  }

  try {
    await requestFullscreen.call(editorShell.value);
  } catch {
    ElNotification.warning({
      title: "无法切换全屏",
      message: "当前浏览器或页面权限不支持编辑器全屏操作。",
    });
  }
};

/**
 * 加载后端配置的 ONLYOFFICE API 脚本；同一页面生命周期内只加载一次。
 * @param {string} documentServerUrl ONLYOFFICE 浏览器访问地址。
 * @returns {Promise<void>} API 脚本加载完成后兑现。
 * @throws {Error} 地址协议不安全、脚本加载失败或全局 API 未出现时抛出。
 */
const loadOfficeScript = (documentServerUrl) => {
  if (window.DocsAPI?.DocEditor) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  let parsed;
  try {
    parsed = new URL(documentServerUrl);
  } catch {
    return Promise.reject(new Error("ONLYOFFICE 地址无效"));
  }
  if (!/^https?:$/.test(parsed.protocol)) return Promise.reject(new Error("ONLYOFFICE 地址协议无效"));
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const basePath = parsed.pathname.replace(/\/+$/, "");
    script.src = `${parsed.origin}${basePath}/web-apps/apps/api/documents/api.js`;
    script.async = true;
    script.onload = () => (window.DocsAPI?.DocEditor ? resolve() : reject(new Error("ONLYOFFICE API 未加载")));
    script.onerror = () => reject(new Error("ONLYOFFICE API 加载失败"));
    document.head.appendChild(script);
  }).catch((error) => {
    scriptLoadPromise = null;
    throw error;
  });
  return scriptLoadPromise;
};

/**
 * 销毁当前 ONLYOFFICE 实例，避免切换文档时保留旧工作簿和事件监听。
 * @returns {void} 清理编辑器实例和挂载状态。
 */
const destroyEditor = () => {
  if (editorInstance?.destroyEditor) editorInstance.destroyEditor();
  editorInstance = null;
  editorMounted.value = false;
};

/**
 * 在 ONLYOFFICE 真正完成应用或文档初始化后更新连接状态，避免构造 iframe 后过早显示“已加载”。
 * @param {number} sequence 当前编辑器加载序号，用于丢弃旧文档的迟到事件。
 * @returns {void} 显示已挂载编辑器并清除旧错误提示；不发起额外请求。
 */
const markEditorReady = (sequence) => {
  if (sequence !== reloadSequence) return;
  editorMounted.value = true;
  connectionState.value = "connected";
  editorError.value = "";
};

/**
 * 根据 BFF 配置初始化 ONLYOFFICE 编辑器；token 和权限配置只在内存中传给编辑器。
 * @returns {Promise<void>} 编辑器初始化完成或降级状态更新后兑现。
 * @throws {Error} 编辑器脚本、配置或初始化失败时转为页面错误提示。
 */
const mountEditor = async (sequence) => {
  const config = editorConfig.value;
  if (!config?.available || !config.config || !editorContainer.value) return;
  await loadOfficeScript(config.documentServerUrl);
  if (sequence !== reloadSequence) return;
  await nextTick();
  if (sequence !== reloadSequence) return;
  destroyEditor();
  const configuredEvents = config.config.events || {};
  const editorOptions = {
    ...config.config,
    token: config.token,
    events: {
      ...configuredEvents,
      onAppReady: (...args) => {
        if (typeof configuredEvents.onAppReady === "function") configuredEvents.onAppReady(...args);
        markEditorReady(sequence);
      },
      onDocumentReady: (...args) => {
        if (typeof configuredEvents.onDocumentReady === "function") configuredEvents.onDocumentReady(...args);
        markEditorReady(sequence);
      },
      onError: (...args) => {
        if (typeof configuredEvents.onError === "function") configuredEvents.onError(...args);
        if (sequence !== reloadSequence) return;
        editorMounted.value = false;
        connectionState.value = "offline";
        editorError.value = "在线编辑器连接失败，请点击“重新连接”再试。";
      },
    },
  };
  editorInstance = new window.DocsAPI.DocEditor(editorContainerId, editorOptions);
  connectionState.value = "connecting";
};

/**
 * 请求当前文档的最新编辑器配置并重新挂载或显示安全降级状态。
 * @returns {Promise<void>} 配置加载和编辑器状态更新完成后兑现。
 */
const reloadEditor = async () => {
  const sequence = ++reloadSequence;
  loading.value = true;
  editorError.value = "";
  editorAvailable.value = false;
  editorMounted.value = false;
  connectionState.value = "connecting";
  destroyEditor();
  try {
    const result = await getCollabEditorConfig(props.document.id);
    if (sequence !== reloadSequence) return;
    editorConfig.value = result?.editor || null;
    editorAvailable.value = result?.editor?.available === true;
    editorMessage.value = result?.editor?.message || "当前环境尚未提供在线编辑器。";
    connectionState.value = editorAvailable.value ? "connecting" : "offline";
  } catch (error) {
    if (sequence !== reloadSequence) return;
    connectionState.value = "offline";
    editorError.value = error?.message || "编辑器配置加载失败，请稍后重试。";
  } finally {
    if (sequence === reloadSequence) loading.value = false;
  }

  if (sequence !== reloadSequence || !editorAvailable.value) return;
  await nextTick();
  if (sequence !== reloadSequence) return;
  try {
    await mountEditor(sequence);
  } catch (error) {
    if (sequence !== reloadSequence) return;
    connectionState.value = "offline";
    editorError.value = error?.message || "编辑器加载失败，请稍后重试。";
  }
};

watch(() => props.document.id, () => void reloadEditor(), { immediate: true });

onMounted(() => {
  syncFullscreenState();
  document.addEventListener("fullscreenchange", syncFullscreenState);
  document.addEventListener("webkitfullscreenchange", syncFullscreenState);
});

onBeforeUnmount(() => {
  reloadSequence += 1;
  destroyEditor();
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
});
</script>

<style lang="scss" scoped>
.spreadsheet-shell {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: min(680px, 80dvh);
  flex-direction: column;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-lg);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-soft);
}

.spreadsheet-shell--fullscreen {
  position: fixed;
  z-index: 2000;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.spreadsheet-shell__toolbar,
.spreadsheet-shell__footer {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spreadsheet-shell__toolbar {
  padding: 18px 20px;
  border-bottom: 1px solid var(--app-border-soft);
}

.spreadsheet-shell__title-wrap {
  min-width: 0;
}

.spreadsheet-shell__eyebrow {
  color: var(--app-muted);
  font-size: 12px;
  font-weight: 500;
}

.spreadsheet-shell h2 {
  margin: 5px 0 3px;
  overflow: hidden;
  color: var(--app-ink);
  font-size: 19px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spreadsheet-shell p {
  margin: 0;
  color: var(--app-muted);
  font-size: 12px;
}

.spreadsheet-shell__status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--app-muted);
}

.spreadsheet-shell__status-dot--connected {
  background: var(--app-success);
}

.spreadsheet-shell__status-dot--connecting {
  background: var(--app-warning);
}

.spreadsheet-shell__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spreadsheet-shell__fullscreen-button {
  flex: 0 0 auto;
}

.spreadsheet-shell__alert {
  margin: 16px 20px 0;
}

.spreadsheet-shell__loading,
.spreadsheet-shell__unavailable,
.spreadsheet-shell__editor-wrap {
  min-height: min(480px, 60dvh);
}

.spreadsheet-shell__loading,
.spreadsheet-shell__unavailable {
  display: flex;
  padding: 32px 20px;
  color: var(--app-muted);
  text-align: center;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
}

.spreadsheet-shell__unavailable-icon {
  display: grid;
  width: 56px;
  height: 56px;
  color: var(--app-primary);
  font-size: 28px;
  border-radius: var(--app-radius);
  background: var(--app-primary-soft);
  place-items: center;
}

.spreadsheet-shell__unavailable h3 {
  margin: 0;
  color: var(--app-ink);
  font-size: 17px;
}

.spreadsheet-shell__unavailable p {
  max-width: 620px;
  line-height: 1.7;
}

.spreadsheet-shell__hint {
  max-width: 680px !important;
}

.spreadsheet-shell__editor-wrap {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  background: var(--app-surface-muted);
}

.spreadsheet-shell__editor {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: min(680px, 75dvh);
  flex: 1 1 auto;
}

.spreadsheet-shell__editor>div,
.spreadsheet-shell__editor :deep(iframe) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  min-height: min(680px, 75dvh);
  border: 0;
}

.spreadsheet-shell--fullscreen .spreadsheet-shell__loading,
.spreadsheet-shell--fullscreen .spreadsheet-shell__unavailable {
  min-height: 0;
  flex: 1 1 auto;
}

.spreadsheet-shell--fullscreen .spreadsheet-shell__editor-wrap,
.spreadsheet-shell--fullscreen .spreadsheet-shell__editor,
.spreadsheet-shell--fullscreen .spreadsheet-shell__editor>div,
.spreadsheet-shell--fullscreen .spreadsheet-shell__editor :deep(iframe) {
  min-height: 0;
}

.spreadsheet-shell--fullscreen .spreadsheet-shell__editor {
  height: 100%;
}

.spreadsheet-shell__collaboration-tip {
  margin: 0;
  padding: 7px 20px;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.5;
  background: var(--app-surface-muted);
  border-top: 1px solid var(--app-border-soft);
}

.spreadsheet-shell__editor-loading {
  position: absolute;
  inset: 0;
  display: flex;
  color: var(--app-muted);
  background: var(--app-surface-muted);
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spreadsheet-shell__footer {
  padding: 11px 20px;
  color: var(--app-muted);
  font-size: 12px;
  border-top: 1px solid var(--app-border-soft);
}

.spreadsheet-shell__footer-success {
  color: var(--app-success);
}

@media (max-width: 640px) {
  .spreadsheet-shell {
    min-height: 560px;
  }

  .spreadsheet-shell__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .spreadsheet-shell__actions {
    justify-content: flex-start;
  }
}
</style>
