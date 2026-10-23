<template>
  <el-drawer v-model="visible" title="版本历史" direction="rtl" size="min(430px, 100vw)" class="collab-version-panel">
    <template v-if="document">
      <div class="collab-version-panel__header">
        <div>
          <span class="collab-version-panel__eyebrow">修改与快照</span>
          <p>当前修订 {{ versionState.currentRevision }} · 修改记录 {{ activityState.count }} 条</p>
        </div>
        <el-button
          v-if="document.permission?.canEdit"
          size="small"
          type="primary"
          plain
          :disabled="loading || creating || Boolean(restoringId) || Boolean(loadError)"
          @click="openCreateVersion"
        >
          命名版本
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="collab-version-panel__tabs">
        <el-tab-pane label="修改记录" name="activity">
          <el-alert
            class="collab-version-panel__alert"
            type="info"
            show-icon
            :closable="false"
            title="每次成功保存都会留下记录"
          >
            内容修改、导入、恢复和文档设置变更会追加到记录中；同一内容的重复保存回调不会生成重复快照。
          </el-alert>

          <el-alert
            v-if="activityError"
            class="collab-version-panel__error"
            type="error"
            show-icon
            :closable="false"
            title="修改记录加载失败"
          >
            {{ activityError }}
            <el-button link type="primary" size="small" @click="loadActivity">重新加载</el-button>
          </el-alert>

          <el-skeleton v-if="activityLoading" :rows="5" animated />
          <div v-else-if="!activityError" class="collab-version-panel__list">
            <article v-for="event in activityState.events" :key="event.id" class="collab-version-panel__item">
              <div class="collab-version-panel__activity-dot" aria-hidden="true"></div>
              <div class="collab-version-panel__item-main">
                <div class="collab-version-panel__item-title">
                  <strong>{{ activityActionLabel(event.action) }}</strong>
                  <el-tag v-if="event.action === 'office.callback.saved'" size="small" type="success">已保存</el-tag>
                </div>
                <p>{{ activitySummary(event) }}</p>
                <p>{{ event.actorName }} · {{ formatDateTime(event.createdAt) }}<span v-if="event.revision !== null"> · 修订 {{ event.revision }}</span></p>
              </div>
            </article>
            <el-empty v-if="!activityState.events.length" description="暂无修改记录" :image-size="72" />
            <el-pagination
              v-if="activityState.count > activityState.pageSize"
              class="collab-version-panel__pagination"
              background
              size="small"
              :current-page="activityState.page"
              :page-size="activityState.pageSize"
              :total="activityState.count"
              layout="prev, pager, next"
              @current-change="handleActivityPageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="版本快照" name="versions">
          <el-alert
            class="collab-version-panel__alert"
            type="info"
            show-icon
            :closable="false"
            title="恢复会创建新修订"
          >
            历史版本不会被覆盖；恢复操作会生成新的当前修订并写入审计日志。
          </el-alert>

          <el-alert
            v-if="loadError"
            class="collab-version-panel__error"
            type="error"
            show-icon
            :closable="false"
            title="版本历史加载失败"
          >
            {{ loadError }}
            <el-button link type="primary" size="small" @click="loadVersions">重新加载</el-button>
          </el-alert>

          <el-skeleton v-if="loading" :rows="5" animated />
          <div v-else-if="!loadError" class="collab-version-panel__list">
            <article v-for="version in versionState.versions" :key="version.id" class="collab-version-panel__item">
              <div class="collab-version-panel__item-main">
                <div class="collab-version-panel__item-title">
                  <strong>{{ version.label }}</strong>
                  <el-tag v-if="version.id === versionState.currentVersionId" size="small" type="success">当前</el-tag>
                </div>
                <p>版本 {{ version.versionNo }} · 修订 {{ version.revision }}</p>
                <p>{{ formatDateTime(version.createdAt) }} · {{ formatBytes(version.sizeBytes) }}</p>
              </div>
              <el-button
                v-if="document.permission?.canEdit && version.id !== versionState.currentVersionId"
                size="small"
                link
                type="primary"
                :loading="restoringId === version.id"
                :disabled="creating || Boolean(restoringId)"
                @click="confirmRestore(version)"
              >
                恢复
              </el-button>
            </article>
            <el-empty v-if="!versionState.versions.length" description="暂无版本记录" :image-size="72" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <template #footer>
      <div class="collab-version-panel__footer">
        <span>版本内容不写入浏览器本地存储</span>
        <el-button size="small" :disabled="creating || Boolean(restoringId)" @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-drawer>

  <el-dialog v-model="createDialogVisible" title="创建命名版本" width="420px">
    <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top" size="small">
      <el-form-item label="版本名称" prop="label">
        <el-input v-model="createForm.label" size="small" maxlength="100" show-word-limit placeholder="例如：提交财务审核" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button size="small" @click="createDialogVisible = false">取消</el-button>
      <el-button size="small" type="primary" :loading="creating" :disabled="Boolean(restoringId)" @click="createVersion">保存版本</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, reactive, ref, watch } from "vue";

