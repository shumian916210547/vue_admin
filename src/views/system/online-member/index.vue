<template>
  <section class="online-member-page management-page list-page" :aria-busy="loading">
    <div class="list-page__top">
      <header class="management-page__heading">
        <div>
          <span class="management-page__eyebrow">在线成员运维</span>
          <h1>在线成员</h1>
          <p>查看当前企业的有效管理端会话；强制下线会撤销该成员的全部会话，冻结会同时阻止新登录。</p>
        </div>
        <el-button size="small" v-auth="['permission:query', permissions]" :loading="loading" @click="reloadOnlineMembers">
          <template #icon><el-icon><Refresh /></el-icon></template>
          刷新列表
        </el-button>
      </header>

      <el-alert
        v-if="loadError"
        class="management-page__alert"
        type="error"
        show-icon
        :title="loadError"
      >请确认当前账号为系统管理员，并检查服务端会话配置是否已完成迁移。</el-alert>
    </div>

    <div class="list-page__middle online-member-page__middle">
      <el-card class="online-member-page__card">
      <template #header>
        <div class="management-page__card-header">
          <span class="management-page__card-title"><el-icon><UserFilled /></el-icon> 在线会话</span>
          <el-tag size="small" type="primary">{{ sessions.length }} 个在线会话</el-tag>
        </div>
      </template>
      <p class="online-member-page__tip">在线时长按会话首次建立时间计算；设备信息来自登录请求的 User-Agent 分类，不保存完整请求头。</p>
      <div class="online-member-page__table-wrap">
        <el-table
          size="small"
          class="online-member-page__table"
          width="100%"
          :data="sessions"
          v-loading="loading"
          row-key="objectId"
        >
        <el-table-column
          v-for="column in columns"
          :key="column.key"
          :prop="column.dataIndex"
          :label="column.title"
          :width="column.width"
            :min-width="column.minWidth || (column.width ? undefined : 140)"
          :fixed="column.fixed"
          :class-name="column.className"
        >
        <template #default="{ row }">
          <template v-if="column.key === 'member'">
            <div class="online-member-page__member">
              <strong>{{ row.name || row.username }}</strong>
              <span>{{ row.username }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'duration'">
            {{ formatOnlineDuration(row.onlineAt, currentTime) }}
          </template>
          <template v-else-if="column.key === 'onlineAt'">
            {{ formatDateTime(row.onlineAt) }}
          </template>
          <template v-else-if="column.key === 'lastSeenAt'">
            {{ formatDateTime(row.lastSeenAt) }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <div class="online-member-page__actions">
              <el-popconfirm
                title="强制下线会撤销该成员的全部在线会话，确认继续吗？"
                confirm-button-text="确认下线"
                cancel-button-text="取消"
                @confirm="handleForceLogout(row)"
              >
                <template #reference>
                  <el-button size="small" v-auth="['permission:forceLogout', permissions]" type="danger" link>强制下线</el-button>
                </template>
              </el-popconfirm>
              <el-button size="small" v-auth="['permission:freeze', permissions]" type="primary" link @click="openFreezeModal(row)">冻结账号</el-button>
            </div>
          </template>
          <span v-else>{{ row[column.dataIndex] }}</span>
        </template>
        </el-table-column>
        </el-table>
        <el-empty v-if="!loading && !sessions.length" description="当前没有在线成员" />
      </div>
      </el-card>
    </div>

    <el-dialog
      v-model="freezeModal.visible"
      title="冻结账号"
      @close="closeFreezeModal"
    >
      <el-form size="small" ref="freezeFormRef" :model="freezeForm" :rules="freezeRules" label-position="top">
        <el-form-item label="目标成员">
          <el-input size="small" v-model="freezeForm.memberLabel" disabled placeholder="当前目标成员" />
        </el-form-item>
        <el-form-item label="常用时长" prop="preset">
          <el-select size="small" v-model="freezeForm.preset" placeholder="请选择常用冻结时长" @change="handleFreezePresetChange">
            <el-option v-for="option in freezePresets" :key="option.value" :value="option.value" :label="option.label" />
            <el-option value="custom" label="自定义时长" />
          </el-select>
        </el-form-item>
        <el-form-item label="冻结时长" prop="durationMinutes">
          <el-input-number
            size="small"
            v-model="freezeForm.durationMinutes"
            placeholder="请输入冻结分钟数"
            :min="1"
            :max="43200"
            :precision="0"
            class="online-member-page__duration-input"
          ><template #suffix>分钟</template></el-input-number>
          <p class="form-item-help">单位为分钟，范围 1 至 43200 分钟（30 天）。</p>
        </el-form-item>
        <el-alert type="warning" show-icon title="冻结后，该成员现有会话会立即失效，冻结截止前无法重新登录。" />
      </el-form>
      <template #footer>
        <el-button size="small" @click="closeFreezeModal">取消</el-button>
        <el-button size="small" type="primary" :loading="freezeModal.submitting" @click="submitFreeze">确认冻结</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { Refresh, UserFilled } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";

import { Mixins } from "@/mixins";
import {
  forceLogoutOnlineMember,
  freezeOnlineMember,
  getOnlineMemberSessions,
} from "@/service/online-member.service";

/** 在线会话表格列；时间和操作列通过 bodyCell 插槽格式化。 */
const columns = [
  { title: "成员", key: "member", width: 190, fixed: "left" },
  { title: "手机号", dataIndex: "phone", key: "phone", minWidth: 150 },
  { title: "上线时间", key: "onlineAt", minWidth: 180 },
  { title: "在线时长", key: "duration", minWidth: 150 },
  { title: "最后活动", key: "lastSeenAt", minWidth: 180 },
  { title: "登录设备", dataIndex: "deviceInfo", key: "deviceInfo", minWidth: 220 },
  { title: "操作", key: "operation", minWidth: 210, fixed: "right", className: "table-operation-column" },
];
/** 冻结弹窗中可直接选择的常用时长，value 单位为分钟。 */
const freezePresets = [
  { value: 15, label: "15 分钟" },
  { value: 60, label: "1 小时" },
  { value: 240, label: "4 小时" },
  { value: 1_440, label: "24 小时" },
  { value: 10_080, label: "7 天" },
];
const sessions = ref([]);
const permissions = ref([]);
const loading = ref(false);
const loadError = ref("");
const currentTime = ref(new Date());
const freezeFormRef = ref();
const freezeModal = reactive({ visible: false, submitting: false });
const freezeForm = reactive({
  userId: "",
  memberLabel: "",
  preset: 60,
  durationMinutes: 60,
});
const freezeRules = {
  durationMinutes: [
    { required: true, message: "请输入冻结时长", trigger: "change" },
    { type: "number", min: 1, max: 43_200, message: "冻结时长必须在 1 至 43200 分钟之间", trigger: "change" },
  ],
};
const { queryPermission } = Mixins();
let clockTimer;

/**
 * 将服务端 ISO 时间格式化为中文短日期时间。
 * @param {string | null | undefined} value 服务端返回的时间字符串。
 * @returns {string} 可读时间；无效值返回“暂无记录”。
 */
const formatDateTime = (value) => {
  if (!value) return "暂无记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * 根据会话首次上线时间计算当前在线时长。
 * @param {string | null | undefined} onlineAt 会话创建时间 ISO 字符串。
 * @param {Date} now 当前时间，用于周期性刷新显示。
 * @returns {string} 例如“2 小时 10 分钟”；无效时间返回“--”。
 */
const formatOnlineDuration = (onlineAt, now) => {
  const started = new Date(onlineAt || "");
  if (Number.isNaN(started.getTime())) return "--";
  const totalMinutes = Math.max(Math.floor((now.getTime() - started.getTime()) / 60_000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${Math.max(minutes, 1)} 分钟`;
  return `${hours} 小时${minutes ? ` ${minutes} 分钟` : ""}`;
};

/**
 * 加载在线成员列表并保留服务端返回的脱敏 DTO。
 * @returns {Promise<void>} 请求完成后更新表格或错误提示；不会把会话凭据写入前端状态。
 */
const reloadOnlineMembers = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const result = await getOnlineMemberSessions();
    sessions.value = Array.isArray(result?.sessions) ? result.sessions : [];
  } catch (error) {
    loadError.value = error?.message || "在线成员列表加载失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

/**
 * 打开冻结弹窗并回填目标成员；不会立即修改服务端账号状态。
 * @param {{userId: string, name?: string, username?: string}} record 在线会话行数据。
 * @returns {void} 更新冻结表单并显示弹窗。
 */
const openFreezeModal = (record) => {
  Object.assign(freezeForm, {
    userId: record.userId,
    memberLabel: `${record.name || "未命名成员"}（${record.username || "无账号"}）`,
    preset: 60,
    durationMinutes: 60,
  });
  freezeFormRef.value?.clearValidate?.();
  freezeModal.visible = true;
};

/**
 * 关闭冻结弹窗并清空目标成员，避免下次打开误操作上一名成员。
 * @returns {void} 仅更新弹窗和表单状态，不发起网络请求。
 */
const closeFreezeModal = () => {
  freezeModal.visible = false;
  Object.assign(freezeForm, { userId: "", memberLabel: "", preset: 60, durationMinutes: 60 });
};

/**
 * 将常用冻结时长选择同步到可编辑的分钟输入框；自定义选项保留用户手工输入。
 * @param {number | "custom"} value 选择器返回的时长值或 custom 标识。
 * @returns {void} 原地更新冻结分钟数。
 */
const handleFreezePresetChange = (value) => {
  const minutes = Number(value);
  if (Number.isInteger(minutes)) freezeForm.durationMinutes = minutes;
};

/**
 * 提交账号冻结；服务端会再次校验目标企业、管理员身份、时长上限并撤销全部现有会话。
 * @returns {Promise<void>} 冻结成功后刷新列表并关闭弹窗；校验或请求失败时保留表单。
 */
const submitFreeze = async () => {
  try {
    await freezeFormRef.value?.validate?.();
    freezeModal.submitting = true;
    await freezeOnlineMember(freezeForm.userId, freezeForm.durationMinutes);
    ElNotification.success({ title: "在线成员", message: "账号已冻结，现有会话已全部失效。" });
    closeFreezeModal();
    await reloadOnlineMembers();
  } catch (error) {
    if (error?.errorFields) return;
    ElNotification.error({ title: "冻结失败", message: error?.message || "账号未能冻结，请稍后重试。" });
  } finally {
    freezeModal.submitting = false;
  }
};

/**
 * 强制撤销目标成员的全部在线会话，并从当前列表移除已下线记录。
 * @param {{userId: string, name?: string}} record 在线会话行数据。
 * @returns {Promise<void>} 撤销成功后刷新列表；失败时显示统一错误通知。
 */
const handleForceLogout = async (record) => {
  try {
    await forceLogoutOnlineMember(record.userId);
    ElNotification.success({ title: "在线成员", message: `成员“${record.name || "未命名成员"}”已强制下线。` });
    await reloadOnlineMembers();
  } catch (error) {
    ElNotification.error({ title: "强制下线失败", message: error?.message || "会话未能撤销，请稍后重试。" });
  }
};

onMounted(async () => {
  try {
    permissions.value = await queryPermission();
  } catch {
    permissions.value = [];
  }
  clockTimer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 30_000);
  await reloadOnlineMembers();
});

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
});
</script>

<style lang="scss" scoped>
.online-member-page {
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0;
  flex-direction: column;
}

.online-member-page__middle {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.online-member-page__card {
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.online-member-page__card :deep(.el-card__body) {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.online-member-page__tip {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.online-member-page__table {
  min-width: 0;
}

.online-member-page__table-wrap {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.online-member-page__member {
  display: grid;
  gap: 3px;
}

.online-member-page__member strong {
  color: var(--app-ink);
}

.online-member-page__member span {
  color: var(--app-muted);
  font-size: 12px;
}

.online-member-page__actions {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
}

.online-member-page__duration-input {
  width: 220px;
}

@media (max-width: 768px) {
  .online-member-page {
    min-height: 0;
  }

  .online-member-page__duration-input {
    width: min(100%, 220px);
  }
}
</style>
