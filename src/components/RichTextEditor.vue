<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="
        height: 500px;
        overflow-y: hidden;
        min-height: 200px;
        height: 200px;
      "
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    ></Editor>
  </div>
</template>

<script setup>
import "@wangeditor/editor/dist/css/style.css"; // 引入 css

import {
  onBeforeUnmount,
  ref,
  shallowRef,
  onMounted,
  watch,
  reactive,
  onUnmounted,
} from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";

const props = defineProps({
  value: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "请输入内容...",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:value"]);

const mode = "default";

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref(props.value);
const handleChange = (editor) => {
  emit("update:value", valueHtml.value);
};

const toolbarConfig = {};
const editorConfig = reactive({ placeholder: props.placeholder });

onMounted(() => {});

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor) => {
  props.disabled ? editor.disable() : editor.enable();
  editorRef.value = editor; // 记录 editor 实例，重要！
};
</script>    