<template>
  <section class="camera-org management-page list-page" :aria-busy="loading">
    <div class="list-page__top">
      <header class="management-page__heading"><div><span class="management-page__eyebrow">摄像头管理</span><h1>组织管理</h1><p>维护公司、组织和门店；设备与成员归属使用此视频业务组织树。</p></div><div class="camera-org__actions"><el-button :loading="loading" @click="reload">刷新</el-button><el-button v-if="permissions.insert" type="primary" @click="openCreate()">新增公司</el-button></div></header>
      <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" />
    </div>
    <div class="list-page__middle camera-org__layout" v-loading="loading">
      <el-card class="camera-org__tree"><template #header>视频组织树 · {{ organizations.length }} 个节点</template><OrganizationTree :data="tree" :selected="selectedId" @select="selectOrganization" /></el-card>
      <el-card class="camera-org__detail">
        <template #header>组织详情</template>
        <template v-if="selected">
          <el-descriptions :column="1" border><el-descriptions-item label="名称">{{ selected.name }}</el-descriptions-item><el-descriptions-item label="类型">{{ organizationTypeLabel(selected.type) }}</el-descriptions-item><el-descriptions-item label="组织编码">{{ selected.code || '未设置' }}</el-descriptions-item><el-descriptions-item label="上级">{{ parentName(selected.parent_id) }}</el-descriptions-item><el-descriptions-item label="直属设备">{{ selected.deviceCount }} 台</el-descriptions-item><el-descriptions-item label="状态">{{ selected.is_active ? '启用' : '已停用（下级视频访问同步停用）' }}</el-descriptions-item><el-descriptions-item label="排序">{{ selected.rank }}</el-descriptions-item><el-descriptions-item label="备注">{{ selected.remark || '暂无' }}</el-descriptions-item></el-descriptions>
          <div class="camera-org__actions camera-org__operations"><el-button v-if="permissions.insert && selected.type !== 'store'" type="primary" @click="openCreate(selected)">新增下级</el-button><el-button v-if="permissions.edit" @click="openEdit">编辑节点</el-button><el-button v-if="permissions.remove" type="danger" plain @click="removeNode">删除空节点</el-button></div>
        </template>
        <el-empty v-else description="选择左侧组织查看详情，或从新增公司开始" />
        <p class="camera-org__hint">公司为根节点；组织可归属公司或组织；门店归属组织且为叶子节点。删除前需先迁移下级、设备和成员，调整组织不会修改平台系统组织。</p>
      </el-card>
    </div>
    <footer class="list-page__bottom camera-org__hint">{{ organizations.filter((item) => item.type === 'store').length }} 家门店 · 未分配设备 {{ unassigned }} 台</footer>
    <el-dialog v-model="visible" :title="form.id ? '编辑视频组织' : '新增视频组织'" width="min(640px, 95vw)" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving">
        <el-form-item label="组织名称" prop="name"><el-input v-model="form.name" maxlength="100" placeholder="请输入公司、组织或门店名称" /></el-form-item>
        <el-form-item label="组织类型" prop="type"><el-select v-model="form.type" placeholder="请选择类型" @change="handleTypeChange"><el-option v-for="item in organizationTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item v-if="form.type !== 'company'" label="上级组织" prop="parentId"><el-tree-select v-model="form.parentId" :data="parentTree" node-key="id" :props="{ label: 'name', value: 'id', children: 'children' }" check-strictly default-expand-all placeholder="请选择上级公司或组织" /></el-form-item>
        <el-form-item label="组织编码" prop="code"><el-input v-model="form.code" maxlength="64" placeholder="选填，同一企业内唯一，例如 STORE-001" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.rank" :min="-100000" :max="100000" :precision="0" placeholder="数字越小越靠前" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.isActive" active-text="启用" inactive-text="停用" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" maxlength="500" placeholder="选填，说明组织用途" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveNode">保存组织</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import OrganizationTree from "@/components/camera/OrganizationTree.vue";
import { organizationIds, organizationTypeLabel, organizationTypes, workspaceRequest } from "@/service/camera-workspace.service";

const loading = ref(false);
const loadError = ref("");
const tree = ref([]);
const organizations = ref([]);
const permissions = ref({});
const unassigned = ref(0);
const selectedId = ref("");
const selected = computed(() => organizations.value.find((row) => row.id === selectedId.value));
const visible = ref(false);
const saving = ref(false);
const formRef = ref(null);
const form = reactive({ id: "", name: "", type: "company", parentId: null, code: "", rank: 0, isActive: true, remark: "" });
const rules = { name: [{ required: true, message: "请输入组织名称", trigger: "blur" }], type: [{ required: true, message: "请选择组织类型", trigger: "change" }], parentId: [{ required: true, message: "请选择上级组织", trigger: "change" }] };
/** 排除自己、后代、门店和停用节点，防止提交前选择明显非法的上级；服务端仍进行完整校验。 */
const parentTree = computed(() => {
  const excluded = form.id ? organizationIds(organizations.value, form.id) : new Set();
  const rows = organizations.value.filter((row) => !excluded.has(row.id) && row.type !== "store" && row.is_active).map((row) => ({ ...row, children: [], disabled: form.type === "store" && row.type !== "organization" }));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const roots = [];
  for (const row of rows) { if (byId.has(row.parent_id)) byId.get(row.parent_id).children.push(row); else roots.push(row); }
  return roots;
});

