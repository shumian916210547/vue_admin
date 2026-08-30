<template>
  <section class="collab-editor-page management-page" :aria-busy="loading">
    <header class="management-page__heading collab-editor-page__heading">
      <div class="collab-editor-page__heading-copy">
        <el-button class="collab-editor-page__back" size="small" text @click="goBack">
          <template #icon><el-icon><ArrowLeft /></el-icon></template>
          返回工作簿列表
        </el-button>
        <span class="management-page__eyebrow">独立编辑页面</span>
        <h1>{{ document?.name || "工作簿编辑器" }}</h1>
        <p v-if="document" class="collab-editor-page__meta">
          <span>创建者：{{ document.createdByName || "已离职成员" }}</span>
          <span>当前所有者：{{ document.ownerName || "已离职成员" }}</span>
          <span>创建于：{{ formatDateTime(document.createdAt) }}</span>
          <span>最近修改：{{ formatDateTime(document.updatedAt) }}</span>
          <span>占用空间：{{ formatFileSize(document.storageUsedBytes ?? document.fileSizeBytes) }}</span>
          <span>容量上限：{{ formatStorageLimit(document.storageLimitBytes) }}</span>
        </p>
      </div>
      <div class="collab-editor-page__heading-actions management-page__heading-actions">
        <el-button size="small" :loading="loading" @click="refreshDocument">
          <template #icon><el-icon><Refresh /></el-icon></template>
          刷新文档
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="loadError"
      class="management-page__alert"
      type="error"
      show-icon
      :title="loadError"
    >
      无法打开当前工作簿，请返回列表重新选择，或点击“刷新文档”重试。
    </el-alert>

    <el-card v-if="document" class="collab-editor-page__card">
      <SpreadsheetShell
        :key="document.id"
        :document="document"
        @open-share="openShare"
        @open-history="openHistory"
      />
    </el-card>

    <el-card v-else-if="loading" class="collab-editor-page__loading-card" aria-live="polite">
      <div class="collab-editor-page__loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在加载工作簿，请稍候…</span>
      </div>
    </el-card>

    <el-card v-else-if="!loading && !loadError" class="collab-editor-page__empty-card">
      <el-empty description="正在准备工作簿编辑页面" :image-size="100" />
    </el-card>

    <ShareDialog v-model="shareVisible" :document="document" @updated="handleDocumentUpdated" />
    <VersionPanel v-model="versionVisible" :document="document" @updated="handleDocumentUpdated" />
  </section>
</template>

<script setup>
import { ArrowLeft, Loading, Refresh } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ShareDialog from "@/components/collab/ShareDialog.vue";
import SpreadsheetShell from "@/components/collab/SpreadsheetShell.vue";
import VersionPanel from "@/components/collab/VersionPanel.vue";
import { getCollabDocument } from "@/service/collab-spreadsheet.service";

const route = useRoute();
const router = useRouter();
const document = ref(null);
const loading = ref(false);
const loadError = ref("");
const shareVisible = ref(false);
const versionVisible = ref(false);
let requestSequence = 0;

/**
 * 从路由查询参数读取当前工作簿 UUID；数组参数只取首个值，其他输入交由后端 UUID 校验。
 * @returns {string} 当前编辑页面的文档标识；缺失时返回空字符串。
 */
const documentId = computed(() => {
  const value = route.query.documentId;
  return String(Array.isArray(value) ? value[0] || "" : value || "").trim();
});

/**
 * 将服务端 ISO 时间转换为编辑页头部使用的中文短日期时间。
 * @param {string | null | undefined} value 服务端时间文本。
 * @returns {string} 可读日期时间；无效值返回“暂无记录”。
 */
const formatDateTime = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * 将文件字节数格式化为编辑页元信息使用的可读大小。
 * @param {number | string | null | undefined} value 文件大小，单位为字节。
 * @returns {string} 带二进制单位的文件大小文本；缺失或非法值返回“0 B”。
 */
const formatFileSize = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / (1024 ** unitIndex);
  const precision = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

/**
 * 将文档容量上限格式化为编辑页元信息；未设置上限时提示仍受系统单文件限制保护。
 * @param {number | string | null | undefined} value 文档容量上限，单位为字节。
 * @returns {string} 可读容量上限文本。
 */
