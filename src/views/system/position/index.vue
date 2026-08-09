<template>
  <section class="position-page management-page" :aria-busy="loading">
    <header class="management-page__heading">
      <div>
        <span class="management-page__eyebrow">POSITION-BASED ACCESS CONTROL</span>
        <h1>岗位管理</h1>
        <p>为岗位选择可访问的业务页面，并在每个页面内细分查询、新建、编辑、删除等按钮权限。</p>
      </div>
      <div class="position-page__heading-actions">
        <a-button :loading="loading" @click="reloadPositionPage">
          <template #icon><ReloadOutlined /></template>
          刷新配置
        </a-button>
        <a-button type="primary" @click="openPositionModal('create')">
          <template #icon><PlusOutlined /></template>
          新增岗位
        </a-button>
      </div>
    </header>

    <a-alert
      v-if="loadError"
      class="management-page__alert"
      type="error"
      show-icon
      :message="loadError"
      description="请确认当前账号为系统管理员，并检查系统路由配置是否已完成初始化。"
    />

    <a-card class="position-page__table-card" :bordered="false">
      <template #title>
        <span class="management-page__card-title"><SafetyCertificateOutlined /> 岗位与页面权限</span>
      </template>
      <p class="position-page__tip">系统管理页面仅对系统管理员开放，不会出现在可下放页面中。删除岗位前须先为引用该岗位的成员重新分配岗位。</p>
      <a-table
        class="position-page__table"
        :columns="positionColumns"
        :data-source="positions"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 820 }"
        row-key="objectId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pages'">
            <span>{{ pageSummary(record.pagePermissions) }}</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="position-page__row-actions">
              <a-button type="link" @click="openPositionModal('edit', record.objectId)">编辑权限</a-button>
              <a-popconfirm
                title="删除岗位会同步删除其页面和按钮权限；此操作不可恢复，确认继续吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="handleDeletePosition(record)"
              >
                <a-button danger type="link">删除</a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="positionModal.visible"
      :title="positionModal.mode === 'create' ? '新增岗位' : '编辑岗位权限'"
      :confirm-loading="positionModal.submitting"
      :width="920"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitPosition"
      @cancel="closePositionModal"
    >
      <a-form ref="positionFormRef" :model="positionForm" :rules="positionRules" layout="vertical">
        <a-form-item label="岗位名称" name="name" extra="一个成员只能分配一个岗位；岗位名称在当前企业内唯一。">
          <a-input v-model:value="positionForm.name" placeholder="例如：区域运营专员" :maxlength="100" />
        </a-form-item>
        <section class="position-page__permission-section" aria-label="页面与按钮权限">
          <div class="position-page__permission-heading">
            <div>
              <strong>页面与按钮权限</strong>
              <p>勾选页面后，可在该页面内选择允许执行的按钮操作；“查看数据”为已选页面的必选权限。</p>
            </div>
            <a-tag color="blue">{{ selectedPageCount }} 个页面已选</a-tag>
          </div>
          <a-empty v-if="!groupedRoutes.length" description="暂无可下放的业务页面，请先在模块管理中配置业务路由。" />
          <div v-else class="position-page__permission-groups app-scrollbar">
            <section v-for="group in groupedRoutes" :key="group.name" class="position-page__permission-group">
              <h3>{{ group.name }}</h3>
              <article v-for="page in group.pages" :key="page.routeId" class="position-page__permission-card">
                <div class="position-page__permission-card-header">
                  <a-checkbox v-model:checked="page.enabled" @change="togglePage(page)">
                    <strong>{{ page.name }}</strong>
                  </a-checkbox>
                  <span>{{ page.path ? `/${page.path}` : "未配置路径" }}</span>
                </div>
                <a-checkbox-group
                  v-model:value="page.permissions"
                  :options="buttonPermissionOptions"
                  :disabled="!page.enabled"
                  class="position-page__button-permissions"
                  @change="handlePagePermissionChange(page)"
                />
              </article>
            </section>
          </div>
        </section>
      </a-form>
    </a-modal>
  </section>
</template>

