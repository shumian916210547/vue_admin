<template>
  <div class="clearfix">
    <a-upload
      v-model:file-list="fileList"
      name="file"
      :list-type="fileType == 'image/*' ? 'picture-card' : ''"
      class="avatar-uploader"
      :show-upload-list="true"
      :action="uploadServer"
      :before-upload="beforeUpload"
      @change="handleChange"
      @remove="handleRemove"
      @preview="handlePreview"
      :accept="fileType"
      :disabled="disabled"
    >
      <template v-if="fileType == 'image/*'">
        <div v-if="fileList.length < props.maxLength">
          <plus-outlined />
          <div style="margin-top: 8px">Upload</div>
        </div>
      </template>
      <template v-else>
        <a-button v-if="fileList.length < props.maxLength">
          <upload-outlined></upload-outlined>
          Upload
        </a-button>
      </template>
    </a-upload>
    <a-modal
      :visible="previewVisible"
      :title="previewTitle"
      :footer="null"
      @cancel="handleCancel"
      width="800px"
    >
      <template v-if="fileType == 'image/*'">
        <img alt="example" style="width: 100%;object-fit: contain;" :src="previewUrl" />
      </template>
      <template v-if="fileType == 'audio/*'">
        <audio alt="example" style="width: 100%" :src="previewUrl" />
      </template>
      <template v-if="fileType == 'video/*'">
        <video controls alt="example" style="width: 100%" :src="previewUrl" />
      </template>
      <template v-if="fileType == '*'">
        <img
          v-if="autoSelectComponent('img')"
          alt="example"
          style="width: 100%"
          :src="previewUrl"
        />
        <audio
          v-if="autoSelectComponent('audio')"
          alt="example"
          style="width: 100%"
          :src="previewUrl"
        />
        <video
          v-if="autoSelectComponent('video')"
          controls
          alt="example"
          style="width: 100%"
          :src="previewUrl"
        />
        <embed
          v-if="autoSelectComponent('embed')"
          :src="previewUrl"
          type="application/pdf"
          width="100%"
          style="height: 400px"
        />
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { PlusOutlined, UploadOutlined } from "@ant-design/icons-vue";
import Parse from "parse";
import { defineComponent, h, ref, watch } from "vue";
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
  fileType: { type: String, default: "*" },
});
const uploadServer = window.process.env.VUE_APP_PARSE_SERVER_HOST + "/upload";

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
const previewUrl = ref("");
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
const beforeUpload = (file) => {};
const handleChange = ({ file }) => {
  //判断上传图片文件是否上传完成
  if (file.status == "done") {
    if (props.maxLength == 1) {
      fileList.value = [
        {
          name: file.name,
          status: "done",
          url: window.process.env.VUE_APP_PARSE_SERVER_HOST + file.response.path,
          uid: file.uid,
        },
      ];
    } else {
      fileList.value = [
        ...fileList.value.map((item) => {
          if (item.uid == file.uid) {
            item = {
              name: file.name,
              status: "done",
              url: window.process.env.VUE_APP_PARSE_SERVER_HOST + file.response.path,
              uid: file.uid,
            };
          }
          return item;
        }),
      ];
    }
    emit("update:files", fileList.value);
    emit("change");
  }
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
  previewUrl.value = file.url || file.preview;
  previewVisible.value = true;
  previewTitle.value =
    file.name || file.url.substring(file.url.lastIndexOf("/") + 1);
};

const autoSelectComponent = (info) => {
  const lastname = previewTitle.value.substring(
    previewTitle.value.lastIndexOf(".") + 1
  );
  const arr = [
    {
      types: [
        "wmv",
        "avi",
        "dat",
        "asf",
        "mpeg",
        "mpg",
        "rm",
        "rmvb",
        "ram",
        "flv",
        "mp4",
        "3gp",
        "mov",
        "divx",
        "dv",
        "vob",
        "mkv",
        "qt",
        "cpk",
        "fli",
        "flc",
        "f4v",
        "m4v",
        "mod",
        "m2t",
        "swf",
        "webm",
        "mts",
        "m2ts",
        "3g2",
        "mpe",
        "ts",
        "div",
        "lavf",
        "dirac",
      ],
      component: "video",
    },
    {
      types: [
        "bmp",
        "jpg",
        "jpeg",
        "png",
        "tif",
        "gif",
        "pcx",
        "tga",
        "exif",
        "fpx",
        "svg",
        "psd",
        "cdr",
        "pcd",
        "dxf",
        "ufo",
        "eps",
        "ai",
        "raw",
        "WMF",
        "webp",
        "avif",
        "apng",
      ],
      component: "img",
    },
    {
      types: ["MP3", "WMA", "WAV", "APE", "FLAC", "OGG", "AAC"],
      component: "audio",
    },
    {
      types: ["pdf"],
      component: "embed",
    },
  ];
  let name = "";
  for (const item of arr) {
    if (item.types.includes(lastname)) {
      name = item.component;
      break;
    }
  }
  return name == info;
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
