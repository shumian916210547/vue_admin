<template>
  <section class="member-page management-page" :aria-busy="loading || memberLoading">
    <header class="management-page__heading">
      <div>
        <span class="management-page__eyebrow">成员与组织权限</span>
        <h1>成员管理</h1>
        <p>每名成员可分配一个岗位、关联多个组织，并获得一个或多个组织的数据访问范围。</p>
      </div>
      <div class="member-page__heading-actions management-page__heading-actions">
        <el-button size="small" v-auth="['permission:query', permissions]" :loading="loading || memberLoading" @click="refreshMemberPage">
          <template #icon><el-icon><Refresh /></el-icon></template>
          刷新列表
        </el-button>
        <el-button size="small" v-auth="['permission:insert', permissions]" type="primary" :disabled="!organizations.length || !roles.length" @click="openMemberModal('create')">
          <template #icon><el-icon><UserFilled /></el-icon></template>
          新增成员
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="loadError"
      class="management-page__alert"
      type="error"
      show-icon
      :title="loadError"
    >请先完成组织与岗位配置，并确认当前账号为系统管理员。</el-alert>

    <div class="member-page__workspace">
      <el-card class="member-page__organization-card">
        <template #header>
          <div class="management-page__card-header">
            <span class="management-page__card-title"><el-icon><OfficeBuilding /></el-icon> 组织架构</span>
          <el-button type="primary" link size="small" @click="clearOrganizationFilter">全部组织</el-button>
          </div>
        </template>
        <p class="member-page__tree-tip">点击组织节点，右侧成员列表会按组织范围刷新。</p>
        <el-tree
          class="member-page__organization-tree app-scrollbar"
          :data="organizationTree"
          node-key="key"
          :props="{ label: 'title', children: 'children' }"
          :current-node-key="selectedOrganizationId"
          highlight-current
          :default-expand-all="true"
          @node-click="handleOrganizationSelect"
        />
      </el-card>

      <el-card class="member-page__table-card">
        <template #header>
          <div class="management-page__card-header management-page__card-header--wrap">
            <span class="management-page__card-title"><el-icon><UserFilled /></el-icon> 成员列表</span>
          <div class="member-page__filters">
            <el-switch
              size="small"
              v-model="memberQuery.includeDescendants"
              active-text="含下级"
              inactive-text="直属"
              :disabled="!selectedOrganizationId"
              @change="handleOrganizationScopeChange"
            />
            <el-input
              size="small"
              v-auth="['permission:query', permissions]"
              v-model="memberQuery.keyword"
              class="member-page__member-search"
              clearable
              placeholder="按登录账号检索"
              @keyup.enter="handleMemberSearch"
            >
              <template #append>
                <el-button size="small" aria-label="搜索成员" @click="handleMemberSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
          </div>
        </template>
        <p class="member-page__tip">当前筛选：{{ organizationFilterLabel }}。“关联组织”记录成员所属的多个组织；“组织数据权限”决定其可读取和操作的业务数据范围。</p>
        <el-alert
          v-if="memberLoadError"
          class="member-page__members-alert"
          type="error"
          show-icon
          :title="memberLoadError"
        >已有列表内容已保留；可调整检索条件后重试。</el-alert>
        <el-table
        size="small"
        class="member-page__table"
        width="100%"
        :data="members"
        v-loading="memberLoading"
        row-key="objectId"
        >
          <el-table-column
            v-for="column in memberColumns"
            :key="column.key"
            :prop="column.dataIndex"
            :label="column.title"
            :width="column.width"
            :min-width="column.minWidth || (column.width ? undefined : 140)"
            :fixed="column.fixed"
            :class-name="column.className"
          >
            <template #default="{ row }">
            <template v-if="column.key === 'position'">
              {{ positionName(row.roleId) || "未设置岗位" }}
            </template>
            <template v-else-if="column.key === 'organizations'">
              <span class="member-page__scope-list">{{ organizationNames(row.organizationIds, row.organizationId) }}</span>
            </template>
            <template v-else-if="column.key === 'scope'">
              <span class="member-page__scope-list">{{ organizationNames(row.scopeIds) }}</span>
            </template>
            <template v-else-if="column.key === 'kind'">
              <el-tag size="small" :type="row.organizationAdmin ? 'warning' : 'info'">
                {{ row.organizationAdmin ? "子管理员" : "普通成员" }}
              </el-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <el-tag size="small" :type="row.isDelete ? 'info' : 'success'">
                {{ row.isDelete ? "已停用" : "启用" }}
              </el-tag>
            </template>
            <template v-else-if="column.key === 'operation'">
              <div class="member-page__row-actions">
                <el-button size="small" v-auth="['permission:edit', permissions]" type="primary" link @click="openMemberModal('edit', row.objectId)">编辑与授权</el-button>
              </div>
            </template>
            <span v-else>{{ row[column.dataIndex] }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="member-page__pagination"
          background
          size="small"
          :current-page="memberQuery.page"
          :page-size="memberQuery.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="memberTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleMemberPageSizeChange"
          @current-change="handleMemberPageChange"
        />
      </el-card>
    </div>

    <el-dialog
      v-model="memberModal.visible"
      :title="memberModal.mode === 'create' ? '新增成员账号' : '编辑成员与授权'"
      :width="780"
      @close="closeMemberModal"
    >
      <el-form size="small" ref="memberFormRef" :model="memberForm" :rules="memberRules" label-position="top">
        <el-row :gutter="12">
          <el-col :xs="24" :md="12">
            <el-form-item label="登录账号" prop="username">
              <el-input size="small" v-model="memberForm.username" :disabled="memberModal.mode === 'edit'" placeholder="建议使用工号或企业邮箱前缀" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item :label="memberModal.mode === 'create' ? '初始密码' : '重置密码'" prop="password">
              <el-input size="small" v-model="memberForm.password" type="password" show-password :placeholder="memberModal.mode === 'create' ? '至少 12 位，避免使用常见密码' : '留空则不修改密码'" maxlength="256" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :xs="24" :md="12">
            <el-form-item label="姓名" prop="name">
              <el-input size="small" v-model="memberForm.name" placeholder="请输入成员姓名" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="邮箱" prop="email">
              <el-input size="small" v-model="memberForm.email" placeholder="可选，用于识别成员" maxlength="254" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="岗位" prop="roleId">
          <el-select size="small" v-model="memberForm.roleId" placeholder="请选择岗位">
            <el-option
              v-for="option in positionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <p class="form-item-help">每名成员只能设置一个岗位；岗位决定可访问的业务页面和页面内按钮。</p>
        </el-form-item>
        <el-form-item label="关联组织" prop="organizationIds">
          <el-tree-select
            size="small"
            v-model="memberForm.organizationIds"
            :data="organizationSelectTree"
            node-key="key"
            :props="{ label: 'title', value: 'value', children: 'children' }"
            show-checkbox
            default-expand-all
            multiple
            placeholder="请选择成员关联的组织"
          />
          <p class="form-item-help">可关联一个或多个启用组织，用于记录成员所属关系。</p>
        </el-form-item>
        <el-form-item label="组织数据权限" prop="scopeIds">
          <el-tree-select
            size="small"
            v-model="memberForm.scopeIds"
            :data="organizationSelectTree"
            node-key="key"
            :props="{ label: 'title', value: 'value', children: 'children' }"
            show-checkbox
            default-expand-all
            multiple
            placeholder="请选择可访问的组织数据范围"
          />
          <p class="form-item-help">可配置一个或多个组织；选中节点会覆盖其全部下级组织数据。</p>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :xs="24" :md="12">
            <el-form-item label="账号类型" prop="organizationAdmin">
              <el-radio-group size="small" v-model="memberForm.organizationAdmin">
                <el-radio :label="false">普通成员</el-radio>
                <el-radio :label="true">子管理员</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="账号状态" prop="isDelete">
              <el-switch size="small" v-model="memberForm.isDelete" active-text="停用" inactive-text="启用" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button size="small" @click="closeMemberModal">取消</el-button>
        <el-button size="small" type="primary" :loading="memberModal.submitting" @click="submitMember">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { OfficeBuilding, Refresh, Search, UserFilled } from "@element-plus/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";

import { Mixins } from "@/mixins";
import { ElNotification } from "element-plus";
import {
  createOrganizationMember,
  getOrganizationMembers,
  getOrganizationOverview,
  updateOrganizationMember,
} from "@/service/organization.service";

/** 成员表格的列定义；关联组织、组织数据权限与状态列由 bodyCell 插槽格式化。 */
const memberColumns = [
  { title: "账号", dataIndex: "username", key: "username", width: 160, fixed: "left" },
  { title: "姓名", dataIndex: "name", key: "name", minWidth: 120 },
  { title: "岗位", key: "position", minWidth: 150 },
  { title: "关联组织", key: "organizations", minWidth: 250 },
  { title: "组织数据权限", key: "scope", minWidth: 260 },
  { title: "账号类型", key: "kind", minWidth: 110 },
  { title: "状态", key: "status", minWidth: 90 },
  { title: "操作", key: "operation", width: 112, fixed: "right", className: "table-operation-column" },
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
const memberQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 10,
  organizationId: "",
  includeDescendants: true,
});
const selectedOrganizationId = ref("");
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
const { queryPermission } = Mixins();
const permissions = await queryPermission();