<script setup>
import {
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { notification } from "ant-design-vue";

import {
  createPosition,
  deletePosition,
  getPositionOverview,
  updatePosition,
} from "@/service/position.service";

/** 岗位表格列配置；页面数量和操作列由 bodyCell 插槽渲染。 */
const positionColumns = [
  { title: "岗位名称", dataIndex: "name", key: "name", width: 220 },
  { title: "可访问页面", key: "pages", width: 360 },
  { title: "操作", key: "actions", width: 180, fixed: "right" },
];
/** 按钮权限代码的中文说明；由 BFF 返回的代码只在此白名单中展示。 */
const buttonPermissionLabels = {
  "permission:query": "查看数据（必选）",
  "permission:reset": "重置筛选",
  "permission:insert": "新建",
  "permission:preview": "查看详情",
  "permission:insertChildren": "新增下级",
  "permission:edit": "编辑",
  "permission:remove": "删除",
  "permission:insertField": "新增字段",
  "permission:editField": "编辑字段",
  "permission:removeField": "删除字段",
};
const loading = ref(false);
const loadError = ref("");
const positions = ref([]);
const routes = ref([]);
const buttonPermissions = ref([]);
const positionFormRef = ref();
const positionModal = reactive({ visible: false, mode: "create", submitting: false });
const positionForm = reactive({ objectId: "", name: "", pages: [] });

/** 岗位名称表单校验规则；页面权限可为空，用于创建暂未下放业务页面的预设岗位。 */
const positionRules = {
  name: [{ required: true, message: "请输入岗位名称", trigger: "blur" }],
};
const buttonPermissionOptions = computed(() =>
  buttonPermissions.value.map((permission) => ({
    value: permission,
    label: buttonPermissionLabels[permission] || permission,
    // 页面选中后必须可查看数据，否则路由虽可进入但业务数据请求会被 BFF 正确拒绝。
    disabled: permission === "permission:query",
  }))
);
const groupedRoutes = computed(() => {
  const groups = new Map();
  for (const page of positionForm.pages) {
    const groupName = page.moduleName || "未分组页面";
    const group = groups.get(groupName) || { name: groupName, pages: [] };
    group.pages.push(page);
    groups.set(groupName, group);
  }
  return [...groups.values()];
});
const selectedPageCount = computed(() => positionForm.pages.filter((page) => page.enabled).length);

/**
 * 构建表单使用的单个页面权限草稿；已授权页面默认保留已有按钮权限，新增页面默认带“查看数据”。
 * @param {Record<string, unknown>} route BFF 返回的可配置业务页面。
 * @param {string[]} selectedPermissions 编辑岗位时已有的按钮权限；新增岗位时为空数组。
 * @returns {{routeId: string, name: string, path: string, moduleName: string, enabled: boolean, permissions: string[]}} 可直接绑定的页面表单项。
 */
const createPagePermissionDraft = (route, selectedPermissions = []) => {
  const enabled = selectedPermissions.length > 0;
  const permissions = enabled
    ? [...new Set(["permission:query", ...selectedPermissions])]
    : ["permission:query"];
  return {
    routeId: route.objectId,
    name: route.name || "未命名页面",
    path: route.path || "",
    moduleName: route.moduleName || "未分组页面",
    enabled,
    permissions,
  };
};

/**
 * 将岗位 DTO 中的逐页权限转换为 routeId 索引，便于快速回填权限编辑表单。
 * @param {Array<{routeId: string, permissions: string[]}> | undefined} pagePermissions 岗位当前逐页授权数组。
 * @returns {Map<string, string[]>} 页面 objectId 到按钮权限数组的映射。
 */
const pagePermissionMap = (pagePermissions) =>
  new Map((pagePermissions || []).map((page) => [page.routeId, Array.isArray(page.permissions) ? page.permissions : []]));

/**
 * 将当前 BFF 页面目录转换为完整岗位权限表单。未授权页面仍显示，便于管理员一次性选择和保存。
 * @param {Array<{routeId: string, permissions: string[]}>} pagePermissions 待编辑岗位已保存的逐页权限。
 * @returns {Array<Record<string, unknown>>} 与 routes 一一对应的页面权限草稿数组。
 */
const buildPageDrafts = (pagePermissions = []) => {
  const permissionsByRoute = pagePermissionMap(pagePermissions);
  return routes.value.map((route) => createPagePermissionDraft(route, permissionsByRoute.get(route.objectId) || []));
};

/**
 * 拉取岗位、业务页面与按钮权限代码，失败时保留当前列表与表单数据供管理员继续参考。
 * @returns {Promise<void>} 页面配置刷新完成或错误状态更新后兑现。
 */
const reloadOverview = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const overview = await getPositionOverview();
    positions.value = Array.isArray(overview?.positions) ? overview.positions : [];
    routes.value = Array.isArray(overview?.routes) ? overview.routes : [];
    buttonPermissions.value = Array.isArray(overview?.buttonPermissions) ? overview.buttonPermissions : [];
  } catch (error) {
    loadError.value = error?.message || "岗位配置加载失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

/**
 * 响应岗位页刷新操作，重新加载列表和可下放页面目录。
 * @returns {Promise<void>} 刷新请求结束后兑现。
 */
const reloadPositionPage = async () => {
  await reloadOverview();
};

/**
 * 清空岗位编辑表单，生成基于当前路由目录的全新权限草稿。
 * @returns {void} 更新响应式表单状态并清除上一轮校验提示。
 */
const resetPositionForm = () => {
  Object.assign(positionForm, {
    objectId: "",
    name: "",
    pages: buildPageDrafts(),
  });
  positionFormRef.value?.clearValidate?.();
};

/**
 * 打开岗位新建或编辑弹窗，并根据目标岗位回填逐页按钮权限。
 * @param {"create" | "edit"} mode 弹窗模式。
 * @param {string | undefined} positionId 编辑目标的 Role objectId；新建时省略。
 * @returns {void} 更新岗位表单并显示弹窗。
 */
const openPositionModal = (mode, positionId = undefined) => {
  positionModal.mode = mode;
  if (mode === "edit") {
    const position = positions.value.find((item) => item.objectId === positionId);
    if (!position) return;
    Object.assign(positionForm, {
      objectId: position.objectId,
      name: position.name || "",
      pages: buildPageDrafts(position.pagePermissions),
    });
    positionFormRef.value?.clearValidate?.();
  } else {
    resetPositionForm();
  }
  positionModal.visible = true;
};

/**
 * 切换页面可访问状态。首次勾选时自动追加“查看数据”权限；取消勾选时保留按钮选择，以便重新勾选后恢复。
 * @param {{enabled: boolean, permissions: string[]}} page 当前页面权限表单项。
 * @returns {void} 原地修正页面权限数组，保证启用页面满足服务端最小权限要求。
 */
const togglePage = (page) => {
  if (page.enabled && !page.permissions.includes("permission:query")) {
    page.permissions = ["permission:query", ...page.permissions];
  }
};

/**
 * 处理页面内按钮多选变更，并强制保留“查看数据”这一已选页面的基础权限。
 * @param {{enabled: boolean, permissions: string[]}} page 当前页面权限表单项。
 * @returns {void} 原地补齐 permission:query，避免无效表单被发送到 BFF。
 */
const handlePagePermissionChange = (page) => {
  if (page.enabled && !page.permissions.includes("permission:query")) {
    page.permissions = ["permission:query", ...page.permissions];
  }
};

/**
 * 将岗位页面草稿整理为 BFF 需要的逐页授权请求体，未勾选页面不会发送。
 * @returns {Array<{routeId: string, permissions: string[]}>} 已选页面的安全授权数组。
 */
const selectedPagePermissions = () =>
  positionForm.pages
    .filter((page) => page.enabled)
    .map((page) => ({ routeId: page.routeId, permissions: [...new Set(page.permissions)] }));

/**
 * 提交岗位新增或编辑。BFF 会二次验证租户、页面归属与所有按钮权限代码。
 * @returns {Promise<void>} 保存成功后刷新岗位列表并关闭弹窗；失败时保留表单供修正。
 */
const submitPosition = async () => {
  try {
    await positionFormRef.value?.validate?.();
    positionModal.submitting = true;
    const payload = {
      name: positionForm.name,
      pagePermissions: selectedPagePermissions(),
    };
    if (positionModal.mode === "create") await createPosition(payload);
    else await updatePosition(positionForm.objectId, payload);
    notification.success({ message: "岗位管理", description: "岗位页面与按钮权限已保存。" });
    closePositionModal();
    await reloadOverview();
  } catch (error) {
    if (error?.errorFields) return;
    notification.error({ message: "保存失败", description: error?.message || "岗位权限未能保存，请检查配置后重试。" });
  } finally {
    positionModal.submitting = false;
  }
};

/**
 * 关闭岗位弹窗且不发送服务端写请求。
 * @returns {void} 隐藏弹窗并清除临时权限草稿。
 */
const closePositionModal = () => {
  positionModal.visible = false;
  resetPositionForm();
};

/**
 * 删除一个岗位。模板中的 popconfirm 已向管理员展示不可逆影响，BFF 仍会阻止删除被成员使用的岗位。
 * @param {{objectId: string, name: string}} position 待删除岗位 DTO。
 * @returns {Promise<void>} 删除成功后刷新岗位列表；失败时展示服务端反馈。
 */
const handleDeletePosition = async (position) => {
  try {
    await deletePosition(position.objectId);
    notification.success({ message: "岗位管理", description: `岗位“${position.name}”已删除。` });
    await reloadOverview();
  } catch (error) {
    notification.error({ message: "删除失败", description: error?.message || "该岗位可能仍被成员使用，暂时不能删除。" });
  }
};

/**
 * 将岗位的逐页授权转为紧凑的表格摘要。
 * @param {Array<{routeId: string, permissions: string[]}> | undefined} pagePermissions 岗位的逐页授权数组。
 * @returns {string} 已授权页面数及按钮权限总数的中文摘要。
 */
const pageSummary = (pagePermissions) => {
  const pages = Array.isArray(pagePermissions) ? pagePermissions : [];
  const buttons = pages.reduce((total, page) => total + (page.permissions?.length || 0), 0);
  return pages.length ? `${pages.length} 个页面，${buttons} 项按钮权限` : "暂未配置业务页面";
};

onMounted(() => {
  void reloadOverview();
});
</script>

<style lang="scss" scoped>
.position-page {
  display: flex;
  min-width: 0;
  min-height: 620px;
  gap: 20px;
  flex-direction: column;
}

.position-page__heading-actions,
.position-page__row-actions,
.position-page__permission-heading,
.position-page__permission-card-header {
  display: flex;
  align-items: center;
}

.position-page__heading-actions,
.position-page__row-actions {
  gap: 8px;
}

.position-page__heading-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.position-page__table-card {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.position-page__table-card :deep(.ant-card-head) {
  flex: 0 0 auto;
}

.position-page__table-card :deep(.ant-card-body) {
  display: flex;
  min-height: 0;
  gap: 14px;
  flex: 1 1 auto;
  flex-direction: column;
}

.position-page__tip {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.position-page__table {
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
}

.position-page__row-actions {
  justify-content: center;
}

.position-page__permission-section {
  margin-top: 4px;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: rgba(var(--app-primary-rgb), 0.035);
}

.position-page__permission-heading {
  margin-bottom: 14px;
  justify-content: space-between;
  gap: 16px;
}

.position-page__permission-heading strong {
  color: var(--app-ink);
}

.position-page__permission-heading p {
  margin: 4px 0 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.6;
}

.position-page__permission-groups {
  max-height: min(50vh, 470px);
  padding-right: 4px;
}

.position-page__permission-group + .position-page__permission-group {
  margin-top: 16px;
}

.position-page__permission-group h3 {
  margin: 0 0 8px;
  color: var(--app-ink);
  font-size: 14px;
}

.position-page__permission-card {
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-glass-strong);
}

.position-page__permission-card + .position-page__permission-card {
  margin-top: 8px;
}

.position-page__permission-card-header {
  justify-content: space-between;
  gap: 12px;
}

.position-page__permission-card-header strong {
  color: var(--app-ink);
}

.position-page__permission-card-header > span {
  max-width: 46%;
  overflow: hidden;
  color: var(--app-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.position-page__button-permissions {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
  gap: 8px 16px;
}

@media (max-width: 768px) {
  .position-page {
    min-height: 0;
  }

  .position-page__heading-actions {
    justify-content: flex-start;
  }

  .position-page__permission-heading,
  .position-page__permission-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .position-page__permission-card-header > span {
    max-width: 100%;
  }
}
</style>
