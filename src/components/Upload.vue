<template>
  <div class="clearfix">
    <a-upload
      :customRequest="handleUpload"
      v-model:file-list="fileList"
      list-type="picture-card"
      @preview="handlePreview"
      accept="image/*"
      :disabled="disabled"
      @remove="handleRemove"
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

const emit = defineEmits(["update:files", "change"]);
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
const fileList = ref([]);
if (typeof props.files == "string") {
  if (props.files.length > 0) {
    props.files.split(",").forEach((url) => {
      fileList.value.push({
        uid: new Date().getMilliseconds(),
        name: url,
        status: "done",
        url,
      });
    });
  } else {
    fileList.value = [];
  }
} else {
  fileList.value = props.files;
}
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
  emit("change");
};

const handleRemove = (ev) => {
  emit("update:files", fileList.value);
  emit("change");
  return true;
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
