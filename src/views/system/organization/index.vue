<template>
  <section class="organization-page management-page" :aria-busy="loading">
    <header class="management-page__heading">
      <div>
        <span class="management-page__eyebrow">组织治理</span>
        <h1>组织管理</h1>
        <p>维护企业总部、区域、地方公司和部门的层级关系；成员关联与组织数据权限请在“成员管理”中配置。</p>
      </div>
      <div class="management-page__heading-actions">
        <a-button size="small" v-auth="['permission:query', permissions]" type="primary" :loading="loading" @click="refreshOrganizationPage">
          <template #icon><ReloadOutlined /></template>
          刷新组织
        </a-button>
      </div>
    </header>

    <a-alert
      v-if="loadError"
      class="management-page__alert"
      type="error"
      show-icon
      :message="loadError"
      description="请确认当前账号是系统管理员，并检查后端服务是否可用。"
    />

    <a-row :gutter="[20, 20]" class="organization-page__layout">
      <a-col :xs="24" :xl="10">
        <a-card class="organization-page__tree-card" :bordered="false">
          <template #title>
            <span class="management-page__card-title"><ApartmentOutlined /> 企业组织树</span>
          </template>
          <template #extra>
            <a-button size="small" v-auth="['permission:insert', permissions]" type="link" @click="openOrganizationModal('create', null)">
              <template #icon><PlusOutlined /></template>
              新建根组织
            </a-button>
          </template>
          <div class="organization-page__tree app-scrollbar">
            <a-tree
              v-if="organizationTreeData.length"
              :tree-data="organizationTreeData"
              :selected-keys="selectedOrganizationId ? [selectedOrganizationId] : []"
              default-expand-all
              block-node
              @select="handleOrganizationSelect"
            >
              <template #title="{ title, dataRef }">
                <span class="organization-page__tree-node">
                  <span class="organization-page__tree-node-title">{{ title }}</span>
                  <a-tag v-if="dataRef.isActive === false" color="default">已停用</a-tag>
                </span>
              </template>
            </a-tree>
            <a-empty v-else description="暂无组织节点，请从总部开始创建" />
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="14">
        <a-card class="organization-page__detail-card" :bordered="false">
          <template #title>
            <span class="management-page__card-title"><SettingOutlined /> {{ selectedOrganization ? "组织节点详情" : "组织配置说明" }}</span>
          </template>
          <template v-if="selectedOrganization">
            <a-descriptions :column="{ xs: 1, sm: 2 }" bordered size="small">
              <a-descriptions-item label="组织名称">{{ selectedOrganization.name }}</a-descriptions-item>
              <a-descriptions-item label="组织编码">{{ selectedOrganization.code || "未设置" }}</a-descriptions-item>
              <a-descriptions-item label="组织类型">{{ organizationTypeLabel(selectedOrganization.type) }}</a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="selectedOrganization.isActive ? 'success' : 'default'">
                  {{ selectedOrganization.isActive ? "启用" : "已停用" }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="上级组织">
                {{ organizationName(selectedOrganization.parentId) || "企业根节点" }}
              </a-descriptions-item>
              <a-descriptions-item label="排序">{{ selectedOrganization.rank }}</a-descriptions-item>
              <a-descriptions-item label="备注" :span="1">{{ selectedOrganization.remark || "暂无备注" }}</a-descriptions-item>
            </a-descriptions>
            <div class="organization-page__detail-actions">
              <a-button size="small" v-auth="['permission:insertChildren', permissions]" type="primary" @click="openOrganizationModal('create', selectedOrganization.objectId)">
                <template #icon><PlusOutlined /></template>
                新建下级组织
              </a-button>
              <a-button size="small" v-auth="['permission:edit', permissions]" @click="openOrganizationModal('edit', selectedOrganization.objectId)">
                <template #icon><EditOutlined /></template>
                编辑节点
              </a-button>
              <a-popconfirm
                title="仅可删除没有下级节点、未被成员或业务数据引用的空组织，确认继续吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="handleDeleteOrganization"
              >
                <a-button size="small" v-auth="['permission:remove', permissions]" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除空组织
                </a-button>
              </a-popconfirm>
            </div>
          </template>
          <a-empty v-else description="从左侧选择组织节点，或创建企业根组织" />
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="organizationModal.visible"
      :title="organizationModal.mode === 'create' ? '新建组织节点' : '编辑组织节点'"
      :confirm-loading="organizationModal.submitting"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitOrganization"
      @cancel="closeOrganizationModal"
    >
      <a-form size="small" ref="organizationFormRef" :model="organizationForm" :rules="organizationRules" layout="vertical">
        <a-form-item label="组织名称" name="name">
          <a-input size="small" v-model:value="organizationForm.name" placeholder="例如：华北区域公司" :maxlength="100" />
        </a-form-item>
        <a-form-item label="组织编码" name="code" extra="同一企业内编码唯一；不填写时仅按名称管理。">
          <a-input size="small" v-model:value="organizationForm.code" placeholder="例如：CN-NORTH" :maxlength="64" />
        </a-form-item>
        <a-row :gutter="[12, 0]">
          <a-col :span="12">
            <a-form-item label="组织类型" name="type">
              <a-select size="small" v-model:value="organizationForm.type" :options="organizationTypeOptions" placeholder="请选择组织类型" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序" name="rank">
              <a-input-number size="small" v-model:value="organizationForm.rank" placeholder="请输入排序数字" :min="0" :max="999999" class="organization-page__full-control" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="上级组织" name="parentId">
          <a-tree-select
            size="small"
            v-model:value="organizationForm.parentId"
            :tree-data="organizationSelectTree"
            allow-clear
            tree-default-expand-all
            placeholder="不选择则作为企业根组织"
          />
        </a-form-item>
        <a-form-item v-if="organizationModal.mode === 'edit'" label="启用状态" name="isActive">
          <a-switch size="small" v-model:checked="organizationForm.isActive" checked-children="启用" un-checked-children="停用" />
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea size="small" v-model:value="organizationForm.remark" :rows="3" placeholder="填写适用业务范围、负责人或管理说明" :maxlength="500" />
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<script setup>
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { notification } from "ant-design-vue";

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

/** 组织编辑表单的 Ant Design Vue 校验规则。 */
const organizationRules = {
  name: [{ required: true, message: "请输入组织名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择组织类型", trigger: "change" }],
  rank: [{ type: "number", min: 0, max: 999999, message: "排序需在 0 到 999999 之间", trigger: "change" }],
};

/**
 * 将 BFF 组织树转换为 Ant Tree 和 TreeSelect 需要的节点结构。
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
 * @param {string[]} selectedKeys Ant Tree 返回的已选择 key 数组。
 * @returns {void} 更新 selectedOrganizationId；未选择节点时清空详情。
 */
const handleOrganizationSelect = (selectedKeys) => {
  selectedOrganizationId.value = selectedKeys[0] || "";
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
    notification.success({ message: "组织管理", description: "组织节点已保存。" });
    closeOrganizationModal();
    await reloadOverview();
  } catch (error) {
    if (error?.errorFields) return;
    notification.error({ message: "保存失败", description: error?.message || "组织节点未能保存，请检查输入后重试。" });
  } finally {
    organizationModal.submitting = false;
  }
};

/**
 * 删除当前选中的空组织节点；前置确认由模板中的 a-popconfirm 提供，BFF 会再次校验成员与业务引用。
 * @returns {Promise<void>} 删除成功后刷新组织树；失败时展示服务端可读错误。
 */
const handleDeleteOrganization = async () => {
  if (!selectedOrganization.value) return;
  try {
    await deleteOrganization(selectedOrganization.value.objectId);
    notification.success({ message: "组织管理", description: "空组织节点已删除。" });
    selectedOrganizationId.value = "";
    await reloadOverview();
  } catch (error) {
    notification.error({ message: "删除失败", description: error?.message || "该组织仍被引用，暂时不能删除。" });
  }
};

onMounted(() => {
  void reloadOverview();
});
</script>

<style lang="scss" scoped>
.organization-page {
  display: flex;
  min-width: 0;
  gap: 20px;
  flex-direction: column;
}

.organization-page__layout {
  min-width: 0;
}

.organization-page__tree-card,
.organization-page__detail-card {
  height: 100%;
}

.organization-page__tree {
  min-height: 360px;
  max-height: min(58vh, 620px);
  padding-right: 6px;
}

.organization-page__tree-node,
.organization-page__detail-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.organization-page__tree-node-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
