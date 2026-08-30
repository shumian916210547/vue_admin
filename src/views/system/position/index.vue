<template>
  <section class="position-page management-page list-page" :aria-busy="loading">
    <div class="list-page__top">
      <header class="management-page__heading">
        <div>
          <span class="management-page__eyebrow">岗位访问控制</span>
          <h1>岗位管理</h1>
          <p>为岗位选择可访问的业务页面，并在每个页面内细分查询、新建、编辑、删除等按钮权限。</p>
        </div>
        <div class="position-page__heading-actions management-page__heading-actions">
          <el-button size="small" v-auth="['permission:query', permissions]" :loading="loading" @click="reloadPositionPage">
            <template #icon><el-icon><Refresh /></el-icon></template>
            刷新配置
          </el-button>
          <el-button size="small" v-auth="['permission:insert', permissions]" type="primary" @click="openPositionModal('create')">
            <template #icon><el-icon><Plus /></el-icon></template>
            新增岗位
          </el-button>
        </div>
      </header>

      <el-alert
        v-if="loadError"
        class="management-page__alert"
        type="error"
        show-icon
        :title="loadError"
      >请确认当前账号为系统管理员，并检查系统路由配置是否已完成初始化。</el-alert>
    </div>

    <div class="list-page__middle position-page__middle">
      <el-card class="position-page__table-card">
      <template #header>
        <span class="management-page__card-title"><el-icon><CircleCheck /></el-icon> 岗位与页面权限</span>
      </template>
      <p class="position-page__tip">首页、系统管理和业务页面均可按岗位分配；保存后还会同步校验页面内按钮权限。删除岗位前须先为引用该岗位的成员重新分配岗位。</p>
      <div class="position-page__table-wrap">
        <el-table
          size="small"
          class="position-page__table"
          width="100%"
          :data="positions"
          v-loading="loading"
          row-key="objectId"
        >
        <el-table-column
          v-for="column in positionColumns"
          :key="column.key"
          :prop="column.dataIndex"
          :label="column.title"
          :width="column.width"
          :min-width="column.minWidth || (column.width ? undefined : 140)"
          :fixed="column.fixed"
          :class-name="column.className"
        >
        <template #default="{ row }">
          <template v-if="column.key === 'pages'">
            <span>{{ pageSummary(row.pagePermissions) }}</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="position-page__row-actions">
              <el-button size="small" v-auth="['permission:edit', permissions]" type="primary" link @click="openPositionModal('edit', row.objectId)">编辑权限</el-button>
              <el-popconfirm
                title="删除岗位会同步删除其页面和按钮权限；此操作不可恢复，确认继续吗？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="handleDeletePosition(row)"
              >
                <template #reference>
                  <el-button size="small" v-auth="['permission:remove', permissions]" type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
          <span v-else>{{ row[column.dataIndex] }}</span>
        </template>
        </el-table-column>
        </el-table>
      </div>
      </el-card>
    </div>

    <el-dialog
      v-model="positionModal.visible"
      :title="positionModal.mode === 'create' ? '新增岗位' : '编辑岗位权限'"
      :width="920"
      @close="closePositionModal"
    >
      <el-form size="small" ref="positionFormRef" :model="positionForm" :rules="positionRules" label-position="top">
        <el-form-item label="岗位名称" prop="name">
          <el-input size="small" v-model="positionForm.name" placeholder="例如：区域运营专员" maxlength="100" />
          <p class="form-item-help">一个成员只能分配一个岗位；岗位名称在当前企业内唯一。</p>
        </el-form-item>
        <section class="position-page__permission-section" aria-label="页面与按钮权限">
          <div class="position-page__permission-heading">
            <div>
              <strong>页面与按钮权限</strong>
              <p>勾选页面后，可在该页面内选择允许执行的按钮操作；“查看数据”为已选页面的必选权限。</p>
            </div>
            <el-tag size="small" type="primary">{{ selectedPageCount }} 个页面已选</el-tag>
          </div>
          <el-empty v-if="!permissionTreeData.length" description="暂无可配置页面；系统目录会自动补齐，业务页面请先在模块管理中创建并关联路由。" />
          <div v-else class="position-page__permission-tree app-scrollbar">
            <el-tree
              :key="`${positionModal.mode}-${positionModal.visible}`"
              show-checkbox
              check-strictly
              default-expand-all
              node-key="key"
              :data="permissionTreeData"
              :default-checked-keys="permissionTreeCheckedKeys.checked"
              :props="{ label: 'title', children: 'children' }"
              @check="handlePermissionTreeCheck"
            >
              <template #default="{ data }">
                <div
                  class="position-page__tree-title"
                  :class="`position-page__tree-title--${data.nodeType}`"
                >
                  <strong v-if="data.nodeType === 'module'">{{ data.title }}</strong>
                  <template v-else-if="data.nodeType === 'page'">
                    <strong>{{ data.title }}</strong>
                    <span class="position-page__tree-path">
                      {{ data.path ? `/${data.path}` : "未配置路径" }}
                    </span>
                  </template>
                  <span v-else>{{ data.title }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </section>
      </el-form>
      <template #footer>
        <el-button size="small" @click="closePositionModal">取消</el-button>
        <el-button size="small" type="primary" :loading="positionModal.submitting" @click="submitPosition">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { CircleCheck, Plus, Refresh } from "@element-plus/icons-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { ElNotification } from "element-plus";

import { Mixins } from "@/mixins";
import {
  createPosition,
  deletePosition,
  getPositionOverview,
  updatePosition,
} from "@/service/position.service";

/** 岗位表格列配置；页面数量和操作列由 bodyCell 插槽渲染。 */
const positionColumns = [
  { title: "岗位名称", dataIndex: "name", key: "name", minWidth: 220 },
  { title: "可访问页面", key: "pages", minWidth: 360 },
  { title: "操作", key: "actions", minWidth: 180, fixed: "right", className: "table-operation-column" },
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
  "permission:forceLogout": "强制下线",
  "permission:freeze": "冻结账号",
};
const loading = ref(false);
const loadError = ref("");
const positions = ref([]);
const routes = ref([]);
const buttonPermissions = ref([]);
const positionFormRef = ref();
const positionModal = reactive({ visible: false, mode: "create", submitting: false });
const positionForm = reactive({ objectId: "", name: "", pages: [] });
const { queryPermission } = Mixins();
const permissions = await queryPermission();

/** 岗位名称表单校验规则；页面权限可为空，用于创建暂未下放业务页面的预设岗位。 */
const positionRules = {
  name: [{ required: true, message: "请输入岗位名称", trigger: "blur" }],
};

/**
 * 生成页面权限树节点的稳定 key，避免模块名称或权限代码变化造成勾选状态错位。
 * @param {string} routeId 页面 Route 的 objectId。
 * @returns {string} 页面树节点 key。
 */
const getPageTreeKey = (routeId) => `page:${routeId}`;

/**
 * 生成页面下按钮权限树节点的稳定 key。
 * @param {string} routeId 页面 Route 的 objectId。
 * @param {string} permission 按钮权限 Code。
 * @returns {string} 按钮权限树节点 key。
 */
const getPermissionTreeKey = (routeId, permission) => `permission:${routeId}:${permission}`;

/**
 * 读取页面真实可用的按钮权限；新 BFF 返回逐页白名单，旧 BFF 未返回时才回退到兼容全局列表。
 * @param {Record<string, unknown>} page 页面权限草稿或 Route 目录项。
 * @returns {string[]} 当前页面可展示和提交的按钮权限 Code，始终包含页面读取权限。
 */
const getAvailablePagePermissions = (page) => {
  const configuredPermissions = Array.isArray(page?.availablePermissions) && page.availablePermissions.length
    ? page.availablePermissions
    : buttonPermissions.value;
  return [...new Set(["permission:query", ...configuredPermissions])];
};

/**
 * 将模块、页面和页面按钮权限转换为 Element Plus Tree 所需的三级树结构。
 * @returns {Array<Record<string, unknown>>} 模块树节点；页面和按钮节点携带业务定位字段供勾选事件使用。
 */
const permissionTreeData = computed(() => {
  const groups = new Map();
  for (const page of positionForm.pages) {
    const groupName = page.moduleName || "未分组页面";
    const groupKey = `module:${groupName}`;
    const group = groups.get(groupKey) || {
      key: groupKey,
      title: groupName,
      nodeType: "module",
      disabled: true,
      children: [],
    };
    group.children.push({
      key: getPageTreeKey(page.routeId),
      title: page.name,
      path: page.path,
      routeId: page.routeId,
      nodeType: "page",
      children: getAvailablePagePermissions(page).map((permission) => ({
        key: getPermissionTreeKey(page.routeId, permission),
        title: buttonPermissionLabels[permission] || permission,
        routeId: page.routeId,
        permission,
        nodeType: "permission",
        // 查询权限由页面启用状态自动维护，其他按钮必须先启用页面才能配置。
        disabled: permission === "permission:query" || !page.enabled,
      })),
    });
    groups.set(groupKey, group);
  }
  return [...groups.values()];
});
/**
 * 计算权限树的受控勾选状态；模块只用于分组，页面和按钮节点独立勾选。
 * @returns {{checked: string[], halfChecked: string[]}} Element Plus Tree 的受控勾选对象。
 */
const permissionTreeCheckedKeys = computed(() => {
  const checked = [];
  for (const page of positionForm.pages) {
    if (!page.enabled) continue;
    const availablePermissions = new Set(getAvailablePagePermissions(page));
    checked.push(getPageTreeKey(page.routeId));
    for (const permission of page.permissions) {
      if (availablePermissions.has(permission)) checked.push(getPermissionTreeKey(page.routeId, permission));
    }
  }
  return { checked, halfChecked: [] };
});
const selectedPageCount = computed(() => positionForm.pages.filter((page) => page.enabled).length);

/**
 * 构建表单使用的单个页面权限草稿；已授权页面默认保留已有按钮权限，新增页面默认带“查看数据”。
 * @param {Record<string, unknown>} route BFF 返回的可配置业务页面。
 * @param {string[]} selectedPermissions 编辑岗位时已有的按钮权限；新增岗位时为空数组。
 * @returns {{routeId: string, name: string, path: string, moduleName: string, availablePermissions: string[], enabled: boolean, permissions: string[]}} 可直接绑定的页面表单项。
 */
const createPagePermissionDraft = (route, selectedPermissions = []) => {
  const availablePermissions = getAvailablePagePermissions(route);
  const allowedPermissions = new Set(availablePermissions);
  const enabled = selectedPermissions.length > 0;
  const safeSelectedPermissions = selectedPermissions.filter((permission) => allowedPermissions.has(permission));
  const permissions = enabled
    ? [...new Set(["permission:query", ...safeSelectedPermissions])]
    : ["permission:query"];
  return {
    routeId: route.objectId,
    name: route.name || "未命名页面",
    path: route.path || "",
    moduleName: route.moduleName || "未分组页面",
    availablePermissions,
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
 * 处理权限树的页面或按钮勾选事件；页面节点控制访问开关，按钮节点只修改当前页面的权限 Code。
 * @param {Record<string, unknown>} data Tree 当前被操作的节点数据。
 * @param {{checkedKeys?: string[]}} info Tree 勾选事件信息，包含当前受控勾选 key 数组。
 * @returns {void} 更新岗位表单中的页面启用状态和按钮权限，不直接发起接口请求。
 */
const handlePermissionTreeCheck = (data, info) => {
  const node = data || {};
  const nodeKey = node.key;
  const checkedList = Array.isArray(info?.checkedKeys) ? info.checkedKeys : [];
  const checked = checkedList.includes(nodeKey);
  const page = positionForm.pages.find((item) => item.routeId === node.routeId);

  if (!page || node.nodeType === "module") return;

  if (node.nodeType === "page") {
    page.enabled = checked;
    togglePage(page);
    return;
  }

  if (node.nodeType !== "permission" || !page.enabled) return;

  const permissions = new Set(page.permissions);
  if (checked) permissions.add(node.permission);
  else permissions.delete(node.permission);
  page.permissions = [...permissions];
  handlePagePermissionChange(page);
};

/**
 * 将岗位页面草稿整理为 BFF 需要的逐页授权请求体，未勾选页面不会发送。
 * @returns {Array<{routeId: string, permissions: string[]}>} 已选页面的安全授权数组。
 */
const selectedPagePermissions = () =>
  positionForm.pages
    .filter((page) => page.enabled)
    .map((page) => {
      const availablePermissions = new Set(getAvailablePagePermissions(page));
      return {
        routeId: page.routeId,
        permissions: [...new Set(page.permissions.filter((permission) => availablePermissions.has(permission)))],
      };
    });

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
    ElNotification.success({ title: "岗位管理", message: "岗位页面与按钮权限已保存。" });
    closePositionModal();
    await reloadOverview();
  } catch (error) {
    if (error?.errorFields) return;
    ElNotification.error({ title: "保存失败", message: error?.message || "岗位权限未能保存，请检查配置后重试。" });
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
 * 删除一个岗位。模板中的 Popconfirm 已向管理员展示不可逆影响，BFF 仍会阻止删除被成员使用的岗位。
 * @param {{objectId: string, name: string}} position 待删除岗位 DTO。
 * @returns {Promise<void>} 删除成功后刷新岗位列表；失败时展示服务端反馈。
 */
const handleDeletePosition = async (position) => {
  try {
    await deletePosition(position.objectId);
    ElNotification.success({ title: "岗位管理", message: `岗位“${position.name}”已删除。` });
    await reloadOverview();
  } catch (error) {
    ElNotification.error({ title: "删除失败", message: error?.message || "该岗位可能仍被成员使用，暂时不能删除。" });
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
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0;
  flex-direction: column;
}

.position-page__middle {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.position-page__heading-actions,
.position-page__row-actions,
.position-page__permission-heading {
  display: flex;
  align-items: center;
}

.position-page__heading-actions,
.position-page__row-actions {
  gap: 4px;
}

.position-page__heading-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.position-page__table-card {
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.position-page__table-card :deep(.el-card__body) {
  display: flex;
  min-width: 0;
  min-height: 0;
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
}

.position-page__table-wrap {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  flex: 1 1 auto;
}

.position-page__row-actions {
  flex-wrap: nowrap;
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

.position-page__permission-tree {
  max-height: min(50vh, 470px);
  overflow-y: auto;
  padding-right: 4px;
}

.position-page__tree-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  line-height: 1.5;
}

.position-page__tree-title strong {
  overflow-wrap: anywhere;
  color: var(--app-ink);
  white-space: normal;
}

.position-page__tree-title--module {
  font-size: 14px;
}

.position-page__tree-title--page {
  font-size: 13px;
}

.position-page__tree-title--permission {
  color: var(--app-muted);
  font-size: 12px;
}

.position-page__tree-path {
  max-width: 100%;
  overflow-wrap: anywhere;
  color: var(--app-muted);
  font-size: 12px;
  white-space: normal;
}

@media (max-width: 768px) {
  .position-page {
    min-height: 0;
  }

  .position-page__heading-actions {
    justify-content: flex-start;
  }

  .position-page__permission-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .position-page__tree-path {
    max-width: 100%;
  }
}
</style>
