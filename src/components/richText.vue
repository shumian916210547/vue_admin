<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 500px; overflow-y: hidden"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script>
import {
  onBeforeUnmount,
  ref,
  shallowRef,
  onMounted,
  defineComponent,
} from "vue";
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
export default defineComponent({
  components: { Editor, Toolbar },
  props: {
    valueHtml: {
      type: String,
      default: "",
    },
  },
  setup(props, ctx) {
    let { valueHtml } = props;
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef();

    // 模拟 ajax 异步获取内容
    onMounted(() => {});

    const toolbarConfig = {};
    const editorConfig = { placeholder: "请输入内容..." };

    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
      const editor = editorRef.value;
      if (editor == null) return;
      editor.destroy();
    });

    const handleCreated = (editor) => {
      editorRef.value = editor; // 记录 editor 实例，重要！
    };

    const handleChange = (editor) => {
      ctx.emit("update:valueHtml", editor.getHtml());
    };
    return {
      editorRef,
      valueHtml,
      mode: "default", // 或 'simple'
      toolbarConfig,
      editorConfig,
      handleCreated,
      handleChange,
    };
  },
});
</script>