import {
  createCollabDocumentVersion,
  getCollabDocumentActivity,
  getCollabDocumentVersions,
  restoreCollabDocumentVersion,
} from "@/service/collab-spreadsheet.service";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  document: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(["update:modelValue", "updated"]);
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
const loading = ref(false);
const activityLoading = ref(false);
const creating = ref(false);
const restoringId = ref("");
const loadError = ref("");
const activityError = ref("");
const activeTab = ref("activity");
const createDialogVisible = ref(false);
const createFormRef = ref();
const createForm = reactive({ label: "" });
const createRules = {
  label: [{ required: true, message: "请输入版本名称", trigger: "blur" }],
};
const versionState = reactive({ currentVersionId: null, currentRevision: 0, versions: [] });
const activityState = reactive({ events: [], count: 0, page: 1, pageSize: 50 });

/**
 * 将后端审计动作转换成修改记录的中文标题，未知动作保留为可识别的通用文案。
 * @param {string | undefined} action 服务端审计动作名称。
 * @returns {string} 修改记录标题。
 */
const activityActionLabel = (action) => ({
  "document.created": "创建文档",
  "document.updated": "修改文档设置",
  "document.imported": "导入工作簿",
  "document.exported": "导出工作簿",
  "document.deleted": "删除文档",
  "document.restored": "恢复文档",
  "office.callback.saved": "内容修改",
  "version.created": "创建命名版本",
  "version.restored": "恢复历史版本",
  "access.updated": "修改访问模式",
  "members.updated": "修改成员权限",
  "member.revoked": "移除文档成员",
  "owner.transferred": "转移文件所有权",
}[action] || "文档活动");

/**
 * 根据服务端活动元数据生成简短的修改摘要，不回显文件路径、令牌或文件内容。
 * @param {{action?: string, revision?: number | null, metadata?: Record<string, unknown>}} event 修改记录 DTO。
 * @returns {string} 修改记录摘要。
 */
const activitySummary = (event) => {
  const metadata = event?.metadata || {};
  if (event?.action === "office.callback.saved") {
    const size = metadata.sizeBytes ? `，文件 ${formatBytes(metadata.sizeBytes)}` : "";
    return `在线编辑器自动保存了内容${size}`;
  }
  if (event?.action === "document.imported") {
    const extension = metadata.extension ? String(metadata.extension).toUpperCase() : "工作簿";
    return `导入 ${extension} 文件${metadata.sizeBytes ? `，文件 ${formatBytes(metadata.sizeBytes)}` : ""}`;
  }
  if (event?.action === "document.updated") {
    if (metadata.nameChanged) return "更新了文档名称";
    if (Object.prototype.hasOwnProperty.call(metadata, "storageLimitBytes")) return metadata.storageLimitBytes ? `容量上限调整为 ${formatBytes(metadata.storageLimitBytes)}` : "清除了文档容量上限";
    if (Object.prototype.hasOwnProperty.call(metadata, "allowDownload")) return metadata.allowDownload ? "开启了文档下载" : "关闭了文档下载";
  }
  if (event?.action === "version.restored" && metadata.restoredFromVersionId) return "从历史版本生成新的当前修订";
  return "记录了文档的一次管理操作";
};

/**
 * 将服务端版本字节数转换为适合列表展示的文件大小。
 * @param {number} value 文件大小，单位为字节。
 * @returns {string} 中文文件大小文本。
 */
