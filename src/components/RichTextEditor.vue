<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      :style="{
        overflowY: 'hidden',
        minHeight: minHeight,
        maxHeight: maxHeight,
      }"
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
import axios from "axios";

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
  maxHeight: {
    type: String,
    default: "300px",
  },
  minHeight: {
    type: String,
    default: "300px",
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
const editorConfig = reactive({
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      /* server: process.env.VUE_APP_PARSE_SERVER_HOST + "/upload", */
      // 用户自定义上传图片
      customUpload(file, insertFn) {
        let data = new FormData();
        data.append("file", file); //file为上传文件返回的所有file
        let config = {
          method: "post",
          url: process.env.VUE_APP_PARSE_SERVER_HOST + "/upload", //上传图片的地址
          headers: {
            "Content-Type": "multipart/form-data",
          },
          data: data,
        };

        let that = this;
        axios(config)
          .then((res) => {
            if (res && res.data.code === 500) {
              alert(res.data.msg);
            }
            let url = process.env.VUE_APP_PARSE_SERVER_HOST + res.data.path; //服务器上的图片路径
            insertFn(url, "图片", url); //插入图片（使用的wangEditor插件）
          })
          .catch((error) => {
            console.log(error);
          });
      },
    },
  },
});

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

  console.log(editorRef.value.getConfig());
};
</script>    