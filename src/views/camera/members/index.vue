<template>
  <section class="camera-members management-page list-page" :aria-busy="loading">
    <div class="list-page__top">
      <header class="management-page__heading"><div><span class="management-page__eyebrow">摄像头管理</span><h1>成员管理</h1><p>设置成员归属组织和下级视频范围，支持关联企业账号或创建仅用于视频查看的新账号。</p></div><div class="camera-members__actions"><el-button :loading="loading" @click="reload">刷新</el-button><el-button v-if="permissions.insert" type="primary" @click="openCreate">新增视频成员</el-button></div></header>
      <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" />
      <div class="camera-members__filters"><el-input v-model="keyword" clearable placeholder="搜索登录账号、姓名或备注" aria-label="搜索视频成员" /><el-tree-select v-model="organizationFilter" :data="tree" node-key="id" :props="{ label: 'name', value: 'id', children: 'children' }" check-strictly clearable placeholder="筛选归属组织（含下级）" /><el-select v-model="statusFilter" clearable placeholder="全部授权状态"><el-option label="启用" value="active" /><el-option label="停用" value="inactive" /></el-select></div>
    </div>
    <div class="list-page__middle camera-members__table" v-loading="loading">
      <el-table :data="filteredMembers" row-key="id" height="100%">
        <el-table-column prop="username" label="登录账号" min-width="160" fixed="left" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="organization_name" label="归属组织" min-width="180" />
        <el-table-column label="数据范围" min-width="150"><template #default="{ row }">{{ row.include_descendants ? '归属组织及全部下级' : '仅归属组织直属设备' }}</template></el-table-column>
        <el-table-column label="授权状态" min-width="130"><template #default="{ row }"><el-tag :type="row.is_active && row.accountActive ? 'success' : 'info'">{{ !row.accountActive ? '平台账号已停用' : row.is_active ? '视频授权启用' : '视频授权停用' }}</el-tag></template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" min-width="180" fixed="right"><template #default="{ row }"><div class="camera-members__actions"><el-button v-if="permissions.edit" type="primary" link @click="openEdit(row)">编辑归属</el-button><el-button v-if="permissions.remove" type="danger" link @click="removeMember(row)">移除授权</el-button><span v-if="!permissions.edit && !permissions.remove">仅可查看</span></div></template></el-table-column>
      </el-table>
    </div>
    <footer class="list-page__bottom camera-members__hint">当前显示 {{ filteredMembers.length }} / {{ members.length }} 名成员。页面岗位权限与视频组织范围同时生效；移除视频授权会保留平台账号。</footer>

    <el-dialog v-model="visible" :title="form.id ? '编辑视频成员' : '新增视频成员'" width="min(640px, 95vw)" :close-on-click-modal="false" @closed="clearPassword">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="saving">
        <el-form-item v-if="!form.id" label="成员来源"><el-radio-group v-model="form.mode"><el-radio value="existing">关联现有账号</el-radio><el-radio v-if="canCreate" value="new">创建视频账号</el-radio></el-radio-group></el-form-item>
        <el-form-item v-if="form.mode === 'existing'" label="企业账号" prop="userId"><el-select v-model="form.userId" filterable remote :remote-method="searchAccounts" :loading="searching" :disabled="Boolean(form.id)" placeholder="输入账号或姓名搜索同企业成员"><el-option v-for="account in options" :key="account.userId" :label="`${account.name || account.username}（${account.username}）`" :value="account.userId" /></el-select></el-form-item>
        <template v-else><el-form-item label="登录账号" prop="username"><el-input v-model="form.username" maxlength="64" autocomplete="off" placeholder="请输入新的登录账号" /></el-form-item><el-form-item label="成员姓名" prop="name"><el-input v-model="form.name" maxlength="100" placeholder="请输入成员姓名" /></el-form-item><el-form-item label="初始密码" prop="password"><el-input v-model="form.password" type="password" show-password maxlength="256" autocomplete="new-password" placeholder="至少 12 位，避免使用常见密码" /></el-form-item><el-alert title="新账号自动分配“视频查看成员”岗位，仅能进入视频中心；不自动获得其他业务权限。" type="info" :closable="false" /></template>
        <el-form-item label="归属视频组织" prop="organizationId"><el-tree-select v-model="form.organizationId" :data="tree" node-key="id" :props="{ label: 'name', value: 'id', children: 'children', disabled: inactiveOrganization }" check-strictly default-expand-all placeholder="请选择归属公司、组织或门店" /></el-form-item>
        <el-form-item label="组织视频范围"><el-switch v-model="form.includeDescendants" active-text="包含全部下级" inactive-text="仅直属设备" /></el-form-item>
        <el-form-item label="视频授权状态"><el-switch v-model="form.isActive" active-text="启用" inactive-text="停用" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" maxlength="500" placeholder="选填，说明成员职责或授权原因" /></el-form-item>
        <p class="camera-members__hint">现有账号还需要在平台岗位中分配摄像头页面。这里仅维护视频组织归属，不修改原平台组织和岗位。平台系统管理员按租户拥有维护权限。</p>
      </el-form>
      <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveMember">保存成员</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { ElMessageBox, ElNotification } from "element-plus";
