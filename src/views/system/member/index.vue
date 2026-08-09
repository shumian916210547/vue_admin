<template>
  <section class="member-page management-page" :aria-busy="loading || memberLoading">
    <header class="management-page__heading">
      <div>
        <span class="management-page__eyebrow">MEMBER & ORGANIZATION ACCESS</span>
        <h1>成员管理</h1>
        <p>每名成员可分配一个岗位、关联多个组织，并获得一个或多个组织的数据访问范围。</p>
      </div>
      <div class="member-page__heading-actions">
        <a-button :loading="loading || memberLoading" @click="refreshMemberPage">
          <template #icon><ReloadOutlined /></template>
          刷新列表
        </a-button>
        <a-button type="primary" :disabled="!organizations.length || !roles.length" @click="openMemberModal('create')">
          <template #icon><UserAddOutlined /></template>
          新增成员
        </a-button>
      </div>
    </header>

    <a-alert
      v-if="loadError"
      class="management-page__alert"
      type="error"
      show-icon
      :message="loadError"
      description="请先完成组织与岗位配置，并确认当前账号为系统管理员。"
    />

    <a-card class="member-page__table-card" :bordered="false">
      <template #title>
        <span class="management-page__card-title"><TeamOutlined /> 成员列表</span>
      </template>
      <template #extra>
        <a-input-search
          v-model:value="memberQuery.keyword"
          class="member-page__member-search"
          allow-clear
          placeholder="按登录账号检索"
          :loading="memberLoading"
          @search="handleMemberSearch"
        />
      </template>
      <p class="member-page__tip">“关联组织”记录成员所属的多个组织；“组织数据权限”决定其可读取和操作的业务数据范围，并自动覆盖所选组织的下级节点。</p>
      <a-alert
        v-if="memberLoadError"
        class="member-page__members-alert"
        type="error"
        show-icon
        :message="memberLoadError"
        description="已有列表内容已保留；可调整检索条件后重试。"
      />
      <a-table
        class="member-page__table"
        :columns="memberColumns"
        :data-source="members"
        :loading="memberLoading"
        :pagination="memberPagination"
        :scroll="{ x: 1180 }"
        row-key="objectId"
        @change="handleMemberTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'position'">
            {{ positionName(record.roleId) || "未设置岗位" }}
          </template>
          <template v-else-if="column.key === 'organizations'">
            <span class="member-page__scope-list">{{ organizationNames(record.organizationIds, record.organizationId) }}</span>
          </template>
          <template v-else-if="column.key === 'scope'">
            <span class="member-page__scope-list">{{ organizationNames(record.scopeIds) }}</span>
          </template>
          <template v-else-if="column.key === 'kind'">
            <a-tag :color="record.organizationAdmin ? 'processing' : 'default'">
              {{ record.organizationAdmin ? "子管理员" : "普通成员" }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.isDelete ? 'default' : 'success'">
              {{ record.isDelete ? "已停用" : "启用" }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'operation'">
            <div class="member-page__row-actions">
              <a-button type="link" @click="openMemberModal('edit', record.objectId)">编辑与授权</a-button>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="memberModal.visible"
      :title="memberModal.mode === 'create' ? '新增成员账号' : '编辑成员与授权'"
      :confirm-loading="memberModal.submitting"
      :width="780"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitMember"
      @cancel="closeMemberModal"
    >
      <a-form ref="memberFormRef" :model="memberForm" :rules="memberRules" layout="vertical">
        <a-row :gutter="[12, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="登录账号" name="username">
              <a-input v-model:value="memberForm.username" :disabled="memberModal.mode === 'edit'" placeholder="建议使用工号或企业邮箱前缀" :maxlength="64" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="memberModal.mode === 'create' ? '初始密码' : '重置密码'" name="password">
              <a-input-password v-model:value="memberForm.password" :placeholder="memberModal.mode === 'create' ? '至少 12 位，避免使用常见密码' : '留空则不修改密码'" :maxlength="256" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="[12, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="姓名" name="name">
              <a-input v-model:value="memberForm.name" placeholder="请输入成员姓名" :maxlength="100" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="邮箱" name="email">
              <a-input v-model:value="memberForm.email" placeholder="可选，用于识别成员" :maxlength="254" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="岗位" name="roleId" extra="每名成员只能设置一个岗位；岗位决定可访问的业务页面和页面内按钮。">
          <a-select v-model:value="memberForm.roleId" :options="positionOptions" placeholder="请选择岗位" />
        </a-form-item>
        <a-form-item label="关联组织" name="organizationIds" extra="可关联一个或多个启用组织，用于记录成员所属关系。">
          <a-tree-select
            v-model:value="memberForm.organizationIds"
            :tree-data="organizationSelectTree"
            tree-checkable
            tree-default-expand-all
            multiple
            placeholder="请选择成员关联的组织"
          />
        </a-form-item>
        <a-form-item label="组织数据权限" name="scopeIds" extra="可配置一个或多个组织；选中节点会覆盖其全部下级组织数据。">
          <a-tree-select
            v-model:value="memberForm.scopeIds"
            :tree-data="organizationSelectTree"
            tree-checkable
            tree-default-expand-all
            multiple
            placeholder="请选择可访问的组织数据范围"
          />
        </a-form-item>
        <a-row :gutter="[12, 0]">
          <a-col :xs="24" :md="12">
            <a-form-item label="账号类型" name="organizationAdmin">
              <a-radio-group v-model:value="memberForm.organizationAdmin">
                <a-radio :value="false">普通成员</a-radio>
                <a-radio :value="true">子管理员</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="账号状态" name="isDelete">
              <a-switch v-model:checked="memberForm.isDelete" checked-children="停用" un-checked-children="启用" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </section>
</template>

<script setup>
import {
  ReloadOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { notification } from "ant-design-vue";

import {
  createOrganizationMember,
  getOrganizationMembers,
  getOrganizationOverview,
  updateOrganizationMember,
} from "@/service/organization.service";

/** 成员表格的列定义；关联组织、组织数据权限与状态列由 bodyCell 插槽格式化。 */
const memberColumns = [
  { title: "账号", dataIndex: "username", key: "username", width: 160, fixed: "left" },
  { title: "姓名", dataIndex: "name", key: "name", width: 120 },
  { title: "岗位", key: "position", width: 150 },
  { title: "关联组织", key: "organizations", width: 250 },
  { title: "组织数据权限", key: "scope", width: 260 },
  { title: "账号类型", key: "kind", width: 110 },
  { title: "状态", key: "status", width: 90 },
  { title: "操作", key: "operation", width: 130, fixed: "right" },
];
const loading = ref(false);
const memberLoading = ref(false);
const loadError = ref("");
const memberLoadError = ref("");
const organizations = ref([]);
const roles = ref([]);
const tree = ref([]);
const members = ref([]);
const memberTotal = ref(0);
const memberFormRef = ref();
const memberModal = reactive({ visible: false, mode: "create", submitting: false });
const memberQuery = reactive({ keyword: "", page: 1, pageSize: 10 });
let memberRequestSequence = 0;
const memberForm = reactive({
  objectId: "",
  username: "",
  password: "",
  name: "",
  email: "",
  roleId: undefined,
  organizationIds: [],
  scopeIds: [],
  organizationAdmin: false,
  isDelete: false,
});

/** 成员新增与编辑表单的 Ant Design Vue 校验规则。 */
const memberRules = computed(() => ({
  username: [{ required: true, message: "请输入登录账号", trigger: "blur" }],
  password: [
    {
      validator: (_rule, value) => {
        if (memberModal.mode === "create" && !value) return Promise.reject(new Error("请输入初始密码"));
        if (value && value.length < 12) return Promise.reject(new Error("密码至少需要 12 个字符"));
        return Promise.resolve();
      },
      trigger: "blur",
    },
  ],
  roleId: [{ required: true, message: "请选择岗位", trigger: "change" }],
  organizationIds: [{ type: "array", min: 1, required: true, message: "请至少关联一个组织", trigger: "change" }],
  scopeIds: [{ type: "array", min: 1, required: true, message: "请至少配置一个组织数据权限", trigger: "change" }],
}));

/**
 * 将服务端组织树转换为 Ant TreeSelect 可消费的节点结构。
 * @param {Array<Record<string, unknown>>} nodes 服务端组织树节点数组。
 * @returns {Array<Record<string, unknown>>} 包含 title、key、value、children 的树节点。
 */
const toTreeData = (nodes) =>
  (nodes || []).map((node) => ({
    key: node.objectId,
    value: node.objectId,
    title: node.name,
    disabled: node.isActive === false,
    children: toTreeData(node.children),
  }));

const organizationSelectTree = computed(() => toTreeData(tree.value));
const positionOptions = computed(() => roles.value.map((role) => ({ value: role.objectId, label: role.name })));
const memberPagination = computed(() => ({
  current: memberQuery.page,
  pageSize: memberQuery.pageSize,
  total: memberTotal.value,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 名成员`,
}));

/**
 * 根据对象标识返回岗位名称。
 * @param {string | null | undefined} roleId 成员的岗位 Role objectId。
 * @returns {string} 找到时返回岗位名称；未设置或已删除时返回空字符串。
 */
const positionName = (roleId) => roles.value.find((role) => role.objectId === roleId)?.name || "";

/**
 * 将一个或多个组织 objectId 转为读者可理解的中文名称列表。
 * @param {string[] | undefined} ids 组织标识数组。
 * @param {string | null | undefined} legacyId 旧成员数据的单组织后备标识。
 * @returns {string} 用“、”拼接的组织名称；没有有效组织时显示“未配置”。
 */
const organizationNames = (ids, legacyId = undefined) => {
  const values = Array.isArray(ids) && ids.length ? ids : legacyId ? [legacyId] : [];
  const names = [...new Set(values)]
    .map((organizationId) => organizations.value.find((organization) => organization.objectId === organizationId)?.name)
    .filter(Boolean);
  return names.length ? names.join("、") : "未配置";
};

/**
 * 拉取组织树和岗位下拉数据；成员列表另行分页读取，避免组织刷新造成大表格闪烁。
 * @returns {Promise<void>} 基础配置加载完成或错误状态更新后兑现。
 */
const reloadOverview = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const overview = await getOrganizationOverview();
    organizations.value = Array.isArray(overview?.organizations) ? overview.organizations : [];
    roles.value = Array.isArray(overview?.roles) ? overview.roles : [];
    tree.value = Array.isArray(overview?.tree) ? overview.tree : [];
  } catch (error) {
    loadError.value = error?.message || "组织和岗位配置加载失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

/**
 * 分页读取成员列表。请求序号用于忽略较早请求的延迟响应，避免搜索结果被回写成旧列表。
 * @returns {Promise<void>} 当前请求成功或失败处理结束后兑现。
 */
const reloadMembers = async () => {
  const requestSequence = ++memberRequestSequence;
  memberLoading.value = true;
  memberLoadError.value = "";
  try {
    const result = await getOrganizationMembers({ ...memberQuery });
    if (requestSequence !== memberRequestSequence) return;
    members.value = Array.isArray(result?.members) ? result.members : [];
    memberTotal.value = Number(result?.count) || 0;
    memberQuery.page = Number(result?.page) || memberQuery.page;
    memberQuery.pageSize = Number(result?.pageSize) || memberQuery.pageSize;
  } catch (error) {
    if (requestSequence !== memberRequestSequence) return;
    memberLoadError.value = error?.message || "成员列表加载失败，请稍后重试。";
  } finally {
    if (requestSequence === memberRequestSequence) memberLoading.value = false;
  }
};

/**
 * 同时刷新组织/岗位基础配置和成员分页列表。
 * @returns {Promise<void>} 两类刷新请求全部结束后兑现。
 */
const refreshMemberPage = async () => {
  await Promise.all([reloadOverview(), reloadMembers()]);
};

/**
 * 清空成员编辑表单，恢复新增成员所需的默认账号状态。
 * @returns {void} 原地更新响应式表单，并清除上一条表单校验结果。
 */
const resetMemberForm = () => {
  Object.assign(memberForm, {
    objectId: "",
    username: "",
    password: "",
    name: "",
    email: "",
    roleId: undefined,
    organizationIds: [],
    scopeIds: [],
    organizationAdmin: false,
    isDelete: false,
  });
  memberFormRef.value?.clearValidate?.();
};

/**
 * 打开成员新增或编辑弹窗。历史成员的主组织会自动转换为单元素关联组织数组。
 * @param {"create" | "edit"} mode 弹窗模式。
 * @param {string | undefined} userId 编辑目标成员 objectId；新增时省略。
 * @returns {void} 更新表单状态并显示弹窗。
 */
const openMemberModal = (mode, userId = undefined) => {
  memberModal.mode = mode;
  if (mode === "edit") {
    const member = members.value.find((item) => item.objectId === userId);
    if (!member) return;
    Object.assign(memberForm, {
      objectId: member.objectId,
      username: member.username || "",
      password: "",
      name: member.name || "",
      email: member.email || "",
      roleId: member.roleId || undefined,
      organizationIds: Array.isArray(member.organizationIds) && member.organizationIds.length
        ? [...member.organizationIds]
        : member.organizationId
          ? [member.organizationId]
          : [],
      scopeIds: Array.isArray(member.scopeIds) ? [...member.scopeIds] : [],
      organizationAdmin: member.organizationAdmin === true,
      isDelete: member.isDelete === true,
    });
    memberFormRef.value?.clearValidate?.();
  } else {
    resetMemberForm();
  }
  memberModal.visible = true;
};

/**
 * 关闭成员弹窗且不修改服务端数据。
 * @returns {void} 关闭弹窗并清空表单缓存。
 */
const closeMemberModal = () => {
  memberModal.visible = false;
  resetMemberForm();
};

/**
 * 提交成员新增或编辑。密码为空时不会发送给 BFF，以避免编辑资料时意外重置密码。
 * @returns {Promise<void>} 保存成功后刷新成员列表并显示统一通知；失败时保留弹窗数据供修正。
 */
const submitMember = async () => {
  try {
    await memberFormRef.value?.validate?.();
    memberModal.submitting = true;
    const payload = {
      username: memberForm.username,
      name: memberForm.name,
      email: memberForm.email,
      roleId: memberForm.roleId,
      organizationIds: [...memberForm.organizationIds],
      scopeIds: [...memberForm.scopeIds],
      organizationAdmin: memberForm.organizationAdmin,
      isDelete: memberForm.isDelete,
    };
    if (memberForm.password) payload.password = memberForm.password;
    if (memberModal.mode === "create") await createOrganizationMember(payload);
    else await updateOrganizationMember(memberForm.objectId, payload);
    notification.success({ message: "成员管理", description: "成员账号与授权已保存。" });
    closeMemberModal();
    await reloadMembers();
  } catch (error) {
    if (error?.errorFields) return;
    notification.error({ message: "保存失败", description: error?.message || "成员信息未能保存，请检查输入后重试。" });
  } finally {
    memberModal.submitting = false;
  }
};

/**
 * 处理成员搜索，关键词变化后回到第一页以避免页码超出新的检索结果范围。
 * @returns {Promise<void>} 新检索条件下的成员列表加载完成后兑现。
 */
const handleMemberSearch = async () => {
  memberQuery.page = 1;
  await reloadMembers();
};

/**
 * 将 Ant Design Vue 表格分页事件转换为服务端成员查询状态。
 * @param {{current?: number, pageSize?: number}} pagination 表格当前分页信息。
 * @returns {Promise<void>} 页码状态更新并加载对应成员页后兑现。
 */
const handleMemberTableChange = async (pagination) => {
  const nextPageSize = Number(pagination?.pageSize) || memberQuery.pageSize;
  const nextPage = nextPageSize === memberQuery.pageSize ? Number(pagination?.current) || 1 : 1;
  memberQuery.page = nextPage;
  memberQuery.pageSize = nextPageSize;
  await reloadMembers();
};

onMounted(() => {
  void refreshMemberPage();
});
</script>

<style lang="scss" scoped>
.member-page {
  display: flex;
  min-width: 0;
  min-height: 620px;
  gap: 20px;
  flex-direction: column;
}

.member-page__heading-actions,
.member-page__row-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.member-page__heading-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.member-page__table-card {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.member-page__table-card :deep(.ant-card-head) {
  flex: 0 0 auto;
}

.member-page__table-card :deep(.ant-card-body) {
  display: flex;
  min-height: 0;
  gap: 14px;
  flex: 1 1 auto;
  flex-direction: column;
}

.member-page__tip {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.member-page__table {
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
}

.member-page__scope-list {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-page__row-actions {
  min-height: 34px;
  justify-content: center;
}

.member-page__member-search {
  width: 240px;
}

@media (max-width: 768px) {
  .member-page {
    min-height: 0;
  }

  .member-page__heading-actions {
    justify-content: flex-start;
  }

  .member-page__member-search {
    width: min(100%, 240px);
  }
}
</style>
