<template>
  <a-modal
    v-model:visible="visible"
    title="新增数据表"
    @ok="handleOk"
    width="600px"
  >
    <a-form
      :model="tableState"
      size="small"
      ref="form1"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
    >
      <a-form-item
        label="表格名称"
        name="className"
        :rules="[{ required: true, message: '请输入表格名称' }]"
      >
        <a-input
          size="small"
          v-model:value="tableState.className"
          allowClear
          placeholder="请输入表格名称"
        />
      </a-form-item>
      <a-form-item
        label="表格别名"
        name="nickName"
        :rules="[{ required: true, message: '请输入表格别名' }]"
      >
        <a-input
          size="small"
          v-model:value="tableState.nickName"
          allowClear
          placeholder="请输入表格别名"
        />
      </a-form-item>
      <a-form-item label="生成路由" name="generate">
        <a-switch
          size="small"
          v-model:checked="tableState.generate"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>
      <a-form-item
        label="组织范围管理"
        name="organizationScoped"
        extra="启用后自动添加“所属组织”字段，并按组织树与成员管理范围隔离业务数据。"
      >
        <a-switch
          size="small"
          v-model:checked="tableState.organizationScoped"
          checked-children="启用"
          un-checked-children="关闭"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { notification } from "ant-design-vue";
const emit = defineEmits(["update:modalVisible", "onSubmit"]);
const props = defineProps({
  modalVisible: {
    type: Boolean,
    default: false,
  },
});

watch(
  () => props.modalVisible,
  (n) => {
    visible.value = n;
  }
);
const visible = ref(props.modalVisible);
watch(visible, (n) => {
  emit("update:modalVisible", n);
});

const tableState = reactive({
  className: null,
  nickName: null,
  generate: false,
  organizationScoped: true,
});

const form1 = ref();
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
    const values = await form1.value.validate();
    emit("onSubmit", values);
  } catch {
    notification.warning({
      message: "数据表配置未完成",
      description: "请填写表名和显示名称后再创建。",
    });
  }
};

/**
 * 在弹窗关闭后清理上一次建表输入，防止管理员误复用表名或关闭组织范围配置。
 * @param {boolean} isVisible 弹窗最新可见状态；false 表示用户已关闭当前建表流程。
 * @returns {void} 关闭时重置字段和 Ant Design Vue 校验状态。
 */
watch(visible, (isVisible) => {
  if (isVisible) return;
  resetTableState();
  form1.value?.resetFields();
});
</script>
