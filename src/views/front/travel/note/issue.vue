<template>
  <a-form
    :model="formState"
    name="basic"
    :label-col="{ span: 4 }"
    :wrapper-col="{ span: 20 }"
    autocomplete="off"
    @finish="onFinish"
    @finishFailed="onFinishFailed"
    style="margin: 20px 0 0 0"
    ref="form"
  >
    <a-form-item
      label="手记名称"
      name="name"
      :rules="[{ required: true, message: 'Please input your name!' }]"
    >
      <a-input v-model:value="formState.name" />
    </a-form-item>

    <a-form-item
      label="手记内容"
      name="content"
      :rules="[{ required: true, message: 'Please input your content!' }]"
    >
      <component
        v-model:value="formState.content"
        minHeight="400px"
        maxHeight="400px"
        :is="RichTextEditor"
      ></component>
    </a-form-item>

    <a-form-item :wrapper-col="{ offset: 20, span: 4 }">
      <a-button type="primary" html-type="submit">发布</a-button>
    </a-form-item>
  </a-form>
</template>
<script setup>
import { defineComponent, reactive, ref } from "vue";
import RichTextEditor from "@/components/RichTextEditor.vue";
import { addNote } from "../apis";
import { notification } from "ant-design-vue";

const formState = reactive({
  name: "",
  content: "",
});
const form = ref();
const onFinish = () => {
  Promise.all([form.value.validate()])
    .then((success) => {
      submit(success[0]);
    })
    .catch((error) => {
      console.log(error);
    });
};
const submit = async (params) => {
  const result = await addNote(params);
  if (result.id) {
    notification.success({ message: "发布成功" });
    history.back();
  } else {
    notification.error({ message: "发布失败" });
  }
};
const onFinishFailed = (errorInfo) => {
  console.log("Failed:", errorInfo);
};
</script>