import { computed, onBeforeUnmount, onDeactivated, onMounted, reactive, ref } from "vue";
import { organizationIds, workspaceRequest } from "@/service/camera-workspace.service";

const loading = ref(false);
const loadError = ref("");
const members = ref([]);
const organizations = ref([]);
const tree = ref([]);
const permissions = ref({});
const canCreate = ref(false);
const keyword = ref("");
const organizationFilter = ref("");
const statusFilter = ref("");
const visible = ref(false);
const saving = ref(false);
const searching = ref(false);
const options = ref([]);
const formRef = ref(null);
const form = reactive({ id: "", mode: "existing", userId: "", username: "", password: "", name: "", organizationId: "", includeDescendants: true, isActive: true, remark: "" });
let searchVersion = 0;
/** 已授权成员快照的本地筛选，不复制通用 Schema CRUD 分页状态。 */
const filteredMembers = computed(() => {
  const ids = organizationFilter.value ? organizationIds(organizations.value, organizationFilter.value) : null;
  const word = keyword.value.trim().toLowerCase();
  return members.value.filter((row) => (!ids || ids.has(row.organization_id)) && (!word || `${row.username} ${row.name} ${row.remark}`.toLowerCase().includes(word)) && (!statusFilter.value || (statusFilter.value === "active" ? row.is_active : !row.is_active)));
});
const rules = {
  userId: [{ validator: validateAccount, trigger: "change" }],
  username: [{ required: true, message: "请输入新的登录账号", trigger: "blur" }],
  name: [{ required: true, message: "请输入成员姓名", trigger: "blur" }],
  password: [{ required: true, min: 12, message: "初始密码至少 12 位", trigger: "blur" }],
  organizationId: [{ required: true, message: "请选择归属视频组织", trigger: "change" }],
};

