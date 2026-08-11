<template>
  <el-dialog
    v-model="visible"
    title="新增数据表"
    width="600px"
    destroy-on-close
  >
    <el-form
      ref="form1"
      :model="tableState"
      label-position="left"
      label-width="120px"
      size="small"
      autocomplete="off"
    >
      <el-form-item
        label="表格名称"
        prop="className"
        :rules="[{ required: true, message: '请输入表格名称', trigger: 'blur' }]"
      >
        <el-input
          v-model="tableState.className"
          size="small"
          clearable
          placeholder="请输入表格名称"
        />
      </el-form-item>

      <el-form-item
        label="表格别名"
        prop="nickName"
        :rules="[{ required: true, message: '请输入表格别名', trigger: 'blur' }]"
      >
        <el-input
          v-model="tableState.nickName"
          size="small"
          clearable
          placeholder="请输入表格别名"
        />
      </el-form-item>

      <el-form-item label="生成路由" prop="generate">
        <el-switch
          v-model="tableState.generate"
          size="small"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item label="组织范围管理" prop="organizationScoped">
        <el-switch
          v-model="tableState.organizationScoped"
          size="small"
          active-text="启用"
          inactive-text="关闭"
        />
        <p class="schema-insert-form__help">
          启用后自动添加“所属组织”字段，并按组织树与成员管理范围隔离业务数据。
        </p>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button size="small" type="primary" @click="handleOk">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElNotification } from "element-plus";
import { reactive, ref, watch } from "vue";

const emit = defineEmits(["update:modelValue", "onSubmit"]);
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const visible = ref(props.modelValue);
const form1 = ref();
const tableState = reactive({
  className: null,
  nickName: null,
  generate: false,
  organizationScoped: true,
});

/**
 * 将新建数据表表单恢复为面向企业业务数据的安全默认值。
 * @returns {void} 原地重置响应式表单状态，不触发网络请求。
 */
const resetTableState = () => {
  tableState.className = null;
  tableState.nickName = null;
  tableState.generate = false;
  tableState.organizationScoped = true;
};

/**
 * 校验新建数据表配置并提交给父级 Schema 管理页。
 * @returns {Promise<void>} 校验成功时触发 onSubmit；失败时保留弹窗和字段提示。
 */
const handleOk = async () => {
  try {
    await form1.value.validate();
    emit("onSubmit", { ...tableState });
  } catch {
    ElNotification.warning({
      title: "数据表配置未完成",
      message: "请填写表名和显示名称后再创建。",
    });
  }
};

/**
 * 将父组件的 v-model 状态同步到 Element Plus Dialog。
 * @param {boolean} nextVisible 父组件传入的最新弹窗状态。
 * @returns {void} 更新本地可见状态；关闭时清理表单。
 */
watch(
  () => props.modelValue,
  (nextVisible) => {
    visible.value = nextVisible;
    if (!nextVisible) {
      resetTableState();
      form1.value?.resetFields?.();
    }
  },
  { immediate: true }
);

watch(visible, (nextVisible) => {
  if (nextVisible !== props.modelValue) emit("update:modelValue", nextVisible);
});
</script>

<style lang="scss" scoped>
.schema-insert-form__help {
  width: 100%;
  margin: 6px 0 0;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: anywhere;
}

</style>
