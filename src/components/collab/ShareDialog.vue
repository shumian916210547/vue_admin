<template>
  <el-drawer v-model="visible" title="分享与权限" direction="rtl" size="min(430px, 100vw)" class="collab-share-dialog">
    <template v-if="document">
      <el-alert
        v-if="loadError"
        type="error"
        show-icon
        :closable="false"
        title="分享配置暂不可用"
      >
        {{ loadError }}
        <el-button link type="primary" size="small" @click="loadShareData">重新加载</el-button>
      </el-alert>
      <el-alert
        v-if="document.accessMode === 'company_public'"
        type="warning"
        show-icon
        :closable="false"
        title="企业内公开"
      >
        当前 Company 内符合组织范围的登录成员可以查看；编辑和导出仍需单独授权。
      </el-alert>

      <el-form class="collab-share-dialog__form" label-position="top" size="small" :disabled="loading || saving || transferring || Boolean(loadError)">
        <el-form-item label="访问模式">
          <el-radio-group v-model="draftAccessMode">
            <el-radio value="members">指定成员访问</el-radio>
            <el-radio value="company_public">企业内公开查看</el-radio>
          </el-radio-group>
          <p class="form-item-help">企业内公开仅面向已登录且符合组织范围的成员，不会创建匿名互联网链接。</p>
        </el-form-item>
        <el-form-item label="组织范围">
        <el-input :model-value="organizationLabel" size="small" disabled placeholder="Company 全部成员" />
          <p class="form-item-help">组织范围由创建文档时确定；如需调整，请新建文档并重新选择范围。</p>
        </el-form-item>
        <el-form-item label="下载与导出">
          <el-checkbox v-model="draftAllowDownload">允许符合条件的成员下载或导出</el-checkbox>
          <p class="form-item-help">关闭后所有成员都不能下载；开启后仍需满足成员的单独导出权限。</p>
        </el-form-item>
        <el-form-item label="文档容量上限">
          <div class="collab-share-dialog__storage-row">
            <el-switch v-model="draftStorageLimitEnabled" active-text="启用上限" inactive-text="不限制" />
            <template v-if="draftStorageLimitEnabled">
              <el-input-number
                v-model="draftStorageLimitValue"
                class="collab-share-dialog__storage-value"
                size="small"
                :min="1"
                :max="storageUnitMax"
                :precision="2"
                controls-position="right"
                aria-label="文档容量数值"
              />
              <el-select v-model="draftStorageLimitUnit" size="small" class="collab-share-dialog__storage-unit" aria-label="文档容量单位">
                <el-option v-for="unit in storageUnits" :key="unit.value" :value="unit.value" :label="unit.label" />
              </el-select>
            </template>
          </div>
          <p class="form-item-help">
            当前占用 {{ formatBytes(props.document?.storageUsedBytes ?? props.document?.fileSizeBytes) }}；按 1 KB = 1024 B 计算，保存和导入时由服务端强制校验。
          </p>
        </el-form-item>
      </el-form>

      <div class="collab-share-dialog__section-title">
        <span>指定成员</span>
        <el-tag size="small" type="info">{{ activeMembers.length }} 人</el-tag>
      </div>
      <div class="collab-share-dialog__add-row">
        <el-select
          v-model="newMemberId"
          size="small"
          filterable
          placeholder="请选择企业成员"
          class="collab-share-dialog__member-select"
          :loading="loadingOptions"
          :disabled="loading || saving || transferring || Boolean(loadError)"
        >
          <el-option
            v-for="option in availableMemberOptions"
            :key="option.userId"
            :label="memberOptionLabel(option)"
            :value="option.userId"
          />
        </el-select>
        <el-select
          v-model="newMemberRole"
          size="small"
          class="collab-share-dialog__role-select"
          aria-label="新增成员角色"
          :disabled="loading || saving || transferring || Boolean(loadError)"
        >
          <el-option value="viewer" label="查看" />
          <el-option value="commenter" label="评论" />
          <el-option value="editor" label="编辑" />
        </el-select>
        <el-button
          type="primary"
          size="small"
          plain
          :disabled="!newMemberId || loading || saving || transferring || Boolean(loadError)"
          @click="addMember"
        >添加</el-button>
      </div>

      <section v-if="document.permission?.canShare" class="collab-share-dialog__ownership">
        <div class="collab-share-dialog__section-title">
          <span>文件所有权</span>
          <el-tag size="small" type="warning">当前：{{ document.ownerName || "已离职成员" }}</el-tag>
        </div>
        <p class="form-item-help">转移后当前所有者会保留编辑权限，新所有者负责后续分享、权限和所有权管理。</p>
        <div class="collab-share-dialog__owner-row">
          <el-select
            v-model="newOwnerId"
            size="small"
            filterable
            clearable
            placeholder="选择新的所有者"
            class="collab-share-dialog__owner-select"
            :loading="loadingOptions"
            :disabled="loading || saving || transferring || Boolean(loadError)"
            aria-label="新的文件所有者"
          >
            <el-option
              v-for="option in ownershipOptions"
              :key="option.userId"
              :label="memberOptionLabel(option)"
              :value="option.userId"
            />
          </el-select>
          <el-button
            type="warning"
            size="small"
            plain
            :loading="transferring"
            :disabled="!newOwnerId || loading || saving || transferring || Boolean(loadError)"
            @click="transferOwnership"
          >转移所有权</el-button>
        </div>
      </section>

      <el-table
        v-loading="loading || saving || transferring"
        :data="activeMembers"
        size="small"
        class="collab-share-dialog__table"
        row-key="userId"
      >
        <el-table-column label="成员" min-width="150">
          <template #default="{ row }">
            <div class="collab-share-dialog__member">
              <strong>{{ row.user?.name || row.user?.username || row.userId }}</strong>
              <span>{{ row.user?.username || "" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="112">
          <template #default="{ row }">
            <el-select v-model="row.role" size="small" :disabled="row.role === 'owner' || loading || saving || transferring || Boolean(loadError)">
              <el-option value="viewer" label="查看" />
              <el-option value="commenter" label="评论" />
              <el-option value="editor" label="编辑" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="导出" width="62" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.canDownload" :disabled="row.role === 'owner' || loading || saving || transferring || Boolean(loadError)" aria-label="允许导出" />
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="96" fixed="right" class-name="table-operation-column">
          <template #default="{ row }">
            <el-button v-if="row.role !== 'owner'" link type="danger" size="small" :disabled="loading || saving || transferring || Boolean(loadError)" @click="removeMember(row)">移除</el-button>
            <span v-else class="collab-share-dialog__owner-label">创建者</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !activeMembers.length" description="尚未指定其他成员" :image-size="72" />
    </template>

    <template #footer>
      <div class="collab-share-dialog__footer">
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" :disabled="loading || transferring || Boolean(loadError)" @click="save">保存分享设置</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, ref, watch } from "vue";
import {
  getCollabDocumentMembers,
  getCollabMemberOptions,
  saveCollabDocumentMembers,
  transferCollabDocumentOwnership,
  updateCollabDocument,
  updateCollabAccess,
} from "@/service/collab-spreadsheet.service";

/**
 * 文档容量表单可选择的二进制单位；服务端最终按字节保存和校验。
 * @type {ReadonlyArray<{value: "KB" | "MB" | "GB", label: string, multiplier: number}>}
 */
const STORAGE_UNITS = Object.freeze([
  { value: "KB", label: "KB", multiplier: 1024 },
  { value: "MB", label: "MB", multiplier: 1024 ** 2 },
  { value: "GB", label: "GB", multiplier: 1024 ** 3 },
]);

/**
 * 前端容量输入上限，与后端 normalizeStorageLimit 的 1 TB 安全上限保持一致。
 * @type {number}
 */
const MAX_STORAGE_LIMIT_BYTES = 1024 ** 4;

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
const loadingOptions = ref(false);
const saving = ref(false);
const transferring = ref(false);
const loadError = ref("");
const members = ref([]);
const memberOptions = ref([]);
const accessVersion = ref(0);
const draftAccessMode = ref("members");
const draftAllowDownload = ref(false);
const originalAccessMode = ref("members");
const originalAllowDownload = ref(false);
const originalStorageLimitBytes = ref(null);
const draftStorageLimitEnabled = ref(false);
const draftStorageLimitValue = ref(50);
const draftStorageLimitUnit = ref("MB");
const organizationId = ref(null);
const newMemberId = ref("");
const newMemberRole = ref("viewer");
const newOwnerId = ref("");
const originalMemberFingerprint = ref("");

/**
 * 计算当前容量单位下允许输入的最大数值，服务端总上限为 1 TB。
 * @returns {number} 当前单位对应的最大容量数值。
 */
const storageUnitMax = computed(() => {
  const unit = STORAGE_UNITS.find((item) => item.value === draftStorageLimitUnit.value) || STORAGE_UNITS[1];
  return MAX_STORAGE_LIMIT_BYTES / unit.multiplier;
});

/**
 * 将字节上限转换为编辑表单使用的最大整单位表示，优先保留 GB/MB/KB 的精确值。
 * @param {number | string | null | undefined} bytes 文档容量上限，单位为字节。
 * @returns {{enabled: boolean, value: number, unit: "KB" | "MB" | "GB"}} 表单容量草稿。
 */
const storageLimitDraft = (bytes) => {
  const numeric = Number(bytes);
  if (!Number.isSafeInteger(numeric) || numeric < 1024) return { enabled: false, value: 50, unit: "MB" };
  const unit = [...STORAGE_UNITS].reverse().find((item) => numeric >= item.multiplier && numeric % item.multiplier === 0) || STORAGE_UNITS[0];
  return { enabled: true, value: numeric / unit.multiplier, unit: unit.value };
};

/**
 * 将当前容量表单转换为服务端接受的结构化上限；关闭开关时返回 null 表示清除文档级上限。
 * @returns {{value: number, unit: "KB" | "MB" | "GB"} | null} 文档容量请求体字段。
 */
const draftStorageLimit = () => {
  if (!draftStorageLimitEnabled.value) return null;
  return { value: Number(draftStorageLimitValue.value), unit: draftStorageLimitUnit.value };
};

/**
 * 将字节数格式化为分享面板容量说明，统一使用二进制 KB/MB/GB 单位。
 * @param {number | string | null | undefined} value 文件大小，单位为字节。
 * @returns {string} 可读文件大小；缺失或非法值返回“0 B”。
 */
const formatBytes = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / (1024 ** unitIndex);
  const precision = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

/**
 * 过滤掉已经在 ACL 中的成员，避免同一成员在前端草稿中重复出现。
 * @returns {Array<Record<string, unknown>>} 可添加的成员选项。
 */
const availableMemberOptions = computed(() => {
  const selected = new Set(members.value.map((member) => member.userId));
  return memberOptions.value.filter((option) => !selected.has(option.userId));
});

/**
 * 返回所有可被转移所有权的有效成员；与新增成员选项不同，已在 ACL 中的成员也必须保留在候选集合内。
 * @returns {Array<Record<string, unknown>>} 当前 Company 和文档组织范围内的有效成员选项。
 */
const ownershipOptions = computed(() => memberOptions.value);

/**
 * 只显示 active ACL，revoked 记录由服务端保留用于审计但不参与本次批量保存。
 * @returns {Array<Record<string, unknown>>} 当前有效成员草稿。
 */
const activeMembers = computed(() => members.value.filter((member) => member.status === "active"));

/**
 * 将文档组织范围转换成分享面板的中文提示。
 * @returns {string} 组织范围文案。
 */
const organizationLabel = computed(() => (props.document?.organizationId ? "指定组织及其下级成员" : "Company 全部成员"));

/**
 * 生成成员下拉选项标签，保留账号作为重复姓名时的识别信息。
 * @param {{name?: string, username?: string, email?: string}} option 成员选项。
 * @returns {string} 成员显示文本。
 */
const memberOptionLabel = (option) => `${option.name || "未命名成员"}（${option.username || option.email || "无账号"}）`;

/**
 * 生成成员 ACL 草稿的稳定指纹，用于识别分享面板的无变化保存并避免无意义递增 accessVersion。
 * @param {Array<Record<string, unknown>>} items 当前成员草稿数组。
 * @returns {string} 按 userId 排序的角色与下载权限指纹。
 */
const memberFingerprint = (items) => items
  .filter((member) => member.status === "active")
  .map((member) => ({
    userId: member.userId,
    role: member.role,
    canDownload: member.canDownload === true,
  }))
  .sort((left, right) => String(left.userId).localeCompare(String(right.userId)))
  .map((member) => JSON.stringify(member))
  .join("|");

/**
 * 读取文档当前成员 ACL 与可分享成员选项，打开弹窗时刷新以获得最新 accessVersion。
 * @returns {Promise<void>} 两个请求完成后更新草稿；失败时显示统一错误通知。
 */
const loadShareData = async () => {
  if (!props.document?.id) return;
  loading.value = true;
  loadingOptions.value = true;
  loadError.value = "";
  members.value = [];
  memberOptions.value = [];
  try {
    const [memberResult, optionResult] = await Promise.all([
      getCollabDocumentMembers(props.document.id),
      getCollabMemberOptions(props.document.id),
    ]);
    members.value = Array.isArray(memberResult?.members)
      ? memberResult.members.filter((member) => member.status === "active").map((member) => ({ ...member }))
      : [];
    originalMemberFingerprint.value = memberFingerprint(members.value);
    memberOptions.value = Array.isArray(optionResult) ? optionResult : [];
    accessVersion.value = Number(memberResult?.accessVersion) || Number(props.document.accessVersion) || 1;
    organizationId.value = memberResult?.organizationId || props.document.organizationId || null;
    originalAccessMode.value = memberResult?.accessMode || props.document.accessMode || "members";
    originalAllowDownload.value = memberResult?.allowDownload === undefined
      ? props.document.allowDownload === true
      : memberResult.allowDownload === true;
    const configuredStorageLimit = memberResult?.storageLimitBytes === undefined
      ? props.document.storageLimitBytes
      : memberResult.storageLimitBytes;
    const storageDraft = storageLimitDraft(configuredStorageLimit);
    originalStorageLimitBytes.value = storageDraft.enabled ? Number(configuredStorageLimit) : null;
    draftStorageLimitEnabled.value = storageDraft.enabled;
    draftStorageLimitValue.value = storageDraft.value;
    draftStorageLimitUnit.value = storageDraft.unit;
    draftAccessMode.value = originalAccessMode.value;
    draftAllowDownload.value = originalAllowDownload.value;
    newMemberId.value = "";
    newOwnerId.value = "";
  } catch (error) {
    loadError.value = error?.message || "请稍后重试。";
    ElNotification.error({ title: "分享配置加载失败", message: error?.message || "请稍后重试。" });
  } finally {
    loading.value = false;
    loadingOptions.value = false;
  }
};

/**
 * 将所选成员追加到本地 ACL 草稿，不立即写入服务端。
 * @returns {void} 更新成员草稿并清空新增选择器。
 */
const addMember = () => {
  const option = memberOptions.value.find((item) => item.userId === newMemberId.value);
  if (!option || members.value.some((member) => member.userId === option.userId)) return;
  members.value.push({
    userId: option.userId,
    role: newMemberRole.value,
    status: "active",
    canDownload: false,
    user: option,
  });
  newMemberId.value = "";
};

/**
 * 从本地 ACL 草稿移除成员；真正的撤销在点击保存时通过批量接口提交。
 * @param {{userId: string, role?: string}} member 待移除成员草稿。
 * @returns {void} 从响应式成员数组中移除非 owner 成员。
 */
const removeMember = (member) => {
  if (member.role === "owner") return;
  members.value = members.value.filter((item) => item.userId !== member.userId);
};

/**
 * 先保存访问模式再保存成员 ACL，始终使用最新 accessVersion 以防覆盖其他操作者的改动。
 * @returns {Promise<void>} 保存成功后关闭弹窗并通知父页面刷新文档；失败时保留草稿。
 */
const save = async () => {
  if (!props.document?.id || loading.value || loadError.value || saving.value || transferring.value) return;
  const nextStorageLimit = draftStorageLimit();
  const nextStorageLimitBytes = nextStorageLimit
    ? nextStorageLimit.value * (STORAGE_UNITS.find((item) => item.value === nextStorageLimit.unit)?.multiplier || 1)
    : null;
  const currentStorageBytes = Number(props.document.storageUsedBytes ?? props.document.fileSizeBytes) || 0;
  if (nextStorageLimitBytes !== null && (!Number.isSafeInteger(nextStorageLimitBytes) || nextStorageLimitBytes < currentStorageBytes)) {
    ElNotification.warning({ title: "容量上限无效", message: "文档容量上限不能小于当前占用空间。" });
    return;
  }
  saving.value = true;
  try {
    let currentVersion = accessVersion.value;
    if (nextStorageLimitBytes !== originalStorageLimitBytes.value) {
      const updatedDocument = await updateCollabDocument(props.document.id, { storageLimit: nextStorageLimit });
      currentVersion = Number(updatedDocument?.accessVersion) || currentVersion;
    }
    if (draftAllowDownload.value !== originalAllowDownload.value) {
      const updatedDocument = await updateCollabDocument(props.document.id, { allowDownload: draftAllowDownload.value });
      currentVersion = Number(updatedDocument?.accessVersion) || currentVersion + 1;
    }
    if (draftAccessMode.value !== originalAccessMode.value) {
      const updatedDocument = await updateCollabAccess(props.document.id, {
        accessMode: draftAccessMode.value,
        organizationId: organizationId.value,
        expectedAccessVersion: currentVersion,
      });
      currentVersion = Number(updatedDocument?.accessVersion) || currentVersion + 1;
    }
    if (memberFingerprint(activeMembers.value) !== originalMemberFingerprint.value) {
      const result = await saveCollabDocumentMembers(props.document.id, {
        expectedAccessVersion: currentVersion,
        members: activeMembers.value
          .filter((member) => member.role !== "owner")
          .map((member) => ({ userId: member.userId, role: member.role, canDownload: member.canDownload === true })),
      });
      currentVersion = Number(result?.accessVersion) || currentVersion + 1;
    }
    ElNotification.success({ title: "分享与权限", message: "文档访问设置已保存。" });
    emit("updated", {
      accessVersion: currentVersion,
      accessMode: draftAccessMode.value,
      allowDownload: draftAllowDownload.value,
    });
    visible.value = false;
  } catch (error) {
    if (error?.code === "COLLAB_ACCESS_VERSION_CONFLICT") {
      await loadShareData();
      ElNotification.warning({ title: "分享配置已刷新", message: "其他成员刚刚修改了权限，请确认最新配置后再保存。" });
      return;
    }
    ElNotification.error({ title: "分享设置保存失败", message: error?.message || "配置未保存，请刷新后重试。" });
  } finally {
    saving.value = false;
  }
};

/**
 * 在中文二次确认后提交所有权转移；成功后关闭抽屉并通知父页面刷新文档和权限摘要。
 * @returns {Promise<void>} 转移完成、冲突刷新或错误通知显示后兑现；失败时保留抽屉状态供用户重试。
 */
const transferOwnership = async () => {
  if (!props.document?.id || !newOwnerId.value || loading.value || saving.value || transferring.value || loadError.value) return;
  const target = ownershipOptions.value.find((option) => option.userId === newOwnerId.value);
  if (!target) return;
  try {
    await ElMessageBox.confirm(
      `确定将“${props.document.name}”的所有权转移给${memberOptionLabel(target)}吗？转移后当前所有者将保留编辑权限，但不再负责分享和所有权管理。`,
      "确认转移文件所有权",
      {
        type: "warning",
        confirmButtonText: "确认转移",
        cancelButtonText: "取消",
      },
    );
    transferring.value = true;
    const updated = await transferCollabDocumentOwnership(props.document.id, {
      newOwnerUserId: newOwnerId.value,
      expectedAccessVersion: accessVersion.value,
    });
    ElNotification.success({ title: "文件所有权", message: `所有权已转移给${target.name || target.username || "新成员"}。` });
    emit("updated", updated);
    visible.value = false;
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    if (error?.code === "COLLAB_ACCESS_VERSION_CONFLICT") {
      await loadShareData();
      ElNotification.warning({ title: "所有权配置已刷新", message: "其他成员刚刚修改了权限，请确认最新配置后再转移。" });
      return;
    }
    ElNotification.error({ title: "所有权转移失败", message: error?.message || "所有权未转移，请稍后重试。" });
  } finally {
    transferring.value = false;
  }
};

watch(
  [() => props.modelValue, () => props.document?.id],
  ([value]) => {
    if (value) void loadShareData();
  }
);
</script>

<style lang="scss" scoped>
.collab-share-dialog__form {
  margin-top: 20px;
}

.collab-share-dialog__storage-row {
  display: flex;
  min-width: 0;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.collab-share-dialog__storage-value {
  min-width: 0;
  flex: 1 1 auto;
}

.collab-share-dialog__storage-unit {
  width: 84px;
  flex: 0 0 auto;
}

.collab-share-dialog__add-row {
  display: flex;
  min-width: 0;
  margin: 12px 0;
  gap: 6px;
  align-items: center;
}

.collab-share-dialog__member-select {
  min-width: 0;
  flex: 1 1 auto;
}

.collab-share-dialog__role-select {
  width: 86px;
  flex: 0 0 auto;
}

.collab-share-dialog__ownership {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--app-border-soft);
}

.collab-share-dialog__owner-row {
  display: flex;
  min-width: 0;
  margin-top: 12px;
  gap: 8px;
  align-items: center;
}

.collab-share-dialog__owner-select {
  min-width: 0;
  flex: 1 1 auto;
}

.collab-share-dialog__owner-row > .el-button {
  flex: 0 0 auto;
}

.collab-share-dialog__section-title {
  display: flex;
  color: var(--app-ink);
  font-size: 13px;
  font-weight: 700;
  align-items: center;
  justify-content: space-between;
}

.collab-share-dialog__table {
  width: 100%;
  margin-top: 8px;
}

.collab-share-dialog__member {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.collab-share-dialog__member strong,
.collab-share-dialog__member span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collab-share-dialog__member strong {
  color: var(--app-ink);
}

.collab-share-dialog__member span,
.collab-share-dialog__owner-label {
  color: var(--app-muted);
  font-size: 11px;
}

.collab-share-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 480px) {
  .collab-share-dialog__storage-row {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .collab-share-dialog__storage-row :deep(.el-switch) {
    width: 100%;
  }

  .collab-share-dialog__storage-value,
  .collab-share-dialog__storage-unit {
    width: auto;
    flex: 1 1 120px;
  }

  .collab-share-dialog__add-row {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .collab-share-dialog__member-select {
    width: 100%;
    flex-basis: 100%;
  }

  .collab-share-dialog__owner-row {
    align-items: stretch;
    flex-direction: column;
  }

  .collab-share-dialog__owner-select,
  .collab-share-dialog__owner-row > .el-button {
    width: 100%;
  }
}
</style>