/** @param {object} rule 必填，Element Plus 规则。 @param {string} value 必填，用户ID。 @param {Function} done 必填，校验回调。 @returns {void} 校验关联账号是否已选择。 */
function validateAccount(rule, value, done) { done(form.mode === "existing" && !value ? new Error("请选择同企业成员账号") : undefined); }
/** @param {Error} error 必填，统一 API 错误。 @returns {void} 显示中文通知，不输出密码。 */
function report(error) { ElNotification.error({ title: "视频成员操作失败", message: error.message }); }
/** @param {object} row 必填，组织 DTO。 @returns {boolean} 停用节点不可分配成员。 */
function inactiveOrganization(row) { return !row.is_active; }
/** 无参数；返回 Promise<void>，读取成员和可见组织、按钮权限，保留可见错误。 */
async function reload() {
  loading.value = true; loadError.value = "";
  try { const [list, overview] = await Promise.all([workspaceRequest("get", "/members"), workspaceRequest("get", "/overview")]); members.value = list.members; organizations.value = overview.organizations; tree.value = overview.tree; permissions.value = overview.memberPermissions; canCreate.value = overview.canCreateAccount; }
  catch (error) { loadError.value = error.message; report(error); }
  finally { loading.value = false; }
}
/** @param {string} [word=""] 可选，账号/姓名关键词，最多64字符。 @returns {Promise<void>} 搜索同企业用户，丢弃旧请求结果。 */
async function searchAccounts(word = "") {
  const version = ++searchVersion; searching.value = true;
  try { const data = await workspaceRequest("get", "/members/options", undefined, { keyword: word.slice(0, 64) }); if (version === searchVersion) options.value = data; }
  catch (error) { if (version === searchVersion) report(error); }
  finally { if (version === searchVersion) searching.value = false; }
}
/** 无参数；返回 void，重置新增表单并搜索现有账号。 */
function openCreate() { Object.assign(form, { id: "", mode: "existing", userId: "", username: "", name: "", password: "", organizationId: organizationFilter.value || "", includeDescendants: true, isActive: true, remark: "" }); formRef.value?.clearValidate(); visible.value = true; searchAccounts(); }
/** @param {object} row 必填，成员 DTO。 @returns {void} 设置只允许调整归属/范围/状态的编辑表单。 */
function openEdit(row) { options.value = [{ userId: row.user_id, username: row.username, name: row.name }]; Object.assign(form, { id: row.id, mode: "existing", userId: row.user_id, username: row.username, name: row.name, password: "", organizationId: row.organization_id, includeDescendants: row.include_descendants, isActive: row.is_active, remark: row.remark }); formRef.value?.clearValidate(); visible.value = true; }
/** 无参数；返回 void，关闭或离开页面时清空明文初始密码。 */
function clearPassword() { form.password = ""; }
/** 无参数；返回 Promise<void>，通过表单验证后确认授权影响并保存，不回显账号密码。 */
async function saveMember() {
  if (!await formRef.value.validate().catch(() => false)) return;
  try {
    if (form.id) await ElMessageBox.confirm("调整组织、下级范围或授权状态会立即影响该成员的视频访问，确认保存？", "调整视频成员授权", { confirmButtonText: "确认保存", cancelButtonText: "取消", type: "warning" });
    saving.value = true;
    const body = { userId: form.userId, organizationId: form.organizationId, includeDescendants: form.includeDescendants, isActive: form.isActive, remark: form.remark, ...(form.mode === "new" ? { account: { username: form.username, password: form.password, name: form.name } } : {}) };
    await workspaceRequest(form.id ? "put" : "post", `/members${form.id ? `/${form.id}` : ""}`, body); visible.value = false; clearPassword(); ElNotification.success({ title: "视频成员已保存" }); await reload();
  } catch (error) { if (error !== "cancel" && error !== "close") report(error); }
  finally { saving.value = false; }
}
/** @param {object} row 必填，当前成员 DTO。 @returns {Promise<void>} 确认后移除视频授权，不删除平台账号。 */
async function removeMember(row) {
  try { await ElMessageBox.confirm(`确认移除“${row.name || row.username}”的视频成员授权？该账号将失去视频组织访问范围，平台账号及其他业务资料保留。`, "移除视频成员", { confirmButtonText: "确认移除", cancelButtonText: "取消", type: "warning" }); await workspaceRequest("delete", `/members/${row.id}`); ElNotification.success({ title: "视频授权已移除" }); await reload(); }
  catch (error) { if (error !== "cancel" && error !== "close") report(error); }
}
/** 无参数；返回 void，离开页面关闭表单并清空密码。 */
function leave() { visible.value = false; clearPassword(); searchVersion += 1; }
onMounted(reload);
onDeactivated(leave);
onBeforeUnmount(leave);
</script>

<style lang="scss" scoped>
.camera-members {
  &__actions, &__filters { display: flex; gap: var(--app-space-sm); align-items: center; flex-wrap: wrap; .el-button + .el-button { margin-left: 0; } }
  &__filters { margin: var(--app-space-sm) 0; > .el-input, > .el-select { width: min(280px, 100%); } }
  &__table { min-height: 240px; border: 1px solid var(--app-border); border-radius: var(--app-radius); }
  &__hint { color: var(--app-muted); font-size: 12px; line-height: 1.7; margin-top: var(--app-space-sm); }
  :deep(.el-select) { width: 100%; }
}
</style>
