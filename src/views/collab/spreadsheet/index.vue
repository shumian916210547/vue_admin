<template>
  <section class="collab-page management-page list-page" :aria-busy="loading || importing || Boolean(openingDocumentId)">
    <div class="list-page__top">
      <header class="management-page__heading">
        <div>
          <span class="management-page__eyebrow">协同办公</span>
          <h1>协同表格</h1>
          <p>在当前 Company 内管理工作簿、成员权限和版本历史。公开访问仅面向已登录且符合组织范围的成员。</p>
        </div>
        <div class="collab-page__heading-actions management-page__heading-actions">
          <el-button size="small" v-auth="['permission:query', permissions]" :loading="loading" @click="loadDocuments">
            <template #icon><el-icon><Refresh /></el-icon></template>
            刷新列表
          </el-button>
          <el-button v-if="canCreateAndImport" size="small" :loading="importing" :disabled="loading || importing" @click="chooseImportFile">
            <template #icon><el-icon><Upload /></el-icon></template>
            导入文件
          </el-button>
          <el-button v-if="canCreate" size="small" type="primary" :disabled="loading || importing" v-auth="['permission:insert', permissions]" @click="openCreateDialog">
            <template #icon><el-icon><Plus /></el-icon></template>
            新建工作簿
          </el-button>
          <input
            ref="fileInput"
            class="collab-page__file-input"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            aria-label="选择要导入的工作簿"
            @change="handleImportFile"
          />
        </div>
      </header>

      <el-alert
        v-if="loadError"
        class="management-page__alert"
        type="error"
        show-icon
        :title="loadError"
      >{{ loadErrorHint }}</el-alert>

      <div class="collab-page__filter-bar" role="search">
        <span class="collab-page__filter-label">工作簿筛选</span>
        <div class="collab-page__filters">
          <el-input
            v-model="keyword"
            clearable
            size="small"
            class="collab-page__search"
            placeholder="搜索文档名称"
            @keyup.enter="searchDocuments"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="status" size="small" class="collab-page__status-select" @change="searchDocuments">
            <el-option value="active" label="正常文档" />
            <el-option value="archived" label="已归档" />
            <el-option value="deleted" label="已删除" />
          </el-select>
          <el-button size="small" :loading="loading" @click="searchDocuments">查询</el-button>
        </div>
      </div>
    </div>

    <div class="list-page__middle collab-page__middle collab-page__workspace">
      <el-card class="collab-page__list-card">
        <template #header>
          <div class="management-page__card-header management-page__card-header--wrap">
            <span class="management-page__card-title"><el-icon><Grid /></el-icon> 我的工作簿</span>
            <el-tag size="small" type="info">{{ total }} 份</el-tag>
          </div>
        </template>

        <div class="collab-page__table-wrap">
          <el-table
            v-loading="loading"
            class="collab-page__table"
            size="small"
            :data="documents"
            row-key="id"
            @row-click="openDocument"
          >
          <el-table-column label="文档" min-width="250">
            <template #default="{ row }">
              <button class="collab-page__document-button" type="button" @click.stop="openDocument(row)">
                <span class="collab-page__document-icon" aria-hidden="true"><el-icon><Document /></el-icon></span>
                <span class="collab-page__document-copy">
                  <strong>{{ row.name }}</strong>
                  <small>修订 {{ row.currentRevision }} · {{ row.engine === 'onlyoffice' ? 'Office 引擎' : '编辑器待配置' }}</small>
                </span>
              </button>
            </template>
          </el-table-column>
          <el-table-column label="创建者" min-width="132">
            <template #default="{ row }">{{ row.createdByName || "已离职成员" }}</template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="164">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="最近修改时间" min-width="164">
            <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="文件大小" width="106" align="right">
            <template #default="{ row }">
              <span class="collab-page__file-size">
                <span>{{ formatFileSize(row.storageUsedBytes ?? row.fileSizeBytes) }}</span>
                <small v-if="row.storageLimitBytes">上限 {{ formatFileSize(row.storageLimitBytes) }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="访问模式" width="126">
            <template #default="{ row }">
              <el-tag size="small" :type="row.accessMode === 'company_public' ? 'warning' : 'info'">
                {{ accessModeLabel(row.accessMode) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="我的权限" width="108">
            <template #default="{ row }">{{ roleLabel(row.permission?.role) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="92">
            <template #default="{ row }">
              <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="380" fixed="right" class-name="table-operation-column">
            <template #default="{ row }">
              <div class="collab-page__row-actions">
                <el-button
                  v-if="row.status !== 'deleted'"
                  size="small"
                  link
                  type="primary"
                  :loading="openingDocumentId === row.id"
                  :disabled="Boolean(openingDocumentId) || isDocumentBusy(row.id)"
                  @click.stop="openDocument(row)"
                >打开</el-button>
                <el-button
                  v-if="row.permission?.canEdit && row.status !== 'deleted'"
                  size="small"
                  link
                  :disabled="isDocumentBusy(row.id)"
                  v-auth="['permission:edit', permissions]"
                  @click.stop="openRename(row)"
                >重命名</el-button>
                <el-button
                  v-if="row.permission?.canShare"
                  size="small"
                  link
                  type="primary"
                  :disabled="isDocumentBusy(row.id)"
                  v-auth="['permission:share', permissions]"
                  @click.stop="openShare(row)"
                >分享</el-button>
                <el-button
                  v-if="row.permission?.canHistory"
                  size="small"
                  link
                  :disabled="isDocumentBusy(row.id)"
                  @click.stop="openHistory(row)"
                >版本</el-button>
                <el-button
                  v-if="row.permission?.canExport"
                  size="small"
                  link
                  type="success"
                  :loading="pendingDocumentIds.has(row.id)"
                  :disabled="isDocumentBusy(row.id)"
                  v-auth="['permission:export', permissions]"
                  @click.stop="exportDocument(row, $event)"
                >导出</el-button>
                <el-button
                  v-if="row.status === 'deleted'"
                  size="small"
                  link
                  type="warning"
                  :loading="pendingDocumentIds.has(row.id)"
                  :disabled="isDocumentBusy(row.id)"
                  v-auth="['permission:remove', permissions]"
                  @click.stop="restoreDocument(row, $event)"
                >恢复</el-button>
                <el-button
                  v-else-if="row.permission?.canShare"
                  size="small"
                  type="danger"
                  :loading="pendingDocumentIds.has(row.id)"
                  :disabled="isDocumentBusy(row.id)"
                  v-auth="['permission:remove', permissions]"
                  @click.stop="deleteDocument(row, $event)"
                >删除</el-button>
              </div>
            </template>
          </el-table-column>
          </el-table>
          <el-empty v-if="!loading && !documents.length" description="暂无符合条件的工作簿" :image-size="84" />
        </div>
      </el-card>
    </div>

    <div class="list-page__bottom collab-page__bottom">
      <el-pagination
        v-if="total"
        class="collab-page__pagination"
        background
        size="small"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="createDialog.visible" title="新建工作簿" width="460px" @close="resetCreateForm">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top" size="small">
        <el-form-item label="工作簿名称" prop="name">
          <el-input v-model="createForm.name" size="small" maxlength="200" show-word-limit placeholder="请输入工作簿名称" />
        </el-form-item>
        <el-form-item label="访问模式" prop="accessMode">
          <el-radio-group v-model="createForm.accessMode">
            <el-radio value="members">指定成员访问</el-radio>
            <el-radio value="company_public">企业内公开查看</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-alert
          v-if="createForm.accessMode === 'company_public'"
          type="warning"
          show-icon
          :closable="false"
          title="请确认企业内公开范围"
        >
          当前 Company 内符合组织范围的登录成员都可以查看此文档；编辑权限仍需单独指定，公开访问不会创建匿名链接。
        </el-alert>
        <el-form-item label="导出权限">
          <el-switch v-model="createForm.allowDownload" active-text="允许" inactive-text="禁止" />
          <p class="form-item-help">默认禁止导出；创建后 owner 可在文档设置中调整。</p>
        </el-form-item>
        <el-form-item label="文档容量上限">
          <div class="collab-page__storage-row">
            <el-switch v-model="createForm.storageLimitEnabled" active-text="启用上限" inactive-text="不限制" />
            <template v-if="createForm.storageLimitEnabled">
              <el-input-number
                v-model="createForm.storageLimitValue"
                class="collab-page__storage-value"
                size="small"
                :min="1"
                :max="createStorageUnitMax"
                :precision="2"
                controls-position="right"
                aria-label="文档容量数值"
              />
              <el-select v-model="createForm.storageLimitUnit" size="small" class="collab-page__storage-unit" aria-label="文档容量单位">
                <el-option v-for="unit in storageUnits" :key="unit.value" :value="unit.value" :label="unit.label" />
              </el-select>
            </template>
          </div>
          <p class="form-item-help">按 1 KB = 1024 B 计算；服务端会在每次导入或保存时校验。</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="createDialog.visible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="createDialog.submitting" @click="submitCreate">创建工作簿</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renameDialog.visible" title="修改文档名称" width="420px">
      <el-form ref="renameFormRef" :model="renameForm" :rules="renameRules" label-position="top" size="small">
        <el-form-item label="文档名称" prop="name">
          <el-input v-model="renameForm.name" size="small" maxlength="200" show-word-limit placeholder="请输入文档名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="renameDialog.visible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="renameDialog.submitting" @click="submitRename">保存名称</el-button>
      </template>
    </el-dialog>

    <ShareDialog v-model="shareVisible" :document="selectedDocument" @updated="handleShareUpdated" />
    <VersionPanel v-model="versionVisible" :document="selectedDocument" @updated="handleVersionUpdated" />
  </section>
</template>

<script setup>
import { Document, Grid, Plus, Refresh, Search, Upload } from "@element-plus/icons-vue";
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";

import { Mixins } from "@/mixins";
import { getCurrentAuthContext } from "@/service/parse-client";
import {
  createCollabDocument,
  deleteCollabDocument,
  exportCollabDocument,
  getCollabDocument,
  getCollabDocuments,
  importCollabDocument,
  restoreCollabDocument,
  updateCollabDocument,
} from "@/service/collab-spreadsheet.service";

import ShareDialog from "@/components/collab/ShareDialog.vue";
import VersionPanel from "@/components/collab/VersionPanel.vue";

const { queryPermission, toPage } = Mixins();
const permissions = ref([]);

/**
 * 新建工作簿容量表单的二进制单位；提交时会由后端再次转换并限制为安全字节数。
 * @type {ReadonlyArray<{value: "KB" | "MB" | "GB", label: string, multiplier: number}>}
 */
const storageUnits = Object.freeze([
  { value: "KB", label: "KB", multiplier: 1024 },
  { value: "MB", label: "MB", multiplier: 1024 ** 2 },
  { value: "GB", label: "GB", multiplier: 1024 ** 3 },
]);

/**
 * 前端文档容量输入的最大字节数，与后端文档容量安全上限保持一致。
 * @type {number}
 */
const maxStorageLimitBytes = 1024 ** 4;

/**
 * 判断当前岗位是否同时具备查询和新建权限，避免按钮可见但服务端必然拒绝请求。
 * @returns {boolean} 管理员或同时具备 query、insert 权限时返回 true。
 */
const canCreate = computed(() => {
  if (getCurrentAuthContext()?.isAdmin) return true;
  return ["permission:query", "permission:insert"].every((permission) => permissions.value.includes(permission));
});

/**
 * 判断当前岗位是否具备“新建、编辑和导入”页面权限；导入流程会先创建文档再以编辑权限上传文件。
 * @returns {boolean} 管理员或同时具备 query、insert、edit、import 权限时返回 true。
 */
const canCreateAndImport = computed(() => {
  if (getCurrentAuthContext()?.isAdmin) return true;
  return ["permission:query", "permission:insert", "permission:edit", "permission:import"].every((permission) => permissions.value.includes(permission));
});
const documents = ref([]);
const selectedDocument = ref(null);
const loading = ref(false);
const loadError = ref("");
const loadErrorHint = ref("请点击“刷新列表”重试；如果问题持续，请联系管理员检查协同服务状态。");
const keyword = ref("");
const status = ref("active");
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const fileInput = ref();
const importing = ref(false);
const openingDocumentId = ref("");
/**
 * 保存正在导出、删除或恢复的文档 UUID 集合；使用响应式 Set 可同步保护多个文档和同一文档的同一事件循环内重复点击。
 * @type {Set<string>} 当前生命周期操作中的文档标识集合。
 */
const pendingDocumentIds = reactive(new Set());
/**
 * 保存同步事件锁，避免多个浏览器输入事件在 Vue DOM 更新前同时进入同一文档操作。
 * @type {Set<string>} 当前进行中的文档 UUID 集合。
 */
const pendingDocumentOperationIds = new Set();
/**
 * 保存每个进行中文档对应的原生触发元素，使异步 finally 阶段仍能准确移除 DOM 锁标记。
 * @type {Map<string, HTMLElement | null>} 文档 UUID 到触发按钮的映射。
 */
const pendingDocumentTriggers = new Map();
const createFormRef = ref();
const renameFormRef = ref();
const shareVisible = ref(false);
const versionVisible = ref(false);
const createDialog = reactive({ visible: false, submitting: false });
const createForm = reactive({
  name: "未命名工作簿",
  accessMode: "members",
  allowDownload: false,
  storageLimitEnabled: false,
  storageLimitValue: 50,
  storageLimitUnit: "MB",
});
const createRules = {
  name: [{ required: true, message: "请输入工作簿名称", trigger: "blur" }],
  accessMode: [{ required: true, message: "请选择访问模式", trigger: "change" }],
};
const renameDialog = reactive({ visible: false, submitting: false });
const renameForm = reactive({ documentId: "", name: "" });
const renameRules = {
  name: [{ required: true, message: "请输入文档名称", trigger: "blur" }],
};
let requestSequence = 0;
let openRequestSequence = 0;

/**
 * 计算新建表单当前容量单位对应的最大输入值，防止前端数字控件超过服务端允许范围。
 * @returns {number} 当前单位下的最大容量数值。
 */
const createStorageUnitMax = computed(() => {
  const unit = storageUnits.find((item) => item.value === createForm.storageLimitUnit) || storageUnits[1];
  return maxStorageLimitBytes / unit.multiplier;
});

/**
 * 将新建表单的容量设置转换为文档创建接口的结构化字段；关闭开关时不设置文档级上限。
 * @returns {{value: number, unit: "KB" | "MB" | "GB"} | null} 文档容量配置。
 */
const createStorageLimitPayload = () => {
  if (!createForm.storageLimitEnabled) return null;
  return { value: Number(createForm.storageLimitValue), unit: createForm.storageLimitUnit };
};

/**
 * 判断文档是否正在执行导出、删除或恢复，避免重复点击造成并发写入或重复下载。
 * @param {string} documentId 文档 UUID。
 * @returns {boolean} 当前文档存在进行中的操作时返回 true。
 */
const isDocumentBusy = (documentId) => pendingDocumentIds.has(documentId);

/**
 * 在确认框或网络请求开始前同步锁定一个文档操作，同时设置触发按钮标记作为 DOM 级兜底。
 * @param {string} documentId 文档 UUID。
 * @param {Event | undefined} event 点击事件；用于记录原生触发按钮，可选。
 * @returns {boolean} 成功取得锁时返回 true；已有同文档操作时返回 false。
 */
const beginDocumentOperation = (documentId, event) => {
  const trigger = event?.currentTarget;
  if (!documentId || pendingDocumentOperationIds.has(documentId) || trigger?.dataset?.collabOperationLock === "true") return false;
  pendingDocumentOperationIds.add(documentId);
  pendingDocumentIds.add(documentId);
  const elementTrigger = trigger instanceof HTMLElement ? trigger : null;
  pendingDocumentTriggers.set(documentId, elementTrigger);
  if (elementTrigger) elementTrigger.dataset.collabOperationLock = "true";
  return true;
};

/**
 * 释放文档操作锁并清除触发按钮标记，保证取消确认或请求结束后用户仍可重试。
 * @param {string} documentId 文档 UUID。
 * @returns {void} 删除同步锁、响应式锁和按钮标记。
 */
const endDocumentOperation = (documentId) => {
  const trigger = pendingDocumentTriggers.get(documentId);
  pendingDocumentOperationIds.delete(documentId);
  pendingDocumentIds.delete(documentId);
  pendingDocumentTriggers.delete(documentId);
  if (trigger instanceof HTMLElement) delete trigger.dataset.collabOperationLock;
};

/**
 * 将访问模式转换为列表显示文案。
 * @param {string} value 服务端返回的访问模式。
 * @returns {string} 中文访问模式名称。
 */
const accessModeLabel = (value) => (value === "company_public" ? "企业内公开" : "指定成员");

/**
 * 将文档状态转换为中文标签。
 * @param {string} value 服务端返回的文档状态。
 * @returns {string} 中文状态名称。
 */
const statusLabel = (value) => ({ active: "正常", archived: "已归档", deleted: "已删除" }[value] || "未知");

/**
 * 根据文档状态选择 Element Plus 标签颜色。
 * @param {string} value 服务端返回的文档状态。
 * @returns {string} Element Plus 标签类型。
 */
const statusType = (value) => ({ active: "success", archived: "warning", deleted: "danger" }[value] || "info");

/**
 * 将文档角色转换成中文权限名称。
 * @param {string | null | undefined} value 服务端返回的文档角色。
 * @returns {string} 中文权限名称。
 */
const roleLabel = (value) => ({ owner: "创建者", admin: "管理员", editor: "编辑", commenter: "评论", viewer: "查看" }[value] || "--");

/**
 * 将服务端 ISO 时间格式化为列表使用的中文短日期时间。
 * @param {string | null | undefined} value 服务端时间文本。
 * @returns {string} 可读日期时间；无效值返回“暂无记录”。
 */
const formatDateTime = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
};

/**
 * 将服务端返回的文件字节数格式化为列表使用的可读文件大小。
 * @param {number | string | null | undefined} value 文件大小，单位为字节。
 * @returns {string} 带二进制单位的中文列表文本；缺失或非法值返回“0 B”。
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
 * 加载当前筛选条件下的文档列表，忽略较早请求的延迟响应。
 * @returns {Promise<void>} 列表状态和分页信息更新完成；失败时显示错误提示。
 */
const loadDocuments = async () => {
  const sequence = ++requestSequence;
  loading.value = true;
  loadError.value = "";
  loadErrorHint.value = "请点击“刷新列表”重试；如果问题持续，请联系管理员检查协同服务状态。";
  try {
    const result = await getCollabDocuments({ page: page.value, pageSize: pageSize.value, keyword: keyword.value, status: status.value });
    if (sequence !== requestSequence) return;
    documents.value = Array.isArray(result?.documents) ? result.documents : [];
    total.value = Number(result?.count) || 0;
    page.value = Number(result?.page) || page.value;
    pageSize.value = Number(result?.pageSize) || pageSize.value;
    if (selectedDocument.value) {
      const current = documents.value.find((item) => item.id === selectedDocument.value.id);
      if (current) selectedDocument.value = current;
      else selectedDocument.value = null;
    }
  } catch (error) {
    if (sequence !== requestSequence) return;
    loadError.value = error?.message || "协同文档列表加载失败，请稍后重试。";
    if (error?.code === "COLLAB_DATABASE_NOT_READY") {
      loadErrorHint.value = "请先在后端执行 npm run migrate:collab，再点击“刷新列表”重试。";
    } else if (error?.code === "FORBIDDEN") {
      loadErrorHint.value = "当前账号没有协同表格页面权限，请联系管理员配置岗位权限。";
    }
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
};

/**
 * 重新执行当前关键词和状态筛选，并回到第一页。
 * @returns {Promise<void>} 第一页文档加载完成后兑现。
 */
const searchDocuments = async () => {
  page.value = 1;
  await loadDocuments();
};

/**
 * 处理文档列表分页器的每页数量变更。
 * @param {number} value 最新每页数量。
 * @returns {Promise<void>} 第一页文档加载完成后兑现。
 */
const handlePageSizeChange = async (value) => {
  pageSize.value = Number(value) || 20;
  page.value = 1;
  await loadDocuments();
};

/**
 * 处理文档列表分页器的页码变更。
 * @param {number} value 最新页码。
 * @returns {Promise<void>} 对应页文档加载完成后兑现。
 */
const handlePageChange = async (value) => {
  page.value = Number(value) || 1;
  await loadDocuments();
};

/**
 * 打开一份文档的独立编辑页面；详情由编辑页面重新读取，避免列表缓存掩盖最新 ACL 或 revision。
 * @param {{id: string}} record 文档列表行。
 * @returns {Promise<void>} 独立编辑页面导航完成后兑现；失败时提示用户。
 */
const openDocument = async (record) => {
  if (!record?.id) return;
  if (record.status === "deleted") {
    ElNotification.warning({ title: "文档已删除", message: "已删除文档不能直接打开，请先点击“恢复”。" });
    return;
  }
  const sequence = ++openRequestSequence;
  openingDocumentId.value = record.id;
  try {
    if (sequence !== openRequestSequence) return;
    await toPage(
      `/collab/spreadsheet/editor?documentId=${encodeURIComponent(record.id)}`,
      `collab-spreadsheet-editor-${record.id}`,
      `${record.name || "工作簿"} · 编辑`,
    );
  } catch (error) {
    if (sequence === openRequestSequence) {
      ElNotification.error({ title: "文档打开失败", message: error?.message || "当前文档不可访问，请刷新列表。" });
    }
  } finally {
    if (sequence === openRequestSequence) openingDocumentId.value = "";
  }
};

/**
 * 打开文档分享权限抽屉。
 * @param {Record<string, unknown>} record 文档列表行或当前详情。
 * @returns {void} 先选中文档，再显示分享面板。
 */
const openShare = (record) => {
  if (!record?.permission?.canShare) return;
  selectedDocument.value = record;
  shareVisible.value = true;
};

/**
 * 打开文档版本历史抽屉。
 * @param {Record<string, unknown>} record 文档列表行或当前详情。
 * @returns {void} 先选中文档，再显示版本面板。
 */
const openHistory = (record) => {
  if (!record?.id || record.permission?.canHistory !== true) return;
  selectedDocument.value = record;
  versionVisible.value = true;
};

/**
 * 打开新建工作簿弹窗并恢复首期安全默认值。
 * @returns {void} 清空表单校验并显示创建弹窗。
 */
const openCreateDialog = () => {
  resetCreateForm();
  createDialog.visible = true;
};

/**
 * 重置新建工作簿表单，默认指定成员访问且禁止导出。
 * @returns {void} 更新响应式表单并清除校验状态。
 */
const resetCreateForm = () => {
  Object.assign(createForm, {
    name: "未命名工作簿",
    accessMode: "members",
    allowDownload: false,
    storageLimitEnabled: false,
    storageLimitValue: 50,
    storageLimitUnit: "MB",
  });
  createFormRef.value?.clearValidate?.();
};

/**
 * 创建工作簿；企业内公开模式先要求中文二次确认，避免误把文档暴露给全 Company。
 * @returns {Promise<void>} 创建成功后刷新并打开新文档；失败时保留表单。
 */
const submitCreate = async () => {
  try {
    await createFormRef.value?.validate?.();
    if (createForm.accessMode === "company_public") {
      await ElMessageBox.confirm(
        "企业内公开会让当前 Company 内符合组织范围的登录成员查看此文档，编辑权限仍需单独指定。确定继续吗？",
        "确认公开访问",
        { type: "warning", confirmButtonText: "确认创建", cancelButtonText: "取消" }
      );
    }
    createDialog.submitting = true;
    const document = await createCollabDocument({
      name: createForm.name,
      accessMode: createForm.accessMode,
      allowDownload: createForm.allowDownload,
      storageLimit: createStorageLimitPayload(),
    });
    ElNotification.success({ title: "协同表格", message: "空白工作簿已创建。" });
    createDialog.visible = false;
    await loadDocuments();
    await openDocument(document);
  } catch (error) {
    if (error === "cancel" || error === "close" || error?.errorFields) return;
    ElNotification.error({ title: "工作簿创建失败", message: error?.message || "文档未能创建，请稍后重试。" });
  } finally {
    createDialog.submitting = false;
  }
};

/**
 * 打开系统文件选择器；浏览器只选择文件，最终格式和内容仍由 BFF 校验。
 * @returns {void} 触发隐藏 file input 的点击事件。
 */
const chooseImportFile = () => fileInput.value?.click();

/**
 * 将浏览器文件名转换为安全的工作簿名称，不把原始路径或控制字符提交给服务端。
 * @param {string} value 浏览器提供的文件名。
 * @returns {string} 可用于文档名称的文本。
 */
const importDocumentName = (value) => {
  const withoutExtension = String(value || "未命名工作簿").replace(/\.[^.]+$/, "");
  const safe = withoutExtension.replace(/[\\/\u0000-\u001f\u007f]/g, " ").trim().slice(0, 200);
  return safe || "导入工作簿";
};

/**
 * 通过“先创建安全文档、再导入文件”完成导入，失败时保留空白文档以便用户重试。
 * @param {Event} event file input change 事件。
 * @returns {Promise<void>} 导入完成并打开文档，或显示失败提示。
 */
const handleImportFile = async (event) => {
  const file = event.target?.files?.[0];
  event.target.value = "";
  if (!file || importing.value) return;
  let createdDocument;
  importing.value = true;
  try {
    createdDocument = await createCollabDocument({ name: importDocumentName(file.name), accessMode: "members", allowDownload: false });
    const imported = await importCollabDocument(createdDocument.id, file);
    ElNotification.success({ title: "协同表格", message: "文件已导入并生成新版本。" });
    await loadDocuments();
    await openDocument(imported);
  } catch (error) {
    let cleanedUp = false;
    let cleanupError = null;
    if (createdDocument?.id) {
      try {
        await deleteCollabDocument(createdDocument.id);
        cleanedUp = true;
        if (selectedDocument.value?.id === createdDocument.id) selectedDocument.value = null;
        await loadDocuments();
      } catch (errorDuringCleanup) {
        cleanupError = errorDuringCleanup;
        selectedDocument.value = createdDocument;
      }
    }
    const message = error?.message || "文件未能导入，请检查格式和大小后重试。";
    const cleanupHint = cleanupError?.message ? ` 清理失败原因：${cleanupError.message}` : "";
    ElNotification.error({
      title: "文件导入失败",
      message: cleanedUp ? `${message} 未创建空白工作簿，可以直接重新选择文件。` : `${message} 临时工作簿未能自动清理，请在列表中删除后重试。${cleanupHint}`,
    });
  } finally {
    importing.value = false;
  }
};

/**
 * 打开文档名称编辑弹窗；名称保存通过 BFF owner/editor 权限再次校验。
 * @param {{id: string, name: string, permission?: {canEdit?: boolean}}} record 文档列表行。
 * @returns {void} 回填名称并显示弹窗；无编辑权限时不执行操作。
 */
const openRename = (record) => {
  if (!record?.permission?.canEdit) return;
  Object.assign(renameForm, { documentId: record.id, name: record.name || "" });
  renameFormRef.value?.clearValidate?.();
  renameDialog.visible = true;
};

/**
 * 提交文档名称修改并同步当前选中文档。
 * @returns {Promise<void>} 保存成功后刷新列表；失败时保留弹窗内容。
 */
const submitRename = async () => {
  try {
    await renameFormRef.value?.validate?.();
    renameDialog.submitting = true;
    const updated = await updateCollabDocument(renameForm.documentId, { name: renameForm.name });
    renameDialog.visible = false;
    if (selectedDocument.value?.id === updated?.id) selectedDocument.value = updated;
    await loadDocuments();
    ElNotification.success({ title: "协同表格", message: "文档名称已更新。" });
  } catch (error) {
    if (error?.errorFields) return;
    ElNotification.error({ title: "名称修改失败", message: error?.message || "文档名称未能更新。" });
  } finally {
    renameDialog.submitting = false;
  }
};

/**
 * 软删除文档前显示中文二次确认，说明版本和恢复窗口不会立即清理。
 * @param {{id: string, name: string}} record 文档列表行。
 * @returns {Promise<void>} 用户确认后完成删除并刷新列表；取消时不改变数据。
 */
const deleteDocument = async (record, event) => {
  if (!record?.id || !beginDocumentOperation(record.id, event)) return;
  try {
    await ElMessageBox.confirm(`删除“${record.name}”后，文档会从普通列表隐藏，但版本文件会在恢复窗口内保留。确定继续吗？`, "删除工作簿", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消",
    });
    await deleteCollabDocument(record.id);
    if (selectedDocument.value?.id === record.id) selectedDocument.value = null;
    ElNotification.success({ title: "协同表格", message: "文档已软删除。" });
    await loadDocuments();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElNotification.error({ title: "删除失败", message: error?.message || "文档未能删除，请稍后重试。" });
  } finally {
    endDocumentOperation(record.id);
  }
};

/**
 * 恢复软删除文档前显示中文二次确认，并重新获取恢复后的 ACL 摘要。
 * @param {{id: string, name: string}} record 已删除文档列表行。
 * @returns {Promise<void>} 恢复成功后刷新列表；取消时不改变数据。
 */
const restoreDocument = async (record, event) => {
  if (!record?.id || !beginDocumentOperation(record.id, event)) return;
  try {
    await ElMessageBox.confirm(`恢复“${record.name}”会重新开放当前文档及其成员权限。确定继续吗？`, "恢复工作簿", {
      type: "warning",
      confirmButtonText: "确认恢复",
      cancelButtonText: "取消",
    });
    const restored = await restoreCollabDocument(record.id);
    status.value = "active";
    page.value = 1;
    await loadDocuments();
    await openDocument(restored);
    ElNotification.success({ title: "协同表格", message: "文档已恢复。" });
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElNotification.error({ title: "恢复失败", message: error?.message || "文档未能恢复，请稍后重试。" });
  } finally {
    endDocumentOperation(record.id);
  }
};

/**
 * 下载当前文档，统一显示服务端 ACL 和文件状态错误。
 * @param {{id: string, name?: string}} record 文档列表行。
 * @returns {Promise<void>} 下载触发后兑现；失败时显示通知。
 */
const exportDocument = async (record, event) => {
  if (!record?.id || !beginDocumentOperation(record.id, event)) return;
  try {
    const fileName = await exportCollabDocument(record.id);
    ElNotification.success({ title: "协同表格", message: `已开始下载 ${fileName}。` });
  } catch (error) {
    ElNotification.error({ title: "导出失败", message: error?.message || "文档未能导出，请检查下载权限。" });
  } finally {
    endDocumentOperation(record.id);
  }
};

/**
 * 分享保存后重新读取文档详情，保证访问模式和 accessVersion 与服务端一致。
 * @returns {Promise<void>} 详情刷新完成后关闭旧状态；失败时保留当前文档摘要。
 */
const handleShareUpdated = async () => {
  if (!selectedDocument.value?.id) return;
  try {
    selectedDocument.value = await getCollabDocument(selectedDocument.value.id);
    await loadDocuments();
  } catch (error) {
    ElNotification.error({ title: "文档状态刷新失败", message: error?.message || "请手动刷新文档列表。" });
  }
};

/**
 * 版本恢复后同步文档详情和列表 revision，避免编辑器继续使用旧配置。
 * @param {Record<string, unknown> | undefined} document 恢复接口返回的文档 DTO。
 * @returns {Promise<void>} 状态同步完成后兑现。
 */
const handleVersionUpdated = async (document) => {
  if (document?.id) selectedDocument.value = document;
  await loadDocuments();
};

onMounted(async () => {
  try {
    permissions.value = await queryPermission();
  } catch (error) {
    permissions.value = [];
    ElNotification.warning({ title: "页面权限加载失败", message: error?.message || "部分操作按钮暂不可用，请刷新页面重试。" });
  }
  await loadDocuments();
});
</script>

<style lang="scss" scoped>
.collab-page {
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0;
  flex-direction: column;
}

.collab-page__heading-actions,
.collab-page__row-actions,
.collab-page__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.collab-page__heading-actions {
  justify-content: flex-end;
}

.collab-page__file-input {
  display: none;
}

.collab-page__file-size {
  display: grid;
  justify-items: end;
  gap: 2px;
}

.collab-page__file-size small {
  color: var(--app-muted);
  font-size: 10px;
}

.collab-page__storage-row {
  display: flex;
  min-width: 0;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.collab-page__storage-value {
  min-width: 0;
  flex: 1 1 auto;
}

.collab-page__storage-unit {
  width: 84px;
  flex: 0 0 auto;
}

.collab-page__workspace {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 1 1 auto;
}

.collab-page__list-card {
  min-width: 0;
  min-height: 0;
}

.collab-page__list-card {
  display: flex;
  width: 100%;
  flex-direction: column;
}

.collab-page__list-card :deep(.el-card__body) {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.collab-page__filter-bar {
  display: flex;
  min-width: 0;
  margin-bottom: 18px;
  padding: 12px 16px;
  background: var(--app-surface);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-soft);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.collab-page__filter-label {
  color: var(--app-ink);
  font-size: 13px;
  font-weight: 700;
}

.collab-page__filters {
  justify-content: flex-end;
}

.collab-page__search {
  width: min(100%, 240px);
}

.collab-page__status-select {
  width: 118px;
}

.collab-page__table {
  min-width: 0;
  flex: 1 1 auto;
}

.collab-page__table-wrap {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.collab-page__document-button {
  display: flex;
  width: 100%;
  min-width: 0;
  padding: 0;
  color: inherit;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;
  align-items: center;
  gap: 9px;
}

.collab-page__document-icon {
  display: grid;
  width: 30px;
  height: 30px;
  color: var(--app-primary);
  border-radius: 8px;
  background: var(--app-primary-soft);
  place-items: center;
  flex: 0 0 auto;
}

.collab-page__document-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.collab-page__document-copy strong,
.collab-page__document-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collab-page__document-copy strong {
  color: var(--app-ink);
  font-weight: 650;
}

.collab-page__document-copy small {
  color: var(--app-muted);
  font-size: 11px;
}

.collab-page__row-actions {
  min-width: max-content;
  flex-wrap: nowrap;
  gap: 3px;
}

.collab-page__pagination {
  justify-content: flex-end;
  padding-top: 14px;
}

@media (max-width: 640px) {
  .collab-page__storage-row {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .collab-page__storage-row :deep(.el-switch) {
    width: 100%;
  }

  .collab-page__storage-value,
  .collab-page__storage-unit {
    width: auto;
    flex: 1 1 120px;
  }

  .collab-page__list-card {
    min-height: 0;
  }

  .collab-page__heading-actions {
    justify-content: flex-start;
  }

  .collab-page__filter-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .collab-page__filters {
    justify-content: flex-start;
  }

  .collab-page__search {
    width: min(100%, 100%);
  }

  .collab-page__status-select {
    width: 132px;
  }
}
</style>
