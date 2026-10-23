<template>
  <div class="camera-tree">
    <el-input v-model="keyword" placeholder="搜索公司、组织或门店" clearable aria-label="搜索视频组织" />
    <div class="camera-tree__body app-scrollbar">
      <el-tree ref="treeRef" :data="data" node-key="id" :props="{ label: 'name', children: 'children' }" :current-node-key="selected" :filter-node-method="filterNode" default-expand-all highlight-current @node-click="selectNode">
        <template #default="{ data: node }"><span class="camera-tree__node"><span>{{ node.name }}</span><el-tag size="small" :type="node.is_active ? 'info' : 'danger'">{{ node.is_active ? organizationTypeLabel(node.type) : '已停用' }}</el-tag></span></template>
      </el-tree>
      <el-empty v-if="!data.length" :image-size="48" description="暂无可见视频组织" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { organizationTypeLabel } from "@/service/camera-workspace.service";

defineProps({ data: { type: Array, default: () => [] }, selected: { type: String, default: "" } });
const emit = defineEmits(["select"]);
const keyword = ref("");
const treeRef = ref(null);

/**
 * 按组织名称和编码过滤可见树。
 * @param {string} value 必填，关键词。
 * @param {object} node 必填，组织 DTO。
 * @returns {boolean} 是否匹配，无网络副作用。
 */
function filterNode(value, node) { return !value || `${node.name} ${node.code}`.toLowerCase().includes(value.toLowerCase()); }
/**
 * 向父页面通知选中节点，范围仍由后端校验。
 * @param {object} node 必填，选中的可见节点。
 * @returns {void} 发出 select 事件。
 */
function selectNode(node) { emit("select", node); }
/**
 * 将搜索输入应用到树组件。
 * @param {string} value 必填，当前关键词。
 * @returns {void} 仅更新树展示。
 */
function applyFilter(value) { treeRef.value?.filter(value); }
watch(keyword, applyFilter);
</script>

<style lang="scss" scoped>
.camera-tree {
  display: flex; flex-direction: column; min-height: 0; gap: var(--app-space-sm);
  &__body { min-height: 0; overflow: auto; }
  &__node { display: flex; gap: var(--app-space-sm); align-items: center; min-width: 0; > span { overflow: hidden; text-overflow: ellipsis; } }
}
</style>
