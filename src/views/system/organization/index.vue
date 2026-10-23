<template>
  <section class="organization-page management-page list-page" :aria-busy="loading">
    <div class="list-page__top">
      <header class="management-page__heading">
        <div>
          <span class="management-page__eyebrow">组织治理</span>
          <h1>组织管理</h1>
          <p>维护企业总部、区域、地方公司和部门的层级关系；成员关联与组织数据权限请在“成员管理”中配置。</p>
        </div>
        <div class="management-page__heading-actions">
          <el-button size="small" v-auth="['permission:query', permissions]" type="primary" :loading="loading" @click="refreshOrganizationPage">
            <template #icon><el-icon><Refresh /></el-icon></template>
            刷新组织
          </el-button>
        </div>
      </header>

      <el-alert
        v-if="loadError"
        class="management-page__alert"
        type="error"
        show-icon
        :title="loadError"
      >请确认当前账号是系统管理员，并检查后端服务是否可用。</el-alert>
    </div>

    <div class="list-page__middle organization-page__middle">
      <el-row :gutter="20" class="organization-page__layout">
      <el-col :xs="24" :lg="10">
        <el-card class="organization-page__tree-card">
          <template #header>
            <div class="management-page__card-header">
              <span class="management-page__card-title"><el-icon><OfficeBuilding /></el-icon> 企业组织树</span>
              <el-button size="small" v-auth="['permission:insert', permissions]" type="primary" link @click="openOrganizationModal('create', null)">
                <template #icon><el-icon><Plus /></el-icon></template>
                新建根组织
              </el-button>
            </div>
          </template>
          <div class="organization-page__tree app-scrollbar">
            <el-tree
              v-if="organizationTreeData.length"
              :data="organizationTreeData"
              node-key="key"
              :current-node-key="selectedOrganizationId"
              :props="{ label: 'title', children: 'children' }"
              highlight-current
              default-expand-all
              @node-click="handleOrganizationSelect"
            >
              <template #default="{ data }">
                <span class="organization-page__tree-node">
                  <span class="organization-page__tree-node-title">{{ data.title }}</span>
                  <el-tag v-if="data.isActive === false" size="small" type="info">已停用</el-tag>
                </span>
              </template>
            </el-tree>
            <el-empty v-else description="暂无组织节点，请从总部开始创建" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="14">
        <el-card class="organization-page__detail-card">
          <template #header>
            <span class="management-page__card-title"><el-icon><Setting /></el-icon> {{ selectedOrganization ? "组织节点详情" : "组织配置说明" }}</span>
          </template>
          <template v-if="selectedOrganization">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="组织名称">{{ selectedOrganization.name }}</el-descriptions-item>
              <el-descriptions-item label="组织编码">{{ selectedOrganization.code || "未设置" }}</el-descriptions-item>
              <el-descriptions-item label="组织类型">{{ organizationTypeLabel(selectedOrganization.type) }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag size="small" :type="selectedOrganization.isActive ? 'success' : 'info'">
                  {{ selectedOrganization.isActive ? "启用" : "已停用" }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="上级组织">
                {{ organizationName(selectedOrganization.parentId) || "企业根节点" }}
              </el-descriptions-item>
              <el-descriptions-item label="排序">{{ selectedOrganization.rank }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ selectedOrganization.remark || "暂无备注" }}</el-descriptions-item>
            </el-descriptions>
            <div class="organization-page__detail-actions">
              <el-button size="small" v-auth="['permission:insertChildren', permissions]" type="primary" @click="openOrganizationModal('create', selectedOrganization.objectId)">
                <template #icon><el-icon><Plus /></el-icon></template>
                新建下级组织
              </el-button>
              <el-button size="small" v-auth="['permission:edit', permissions]" @click="openOrganizationModal('edit', selectedOrganization.objectId)">
                <template #icon><el-icon><Edit /></el-icon></template>
                编辑节点
              </el-button>
              <el-popconfirm
                title="仅可删除没有下级节点、未被成员或业务数据引用的空组织，确认继续吗？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="handleDeleteOrganization"
              >
                <template #reference>
                <el-button size="small" v-auth="['permission:remove', permissions]" type="danger">
                  <template #icon><el-icon><Delete /></el-icon></template>
                  删除空组织
                </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
          <el-empty v-else description="从左侧选择组织节点，或创建企业根组织" />
        </el-card>
      </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="organizationModal.visible"
      :title="organizationModal.mode === 'create' ? '新建组织节点' : '编辑组织节点'"
      @close="closeOrganizationModal"
    >
      <el-form size="small" ref="organizationFormRef" :model="organizationForm" :rules="organizationRules" label-position="top">
        <el-form-item label="组织名称" prop="name">
          <el-input size="small" v-model="organizationForm.name" placeholder="例如：华北区域公司" maxlength="100" />
        </el-form-item>
        <el-form-item label="组织编码" prop="code">
          <el-input size="small" v-model="organizationForm.code" placeholder="例如：CN-NORTH" maxlength="64" />
          <p class="form-item-help">同一企业内编码唯一；不填写时仅按名称管理。</p>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="组织类型" prop="type">
              <el-select size="small" v-model="organizationForm.type" placeholder="请选择组织类型">
                <el-option v-for="option in organizationTypeOptions" :key="option.value" v-bind="option" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="rank">
              <el-input-number size="small" v-model="organizationForm.rank" placeholder="请输入排序数字" :min="0" :max="999999" class="organization-page__full-control" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="上级组织" prop="parentId">
          <el-tree-select
            size="small"
            v-model="organizationForm.parentId"
            :data="organizationSelectTree"
            node-key="key"
            :props="{ label: 'title', value: 'value', children: 'children' }"
            clearable
            default-expand-all
            placeholder="不选择则作为企业根组织"
          />
        </el-form-item>
        <el-form-item v-if="organizationModal.mode === 'edit'" label="启用状态" prop="isActive">
          <el-switch size="small" v-model="organizationForm.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" size="small" v-model="organizationForm.remark" :rows="3" placeholder="填写适用业务范围、负责人或管理说明" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="closeOrganizationModal">取消</el-button>
        <el-button size="small" type="primary" :loading="organizationModal.submitting" @click="submitOrganization">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import {
  Delete,
  Edit,
  OfficeBuilding,
  Plus,
  Refresh,
  Setting,
} from "@element-plus/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { ElNotification } from "element-plus";

import { Mixins } from "@/mixins";
import {
  createOrganization,
  deleteOrganization,
  getOrganizationOverview,
  updateOrganization,
} from "@/service/organization.service";

/** 组织类型与用户可见中文名称的映射，键值与 BFF 白名单保持一致。 */
const organizationTypeOptions = [
  { value: "headquarters", label: "总公司 / 总部" },
  { value: "region", label: "区域公司" },
  { value: "branch", label: "地方公司 / 门店" },
  { value: "department", label: "部门" },
  { value: "other", label: "其他组织" },
];
const loading = ref(false);
const loadError = ref("");
const organizations = ref([]);
const tree = ref([]);
const selectedOrganizationId = ref("");
const organizationFormRef = ref();
const organizationModal = reactive({ visible: false, mode: "create", submitting: false });
const organizationForm = reactive({
  objectId: "",
  name: "",
  code: "",
  type: "other",
  parentId: undefined,
  rank: 0,
  isActive: true,
  remark: "",
});
const { queryPermission } = Mixins();
const permissions = await queryPermission();

/** 组织编辑表单的 Element Plus 校验规则。 */
const organizationRules = {
  name: [{ required: true, message: "请输入组织名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择组织类型", trigger: "change" }],
  rank: [{ type: "number", min: 0, max: 999999, message: "排序需在 0 到 999999 之间", trigger: "change" }],
};

/**
 * 将 BFF 组织树转换为 Element Plus Tree 和 TreeSelect 需要的节点结构。
 * @param {Array<Record<string, unknown>>} nodes 服务端返回的组织树节点数组。
 * @returns {Array<Record<string, unknown>>} 含 title、key、value、children 的组件节点数组。
 */
const toTreeData = (nodes) =>
  (nodes || []).map((node) => ({
    key: node.objectId,
    value: node.objectId,
    title: node.name,
    isActive: node.isActive,
    disabled: node.isActive === false,
    children: toTreeData(node.children),
  }));

const organizationTreeData = computed(() => toTreeData(tree.value));
const organizationSelectTree = computed(() => organizationTreeData.value);
const selectedOrganization = computed(() =>
  organizations.value.find((organization) => organization.objectId === selectedOrganizationId.value)
);

/**
 * 返回组织标识对应的显示名称。
 * @param {string | null | undefined} organizationId 待查询的组织 objectId。
 * @returns {string} 找到时返回组织名称；未找到或为空时返回空字符串。
 */
const organizationName = (organizationId) =>
  organizations.value.find((organization) => organization.objectId === organizationId)?.name || "";

/**
 * 返回组织类型的中文展示文案。
 * @param {string | undefined} type BFF 返回的组织类型代码。
 * @returns {string} 已知类型的中文名称；未知类型回退为“其他组织”。
 */
const organizationTypeLabel = (type) =>
  organizationTypeOptions.find((option) => option.value === type)?.label || "其他组织";

/**
 * 将组织表单恢复为新增节点的安全默认值。
 * @param {string | null | undefined} parentId 新建子节点时预填的上级组织 objectId；根节点传入空值。
 * @returns {void} 原地更新响应式表单状态，并清除上一条记录残留数据。
 */
const resetOrganizationForm = (parentId = undefined) => {
  Object.assign(organizationForm, {
    objectId: "",
    name: "",
    code: "",
    type: "other",
    parentId: parentId || undefined,
    rank: 0,
    isActive: true,
    remark: "",
  });
  organizationFormRef.value?.clearValidate?.();
};

/**
 * 请求当前企业的组织树和组织节点列表；失败时保留已展示数据以支持管理员参考和重试。
 * @returns {Promise<void>} 加载完成或错误通知显示后兑现。
 */
const reloadOverview = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const overview = await getOrganizationOverview();
    tree.value = Array.isArray(overview?.tree) ? overview.tree : [];
    organizations.value = Array.isArray(overview?.organizations) ? overview.organizations : [];
    if (!organizations.value.some((organization) => organization.objectId === selectedOrganizationId.value)) {
      selectedOrganizationId.value = organizations.value[0]?.objectId || "";
    }
  } catch (error) {
    loadError.value = error?.message || "组织配置加载失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

/**
 * 响应“刷新组织”按钮，重新加载组织树和节点详情。
 * @returns {Promise<void>} 组织概览刷新完成后兑现。
 */
const refreshOrganizationPage = async () => {
  await reloadOverview();
};

/**
 * 处理组织树选择事件，切换右侧详情面板的当前节点。
 * @param {Record<string, unknown> | undefined} data Element Plus Tree 当前节点数据。
 * @param {{key?: string} | undefined} node Element Plus Tree 当前节点实例。
 * @returns {void} 更新 selectedOrganizationId；未选择节点时清空详情。
 */
const handleOrganizationSelect = (data, node) => {
  selectedOrganizationId.value = data?.key || data?.value || node?.key || "";
};

/**
 * 打开组织新增或编辑弹窗，并根据模式填充安全的表单初值。
 * @param {"create" | "edit"} mode 弹窗模式；create 新增节点，edit 编辑已有节点。
 * @param {string | null} organizationId 编辑目标或新建子节点的组织 objectId。
 * @returns {void} 打开弹窗并重置或填充表单状态。
 */
const openOrganizationModal = (mode, organizationId) => {
  organizationModal.mode = mode;
  if (mode === "edit") {
    const organization = organizations.value.find((item) => item.objectId === organizationId);
    if (!organization) return;
    Object.assign(organizationForm, { ...organization });
    organizationFormRef.value?.clearValidate?.();
  } else {
    resetOrganizationForm(organizationId);
  }
  organizationModal.visible = true;
};

/**
 * 关闭组织弹窗并清除编辑状态；不发起任何数据写入。
 * @returns {void} 关闭弹窗并恢复新增表单默认值。
 */
const closeOrganizationModal = () => {
  organizationModal.visible = false;
  resetOrganizationForm();
};

/**
 * 提交组织新建或编辑表单。BFF 负责验证编码唯一性、父子循环、租户隔离与成员引用安全。
 * @returns {Promise<void>} 保存成功后刷新组织树并显示成功通知；失败时保留弹窗内容。
 */
const submitOrganization = async () => {
  try {
    await organizationFormRef.value?.validate?.();
    organizationModal.submitting = true;
    const payload = {
      name: organizationForm.name,
      code: organizationForm.code,
      type: organizationForm.type,
      parentId: organizationForm.parentId || null,
      rank: organizationForm.rank,
      isActive: organizationForm.isActive,
      remark: organizationForm.remark,
    };
    if (organizationModal.mode === "create") await createOrganization(payload);
    else await updateOrganization(organizationForm.objectId, payload);
    ElNotification.success({ title: "组织管理", message: "组织节点已保存。" });
    closeOrganizationModal();
    await reloadOverview();
  } catch (error) {
    if (error?.errorFields) return;
    ElNotification.error({ title: "保存失败", message: error?.message || "组织节点未能保存，请检查输入后重试。" });
  } finally {
    organizationModal.submitting = false;
  }
};

/**
 * 删除当前选中的空组织节点；前置确认由模板中的 Element Plus Popconfirm 提供，BFF 会再次校验成员与业务引用。
 * @returns {Promise<void>} 删除成功后刷新组织树；失败时展示服务端可读错误。
 */
const handleDeleteOrganization = async () => {
  if (!selectedOrganization.value) return;
  try {
    await deleteOrganization(selectedOrganization.value.objectId);
    ElNotification.success({ title: "组织管理", message: "空组织节点已删除。" });
    selectedOrganizationId.value = "";
    await reloadOverview();
  } catch (error) {
    ElNotification.error({ title: "删除失败", message: error?.message || "该组织仍被引用，暂时不能删除。" });
  }
};

onMounted(() => {
  void reloadOverview();
});
</script>

<style lang="scss" scoped>
.organization-page {
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0;
  flex-direction: column;
}

.organization-page__middle {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.organization-page__layout {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  row-gap: var(--app-space);
}

.organization-page__layout :deep(.el-col) {
  min-height: 0;
}

.organization-page__tree-card,
.organization-page__detail-card {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

.organization-page__tree-card :deep(.el-card__body),
.organization-page__detail-card :deep(.el-card__body) {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.organization-page__tree {
  min-width: 0;
  min-height: 360px;
  max-height: min(58vh, 620px);
  overflow: auto;
  padding-right: 6px;
}

.organization-page__tree-node,
.organization-page__detail-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.organization-page__tree-node-title {
  overflow: visible;
  white-space: normal;
  overflow-wrap: anywhere;
}

.organization-page__detail-actions {
  flex-wrap: wrap;
  margin-top: 20px;
}

.organization-page__full-control {
  width: 100%;
}

@media (max-width: 768px) {
  .organization-page__tree {
    min-height: 280px;
    max-height: 45vh;
  }
}
</style>
