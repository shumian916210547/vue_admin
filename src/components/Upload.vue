<template>
  <div class="upload-control">
    <el-upload
      size="small"
      :file-list="fileList"
      name="file"
      :list-type="fileType == 'image/*' ? 'picture-card' : 'text'"
      class="avatar-uploader"
      :show-upload-list="true"
      :action="uploadServer"
      :headers="uploadHeaders"
      :with-credentials="true"
      :before-upload="beforeUpload"
      @change="handleChange"
      @remove="handleRemove"
      @preview="handlePreview"
      :accept="fileType"
      :disabled="disabled"
    >
      <template v-if="fileType == 'image/*'">
        <div v-if="fileList.length < props.maxLength">
          <el-icon><Plus /></el-icon>
          <div class="upload-control__hint">{{ placeholder }}</div>
        </div>
      </template>
      <template v-else>
        <el-button v-if="fileList.length < props.maxLength" size="small">
          <el-icon><Upload /></el-icon>
          选择文件
        </el-button>
      </template>
    </el-upload>
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      @close="handleCancel"
      width="800px"
    >
      <template v-if="fileType == 'image/*'">
        <img alt="文件预览" class="upload-control__preview" :src="previewUrl" />
      </template>
      <template v-if="fileType == 'audio/*'">
        <audio controls aria-label="音频文件预览" class="upload-control__preview" :src="previewUrl" />
      </template>
      <template v-if="fileType == 'video/*'">
        <video controls aria-label="视频文件预览" class="upload-control__preview" :src="previewUrl" />
      </template>
      <template v-if="fileType == '*'">
        <img
          v-if="autoSelectComponent('img')"
          alt="文件预览"
          class="upload-control__preview"
          :src="previewUrl"
        />
        <audio
          v-if="autoSelectComponent('audio')"
          controls
          aria-label="音频文件预览"
          class="upload-control__preview"
          :src="previewUrl"
        />
        <video
          v-if="autoSelectComponent('video')"
          controls
          aria-label="视频文件预览"
          class="upload-control__preview"
          :src="previewUrl"
        />
        <embed
          v-if="autoSelectComponent('embed')"
          :src="previewUrl"
          type="application/pdf"
          width="100%"
          class="upload-control__document"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Plus, Upload } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import { getCsrfToken } from "@/service/api-client";
const props = defineProps({
  modelValue: {
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
  placeholder: { type: String, default: "请选择要上传的文件" },
});
const uploadServer =
  (window.__SHUMIAN_CONFIG__?.apiBase || process.env.VUE_APP_API_BASE || "/api") + "/files";
const uploadHeaders = computed(() => ({
  "X-CSRF-Token": getCsrfToken() || "",
}));

const emit = defineEmits(["update:modelValue", "change"]);
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
if (typeof props.modelValue == "string") {
  if (props.modelValue.length > 0) {
    props.modelValue.split(",").forEach((url) => {
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
  fileList.value = props.modelValue;
}
/**
 * 在文件发送到服务端前保留 Element Plus 的默认上传流程。
 * @param {File} file 待上传的浏览器文件对象；文件类型和大小由 BFF 继续进行最终校验。
 * @returns {boolean} 返回 true 允许上传组件继续发送请求。
 */
const beforeUpload = (file) => Boolean(file);
const handleChange = ({ file }) => {
  //判断上传图片文件是否上传完成
  if (file.status == "done") {
    const uploadResult = file.response?.data;
    if (!uploadResult?.url) return;
    if (props.maxLength == 1) {
      fileList.value = [
        {
          name: file.name,
          status: "done",
          url: uploadResult.url,
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
              url: uploadResult.url,
              uid: file.uid,
            };
          }
          return item;
        }),
      ];
    }
    emit("update:modelValue", fileList.value);
    emit("change");
  }
};

const handleRemove = (file, uploadFiles) => {
  fileList.value = uploadFiles;
  emit("update:modelValue", fileList.value);
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
.upload-control {
  max-width: 100%;
}

.upload-control__preview {
  display: block;
  width: 100%;
  max-height: 65vh;
  object-fit: contain;
}

.upload-control__document {
  height: 400px;
  max-height: 65vh;
  border: 1px solid var(--app-border-soft);
}

.upload-control__hint {
  margin-top: 8px;
  color: var(--app-muted);
  font-size: 12px;
}
</style>