/** @param {Error} error 必填，统一接口错误。 @returns {void} 显示中文失败通知，不记录表单。 */
function report(error) { ElNotification.error({ title: "视频组织操作失败", message: error.message }); }
/** 无参数；返回 Promise<void>，加载可见组织与权限，保留错误提示。 */
async function reload() {
  loading.value = true; loadError.value = "";
  try { const data = await workspaceRequest("get", "/overview"); tree.value = data.tree; organizations.value = data.organizations; permissions.value = data.permissions; unassigned.value = data.unassignedCount; }
  catch (error) { loadError.value = error.message; report(error); }
  finally { loading.value = false; }
}
/** @param {object} row 必填，树选中节点。 @returns {void} 更新详情选择。 */
function selectOrganization(row) { selectedId.value = row.id; }
/** @param {string|null} id 必填，上级 UUID。 @returns {string} 可见上级名称或根节点说明。 */
function parentName(id) { return organizations.value.find((row) => row.id === id)?.name || "公司根节点"; }
/** @param {object} [parent] 可选，新节点上级。 @returns {void} 重置新增表单，不写数据。 */
function openCreate(parent) { Object.assign(form, { id: "", name: "", type: parent ? (parent.type === "company" ? "organization" : "store") : "company", parentId: parent?.id || null, code: "", rank: 0, isActive: true, remark: "" }); formRef.value?.clearValidate(); visible.value = true; }
/** 无参数；返回 void，将当前选中节点映射为编辑表单。 */
function openEdit() { const row = selected.value; Object.assign(form, { id: row.id, name: row.name, type: row.type, parentId: row.parent_id, code: row.code, rank: row.rank, isActive: row.is_active, remark: row.remark }); formRef.value?.clearValidate(); visible.value = true; }
/** @param {string} type 必填，组织类型。 @returns {void} 公司类型清空上级，其余保留用户选择。 */
function handleTypeChange(type) { if (type === "company") form.parentId = null; }
/** 无参数；返回 Promise<void>，验证表单后保存节点；停用时中文确认影响下级访问。 */
async function saveNode() {
  if (!await formRef.value.validate().catch(() => false)) return;
  try {
    if (form.id && !form.isActive && selected.value?.is_active) await ElMessageBox.confirm("停用后，此组织及下级普通成员将无法访问对应设备视频，确认继续？", "停用视频组织", { confirmButtonText: "确认停用", cancelButtonText: "取消", type: "warning" });
    saving.value = true;
    const data = await workspaceRequest(form.id ? "put" : "post", `/organizations${form.id ? `/${form.id}` : ""}`, { ...form }); selectedId.value = data.id; visible.value = false; ElNotification.success({ title: "组织已保存" }); await reload();
  } catch (error) { if (error !== "cancel" && error !== "close") report(error); }
  finally { saving.value = false; }
}
/** 无参数；返回 Promise<void>，二次确认删除空节点，服务端拒绝任何仍被引用的节点。 */
async function removeNode() {
  try { await ElMessageBox.confirm(`确认删除“${selected.value.name}”？仅能删除无下级、无设备和成员引用的空组织，不会级联删除数据。`, "删除视频组织", { confirmButtonText: "确认删除", cancelButtonText: "取消", type: "warning" }); await workspaceRequest("delete", `/organizations/${selectedId.value}`); selectedId.value = ""; ElNotification.success({ title: "组织已删除" }); await reload(); }
  catch (error) { if (error !== "cancel" && error !== "close") report(error); }
}
onMounted(reload);
</script>

<style lang="scss" scoped>
.camera-org {
  &__layout { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(300px, 2fr); gap: var(--app-space); align-items: start; }
  &__actions { display: flex; flex-wrap: wrap; gap: var(--app-space-sm); .el-button + .el-button { margin-left: 0; } }
  &__operations { margin-top: var(--app-space); }
  &__hint { color: var(--app-muted); font-size: 12px; line-height: 1.7; padding-top: var(--app-space-sm); }
  :deep(.camera-tree__body) { max-height: 60vh; }
  :deep(.el-select), :deep(.el-tree-select) { width: 100%; }
  @media (max-width: 760px) { &__layout { grid-template-columns: minmax(0, 1fr); } }
}
</style>
