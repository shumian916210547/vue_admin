<template>
  <section class="online-member-page management-page" :aria-busy="loading">
    <header class="management-page__heading">
      <div>
        <span class="management-page__eyebrow">在线成员运维</span>
        <h1>在线成员</h1>
        <p>查看当前企业的有效管理端会话；强制下线会撤销该成员的全部会话，冻结会同时阻止新登录。</p>
      </div>
      <a-button size="small" v-auth="['permission:query', permissions]" :loading="loading" @click="reloadOnlineMembers">
        <template #icon><ReloadOutlined /></template>
        刷新列表
      </a-button>
    </header>

    <a-alert
      v-if="loadError"
      class="management-page__alert"
      type="error"
      show-icon
      :message="loadError"
      description="请确认当前账号为系统管理员，并检查服务端 AdminSession 配置是否已完成迁移。"
    />

    <a-card class="online-member-page__card" :bordered="false">
      <template #title>
        <span class="management-page__card-title"><TeamOutlined /> 在线会话</span>
      </template>
      <template #extra>
        <a-tag color="blue">{{ sessions.length }} 个在线会话</a-tag>
      </template>
      <p class="online-member-page__tip">在线时长按会话首次建立时间计算；设备信息来自登录请求的 User-Agent 分类，不保存完整请求头。</p>
      <a-table
        size="small"
        class="online-member-page__table"
        :columns="columns"
        :data-source="sessions"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 980 }"
        row-key="objectId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'member'">
            <div class="online-member-page__member">
              <strong>{{ record.name || record.username }}</strong>
              <span>{{ record.username }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'duration'">
            {{ formatOnlineDuration(record.onlineAt, currentTime) }}
          </template>
          <template v-else-if="column.key === 'onlineAt'">
            {{ formatDateTime(record.onlineAt) }}
          </template>
          <template v-else-if="column.key === 'lastSeenAt'">
            {{ formatDateTime(record.lastSeenAt) }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <div class="online-member-page__actions">
              <a-popconfirm
                title="强制下线会撤销该成员的全部在线会话，确认继续吗？"
                ok-text="确认下线"
                cancel-text="取消"
                @confirm="handleForceLogout(record)"
              >
                <a-button size="small" v-auth="['permission:forceLogout', permissions]" danger type="link">强制下线</a-button>
              </a-popconfirm>
              <a-button size="small" v-auth="['permission:freeze', permissions]" type="link" @click="openFreezeModal(record)">冻结账号</a-button>
            </div>
          </template>
        </template>
      </a-table>
      <a-empty v-if="!loading && !sessions.length" description="当前没有在线成员" />
    </a-card>

    <a-modal
      v-model:visible="freezeModal.visible"
      title="冻结账号"
      :confirm-loading="freezeModal.submitting"
      ok-text="确认冻结"
      cancel-text="取消"
      @ok="submitFreeze"
      @cancel="closeFreezeModal"
    >
      <a-form size="small" ref="freezeFormRef" :model="freezeForm" :rules="freezeRules" layout="vertical">
        <a-form-item label="目标成员">
          <a-input size="small" :value="freezeForm.memberLabel" disabled placeholder="当前目标成员" />
        </a-form-item>
        <a-form-item label="常用时长" name="preset">
          <a-select size="small" v-model:value="freezeForm.preset" placeholder="请选择常用冻结时长" @change="handleFreezePresetChange">
            <a-select-option v-for="option in freezePresets" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
            <a-select-option value="custom">自定义时长</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="冻结时长" name="durationMinutes" extra="单位为分钟，范围 1 至 43200 分钟（30 天）。">
          <a-input-number
            size="small"
            v-model:value="freezeForm.durationMinutes"
            placeholder="请输入冻结分钟数"
            :min="1"
            :max="43200"
            :precision="0"
            addon-after="分钟"
            class="online-member-page__duration-input"
          />
        </a-form-item>
        <a-alert type="warning" show-icon message="冻结后，该成员现有会话会立即失效，冻结截止前无法重新登录。" />
      </a-form>
    </a-modal>
  </section>
</template>

<script setup>
import { ReloadOutlined, TeamOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
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
  { title: "手机号", dataIndex: "phone", key: "phone", width: 150 },
  { title: "上线时间", key: "onlineAt", width: 180 },
  { title: "在线时长", key: "duration", width: 150 },
  { title: "最后活动", key: "lastSeenAt", width: 180 },
  { title: "登录设备", dataIndex: "deviceInfo", key: "deviceInfo", width: 220 },
  { title: "操作", key: "operation", width: 176, fixed: "right", className: "table-operation-column" },
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
    notification.success({ message: "在线成员", description: "账号已冻结，现有会话已全部失效。" });
    closeFreezeModal();
    await reloadOnlineMembers();
  } catch (error) {
    if (error?.errorFields) return;
    notification.error({ message: "冻结失败", description: error?.message || "账号未能冻结，请稍后重试。" });
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
    notification.success({ message: "在线成员", description: `成员“${record.name || "未命名成员"}”已强制下线。` });
    await reloadOnlineMembers();
  } catch (error) {
    notification.error({ message: "强制下线失败", description: error?.message || "会话未能撤销，请稍后重试。" });
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
  min-width: 0;
  min-height: 620px;
  gap: 20px;
  flex-direction: column;
}

.online-member-page__card {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.online-member-page__card :deep(.ant-card-body) {
  display: flex;
  min-height: 0;
  gap: 14px;
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

.online-member-page__actions > .ant-btn,
.online-member-page__actions .ant-popconfirm > .ant-btn {
  min-width: 0;
  margin: 0;
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
