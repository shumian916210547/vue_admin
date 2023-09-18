<template>
  <div class="clearfix">
    <a-upload
      :customRequest="handleUpload"
      v-model:file-list="fileList"
      list-type="picture-card"
      @preview="handlePreview"
      accept="image/*"
      :disabled="disabled"
    >
      <div v-if="fileList.length < props.maxLength">
        <plus-outlined />
        <div style="margin-top: 8px">Upload</div>
      </div>
    </a-upload>
    <a-modal
      :visible="previewVisible"
      :title="previewTitle"
      :footer="null"
      @cancel="handleCancel"
    >
      <img alt="example" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script setup>
import { PlusOutlined } from "@ant-design/icons-vue";
import Parse from "parse";
import { ref, watch } from "vue";
const props = defineProps({
  files: {
    type: [String, Array],
    default: new Array(),
  },
  maxLength: {
    type: [Number],
    default: 8,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

watch(
  () => props.files,
  () => {
    fileList.value = props.files;
  },
  { deep: true }
);

const emit = defineEmits("update:files", "onChange");
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const previewVisible = ref(false);
const previewImage = ref("");
const previewTitle = ref("");
const fileList = ref(props.files);
const handleUpload = async (file) => {
  const parseFile = new Parse.File(file.file.name, file.file, file.file.type);
  const result = await parseFile.save().catch((err) => {});
  if (!result) return;
  if (props.maxLength == 1) {
    fileList.value = [
      {
        uid: file.file.uid,
        name: result._name,
        status: "done",
        url: result._url,
      },
    ];
  } else {
    fileList.value = [
      ...fileList.value.map((item) => {
        if (item.uid == file.file.uid) {
          item = {
            uid: file.file.uid,
            name: result._name,
            status: "done",
            url: result._url,
          };
        }
        return item;
      }),
    ];
  }
  emit("update:files", fileList.value);
  emit("onChange", fileList.value);
};
const handleCancel = () => {
  previewVisible.value = false;
  previewTitle.value = "";
};
const handlePreview = async (file) => {
  if (!file.url && !file.preview) {
    file.preview = await getBase64(file.originFileObj);
  }
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
  previewTitle.value =
    file.name || file.url.substring(file.url.lastIndexOf("/") + 1);
};
</script>

<style lang="scss" scoped>
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