const formatStorageLimit = (value) => (value === null || value === undefined ? "未设置" : formatFileSize(value));

/**
 * 读取路由指定文档的最新安全 DTO，忽略旧请求的迟到响应，避免快速切换文档时覆盖当前编辑器。
 * @returns {Promise<void>} 文档加载完成或错误状态更新完成后兑现。
 */
const loadDocument = async () => {
  const sequence = ++requestSequence;
  const targetId = documentId.value;
  document.value = null;
  loadError.value = "";
  if (!targetId) {
    loadError.value = "缺少工作簿标识";
    return;
  }

  loading.value = true;
  try {
    const result = await getCollabDocument(targetId);
    if (sequence === requestSequence) document.value = result;
  } catch (error) {
    if (sequence !== requestSequence) return;
    loadError.value = error?.message || "工作簿加载失败";
    ElNotification.error({ title: "工作簿打开失败", message: loadError.value });
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
};

/**
 * 返回独立编辑页的工作簿列表，保留当前会话的列表筛选状态。
 * @returns {Promise<void>} 路由导航完成后兑现；导航失败由 Vue Router 处理。
 */
const goBack = () => router.push("/collab/spreadsheet");

/**
 * 重新读取当前文档详情和权限，供用户在权限或版本变化后主动刷新编辑页。
 * @returns {Promise<void>} 最新文档 DTO 加载完成后兑现。
 */
const refreshDocument = () => loadDocument();

/**
 * 打开当前文档的分享与所有权管理抽屉。
 * @returns {void} 当前用户具备分享权限时显示抽屉，否则保持编辑页面不变。
 */
const openShare = () => {
  if (document.value?.permission?.canShare !== true) return;
  shareVisible.value = true;
};

/**
 * 打开当前文档的版本历史抽屉。
 * @returns {void} 当前用户具备历史权限时显示抽屉，否则保持编辑页面不变。
 */
const openHistory = () => {
  if (document.value?.permission?.canHistory !== true) return;
  versionVisible.value = true;
};

/**
 * 分享或版本操作成功后重新读取文档 DTO，使所有者、大小、修订和权限摘要保持最新。
 * @param {Record<string, unknown> | undefined} updated 操作组件返回的可选文档摘要。
 * @returns {Promise<void>} 当前编辑页状态同步完成后兑现。
 */
const handleDocumentUpdated = async (updated) => {
  if (updated?.id && updated.id === document.value?.id && updated.ownerUserId) document.value = updated;
  await loadDocument();
};

watch(documentId, () => void loadDocument(), { immediate: true });
</script>

<style lang="scss" scoped>
.collab-editor-page {
  display: flex;
  min-width: 0;
  min-height: calc(100vh - 116px);
  gap: 16px;
  flex-direction: column;
}

.collab-editor-page__heading {
  gap: 18px;
}

.collab-editor-page__heading-copy {
  min-width: 0;
}

.collab-editor-page__back {
  margin-bottom: 8px;
  padding-left: 0;
}

.collab-editor-page__meta {
  display: flex;
  min-width: 0;
  margin: 8px 0 0;
  color: var(--app-muted);
  font-size: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.collab-editor-page__card,
.collab-editor-page__loading-card,
.collab-editor-page__empty-card {
  display: flex;
  min-width: 0;
  min-height: 680px;
  flex: 1 1 auto;
  flex-direction: column;
}

.collab-editor-page__card {
  padding: 0;
}

.collab-editor-page__card :deep(.el-card__body) {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.collab-editor-page__card :deep(.spreadsheet-shell) {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  border: 0;
  box-shadow: none;
}

.collab-editor-page__empty-card {
  align-items: center;
  justify-content: center;
}

.collab-editor-page__loading-state {
  display: flex;
  width: 100%;
  min-height: 240px;
  color: var(--app-muted);
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 760px) {
  .collab-editor-page__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .collab-editor-page__card,
  .collab-editor-page__loading-card,
  .collab-editor-page__empty-card {
    min-height: 560px;
  }
}
</style>
