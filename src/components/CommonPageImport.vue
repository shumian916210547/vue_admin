<template>
  <a-modal
    v-model:visible="modalVisible"
    width="1200px"
    title="导入"
    @ok="handleConfirmUpload"
  >
    <a-upload-dragger
      v-model:fileList="modalFileList"
      :customRequest="upload"
      @remove="fileRemove"
      name="file"
      :multiple="false"
      :max-count="1"
    >
      <p class="ant-upload-drag-icon">
        <inbox-outlined></inbox-outlined>
      </p>
      <p class="ant-upload-text">Click or drag file to this area to upload</p>
      <p class="ant-upload-hint">
        Support for a single or bulk upload. Strictly prohibit from uploading
        company data or other band files
      </p>
    </a-upload-dragger>
    <a-table :columns="incHeader" :data-source="incData" bordered>
      <template #bodyCell="{ column, record }">
        <div>{{ record[column.key] }}</div>
      </template>
    </a-table>
  </a-modal>
</template>


<script>
import { message } from "ant-design-vue";
import * as antdIcon from "@ant-design/icons-vue";
import * as xlsx from "xlsx";
import { debounce } from "lodash";
import { defineComponent, watch, ref } from "vue";

export default defineComponent({
  name: "CommonPageImport",
  components: { ...antdIcon },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    fileList: {
      type: Array,
      default: [],
    },
    dataSource: {
      type: Array,
      default: [],
    },
    columns: {
      type: Array,
      default: [],
    },
  },
  setup(props, { emit }) {
    let modalVisible = ref(props.visible);
    watch(modalVisible, (n) => {
      emit("update:visible", n);
    });

    let modalFileList = ref(props.fileList);
    watch(modalFileList, (n) => {
      emit("update:fileList", n);
    });

    let incData = ref(props.columns);

    let incHeader = ref(props.dataSource);

    const handleConfirmUpload = debounce(() => {
      emit("confirmUpload");
    }, 100);

    const upload = (e) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "binary" });
        incData.value = xlsx.utils
          .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
          .map((item) => {
            Object.keys(item).forEach((k) => {
              incHeader.value.forEach((l) => {
                Object.keys(l).forEach((v) => {
                  k == l[v] ? ((item[l.key] = item[k]), delete item[k]) : "";
                });
              });
            });
            return item;
          });
      };
      reader.readAsArrayBuffer(e.file);
      const timer = setTimeout(() => {
        fileList.value = [
          {
            uid: e.file.uid,
            name: e.file.name,
            status: "done",
            percent: 100,
          },
        ];
        message.success("上传成功");
        clearTimeout(timer);
      }, 200);
    };

    /* 文件移除 */
    const fileRemove = (e) => {
      incData.value = new Array();
    };

    return {
      modalVisible,
      modalFileList,
      incHeader,
      incData,
      upload,
      fileRemove,
      handleConfirmUpload,
    };
  },
});
</script>