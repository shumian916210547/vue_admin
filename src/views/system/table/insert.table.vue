<template>
  <a-modal
    v-model:visible="visible"
    title="新增table"
    @ok="handleOk"
    width="600px"
  >
    <a-form
      :model="tableState"
      ref="form1"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
    >
      <a-form-item
        label="表格名称"
        name="className"
        :rules="[{ required: true, message: 'Please input your 表格名称!' }]"
      >
        <a-input
          v-model:value="tableState.className"
          allowClear
          placeholder="请输入表格名称"
        />
      </a-form-item>
      <a-form-item
        label="表格别名"
        name="nickName"
        :rules="[{ required: true, message: 'Please input your 表格别名!' }]"
      >
        <a-input
          v-model:value="tableState.nickName"
          allowClear
          placeholder="请输入表格别名"
        />
      </a-form-item>
      <a-form-item label="生成路由" name="generate">
        <a-switch
          v-model:checked="tableState.generate"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
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
});

const form1 = ref();
const handleOk = () => {
  Promise.all([form1.value.validate()])
    .then((success) => {
      emit("onSubmit", success[0]);
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