const formatBytes = (value) => {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * 将服务端 ISO 时间转换为版本历史使用的中文短日期时间。
 * @param {string | null | undefined} value 服务端时间字符串。
 * @returns {string} 可读时间；无效值返回“暂无记录”。
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
 * 加载当前文档版本历史，并把当前 revision 与版本标识同步到面板状态。
 * @returns {Promise<void>} 版本列表加载完成；失败时显示统一通知。
 */
const loadVersions = async () => {
  if (!props.document?.id) return;
  loading.value = true;
  loadError.value = "";
  try {
    const result = await getCollabDocumentVersions(props.document.id);
    versionState.currentVersionId = result?.currentVersionId || null;
    versionState.currentRevision = Number(result?.currentRevision) || 0;
    versionState.versions = Array.isArray(result?.versions) ? result.versions : [];
  } catch (error) {
    loadError.value = error?.message || "请稍后重试。";
    ElNotification.error({ title: "版本历史加载失败", message: error?.message || "请稍后重试。" });
  } finally {
    loading.value = false;
  }
};

/**
 * 加载当前文档的分页修改记录，记录内容由服务端按当前用户的历史权限过滤。
 * @param {number} [targetPage=activityState.page] 要加载的页码。
 * @returns {Promise<void>} 修改记录状态更新完成；失败时显示统一错误提示。
 */
const loadActivity = async (targetPage = activityState.page) => {
  if (!props.document?.id) return;
  activityLoading.value = true;
  activityError.value = "";
  try {
    const result = await getCollabDocumentActivity(props.document.id, {
      page: targetPage,
      pageSize: activityState.pageSize,
    });
    activityState.events = Array.isArray(result?.events) ? result.events : [];
    activityState.count = Number(result?.count) || 0;
    activityState.page = Number(result?.page) || targetPage;
    activityState.pageSize = Number(result?.pageSize) || activityState.pageSize;
  } catch (error) {
    activityError.value = error?.message || "请稍后重试。";
    ElNotification.error({ title: "修改记录加载失败", message: error?.message || "请稍后重试。" });
  } finally {
    activityLoading.value = false;
  }
};

/**
 * 响应修改记录分页器切换，重新请求对应页并保持版本快照状态不变。
 * @param {number} page 要显示的修改记录页码。
 * @returns {Promise<void>} 目标页加载完成后兑现。
 */
const handleActivityPageChange = (page) => loadActivity(Number(page) || 1);

/**
 * 打开命名版本弹窗并清空上一次输入。
 * @returns {void} 更新表单状态并显示弹窗。
 */
const openCreateVersion = () => {
  createForm.label = "";
  createFormRef.value?.clearValidate?.();
  createDialogVisible.value = true;
};

/**
 * 创建一个命名版本并刷新当前面板，版本内容由服务端对象存储保管。
 * @returns {Promise<void>} 保存成功后关闭弹窗并通知父页面；失败时保留输入。
 */
const createVersion = async () => {
  if (creating.value || restoringId.value || loadError.value || !props.document?.id) return;
  try {
    await createFormRef.value?.validate?.();
    creating.value = true;
    const version = await createCollabDocumentVersion(props.document.id, createForm.label);
    ElNotification.success({ title: "版本历史", message: `已创建“${version?.label || createForm.label}”。` });
    createDialogVisible.value = false;
    await loadVersions();
    await loadActivity(1);
  } catch (error) {
    if (error?.errorFields) return;
    ElNotification.error({ title: "版本创建失败", message: error?.message || "版本未能保存，请稍后重试。" });
  } finally {
    creating.value = false;
  }
};

/**
 * 在恢复不可逆地改变当前工作簿前显示中文二次确认。
 * @param {{id: string, label: string, versionNo: number}} version 待恢复历史版本。
 * @returns {Promise<void>} 用户确认后完成恢复并刷新面板；取消时不改变服务端数据。
 */
const confirmRestore = async (version) => {
  if (!version?.id || creating.value || restoringId.value || loadError.value) return;
  try {
    await ElMessageBox.confirm(
      `恢复“${version.label}”会将其作为新的当前修订，当前内容仍保留在版本历史中。确定继续吗？`,
      "恢复版本",
      { type: "warning", confirmButtonText: "确认恢复", cancelButtonText: "取消" }
    );
    restoringId.value = version.id;
    const result = await restoreCollabDocumentVersion(props.document.id, version.id);
    ElNotification.success({ title: "版本历史", message: "版本已恢复，并已生成新的当前修订。" });
    emit("updated", result?.document);
    await loadVersions();
    await loadActivity(1);
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElNotification.error({ title: "版本恢复失败", message: error?.message || "版本未能恢复，请稍后重试。" });
  } finally {
    restoringId.value = "";
  }
};

watch(
  [() => props.modelValue, () => props.document?.id],
  ([value]) => {
    if (value) {
      activeTab.value = "activity";
      void loadVersions();
      void loadActivity(1);
    }
  }
);
</script>

<style lang="scss" scoped>
.collab-version-panel__header,
.collab-version-panel__footer,
.collab-version-panel__item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.collab-version-panel__eyebrow {
  color: var(--app-muted);
  font-size: 12px;
  font-weight: 500;
}

.collab-version-panel__header p,
.collab-version-panel__item p,
.collab-version-panel__footer span {
  margin: 4px 0 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.55;
}

.collab-version-panel__alert {
  margin: 18px 0;
}

.collab-version-panel__tabs {
  margin-top: 10px;
}

.collab-version-panel__error {
  margin: 18px 0;
}

.collab-version-panel__list {
  display: grid;
  gap: 10px;
}

.collab-version-panel__item {
  display: flex;
  min-width: 0;
  padding: 13px 0;
  border-bottom: 1px solid var(--app-border-soft);
  align-items: center;
  gap: 10px;
}

.collab-version-panel__activity-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border: 2px solid var(--app-primary);
  border-radius: 50%;
  background: var(--app-surface);
}

.collab-version-panel__item-main {
  min-width: 0;
  flex: 1 1 auto;
}

.collab-version-panel__item-title {
  justify-content: flex-start;
}

.collab-version-panel__item-title strong {
  overflow: hidden;
  color: var(--app-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collab-version-panel__footer {
  align-items: center;
}

.collab-version-panel__pagination {
  justify-content: center;
}
</style>