/** 成员新增与编辑表单的 Element Plus 校验规则。 */
const memberRules = computed(() => ({
  username: [{ required: true, message: "请输入登录账号", trigger: "blur" }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (memberModal.mode === "create" && !value) {
          callback(new Error("请输入初始密码"));
          return;
        }
        if (value && value.length < 12) {
          callback(new Error("密码至少需要 12 个字符"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  roleId: [{ required: true, message: "请选择岗位", trigger: "change" }],
  organizationIds: [{ type: "array", min: 1, required: true, message: "请至少关联一个组织", trigger: "change" }],
  scopeIds: [{ type: "array", min: 1, required: true, message: "请至少配置一个组织数据权限", trigger: "change" }],
}));

/**
 * 将服务端组织树转换为 Element Plus Tree 和 TreeSelect 可消费的节点结构。
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
const organizationTree = computed(() => toTreeData(tree.value));
const positionOptions = computed(() => roles.value.map((role) => ({ value: role.objectId, label: role.name })));
const organizationFilterLabel = computed(() => {
  if (!selectedOrganizationId.value) return "全部组织";
  const organization = organizations.value.find((item) => item.objectId === selectedOrganizationId.value);
  return `${organization?.name || "当前组织"}${memberQuery.includeDescendants ? "及全部下级" : "直属成员"}`;
});
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
    if (selectedOrganizationId.value && !organizations.value.some((item) => item.objectId === selectedOrganizationId.value)) {
      clearOrganizationFilter();
    }
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
    ElNotification.success({ title: "成员管理", message: "成员账号与授权已保存。" });
    closeMemberModal();
    await reloadMembers();
  } catch (error) {
    if (error?.errorFields) return;
    ElNotification.error({ title: "保存失败", message: error?.message || "成员信息未能保存，请检查输入后重试。" });
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
 * 响应组织树节点选择，将右侧列表限制到当前组织并回到第一页。
 * @param {Record<string, unknown> | undefined} data Element Plus Tree 当前选中的节点数据。
 * @param {{key?: string} | undefined} node Element Plus Tree 当前选中的节点实例。
 * @returns {Promise<void>} 更新组织筛选状态并刷新成员列表；空选择不会改变已有节点。
 */
const handleOrganizationSelect = async (data, node) => {
  const organizationId = data?.key || data?.value || node?.key || "";
  if (!organizationId) return;
  selectedOrganizationId.value = organizationId;
  memberQuery.organizationId = organizationId;
  memberQuery.page = 1;
  await reloadMembers();
};

/**
 * 清除组织节点筛选，恢复查看当前企业全部成员。
 * @returns {Promise<void>} 清空组织范围并重新加载第一页成员。
 */
const clearOrganizationFilter = async () => {
  selectedOrganizationId.value = "";
  memberQuery.organizationId = "";
  memberQuery.includeDescendants = true;
  memberQuery.page = 1;
  await reloadMembers();
};

/**
 * 切换“直属/包含下级”范围，并保持当前组织节点不变。
 * @returns {Promise<void>} 组织范围改变后重新加载第一页成员。
 */
const handleOrganizationScopeChange = async () => {
  if (!selectedOrganizationId.value) return;
  memberQuery.page = 1;
  await reloadMembers();
};

/**
 * 处理 Element Plus 分页器的每页数量变化并回到第一页。
 * @param {number} pageSize 最新每页数量。
 * @returns {Promise<void>} 页码状态更新并加载对应成员页后兑现。
 */
const handleMemberPageSizeChange = async (pageSize) => {
  memberQuery.page = 1;
  memberQuery.pageSize = Number(pageSize) || 10;
  await reloadMembers();
};

/**
 * 处理 Element Plus 分页器的当前页变化。
 * @param {number} page 当前页码，从 1 开始。
 * @returns {Promise<void>} 页码状态更新并加载对应成员页后兑现。
 */
const handleMemberPageChange = async (page) => {
  memberQuery.page = Number(page) || 1;
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

.member-page__workspace {
  display: grid;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 20px;
}

.member-page__organization-card,
.member-page__table-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.member-page__tree-tip {
  margin: 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.6;
}

.member-page__organization-tree {
  min-height: 240px;
  flex: 1 1 auto;
}

.member-page__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.member-page__table-card {
  display: flex;
  min-height: 0;
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
  overflow: visible;
  white-space: normal;
  overflow-wrap: anywhere;
}

.member-page__pagination {
  justify-content: flex-end;
  flex: 0 0 auto;
  padding-top: 4px;
}

.member-page__row-actions {
  min-height: 24px;
  flex-wrap: nowrap;
  justify-content: center;
}

.member-page__member-search {
  width: 240px;
}

@media (max-width: 768px) {
  .member-page {
    min-height: 0;
  }

  .member-page__workspace {
    grid-template-columns: 1fr;
  }

  .member-page__organization-card {
    min-height: 260px;
  }

  .member-page__heading-actions {
    justify-content: flex-start;
  }

  .member-page__filters {
    justify-content: flex-start;
  }

  .member-page__member-search {
    width: min(100%, 240px);
  }
}
</style>
