<template>
  <a-form :model="pagination">
    <a-row>
      <a-col :span="8">
        <a-form-item label="名称">
          <a-input v-model:value="pagination.name" placeholder="请输入名称" />
        </a-form-item>
      </a-col>

      <a-col :span="5" :offset="1"> </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-button type="primary" @click="loadData(pagination)">查询</a-button>
        <a-button
          @click="
            () => {
              pagination.name = '';
            }
          "
          >重置</a-button
        >
      </a-col>
      <a-col
        :span="5"
        :offset="2"
        style="justify-content: space-evenly; display: flex"
      >
        <a-button type="primary" @click="showModal()">新建</a-button>
        <a-button @click="exportTemplate()">导出模板</a-button>
        <a-button @click="showIncModal()">导入</a-button>
        <a-button @click="exportData()">导出</a-button>
      </a-col>
    </a-row>
  </a-form>
  <a-table
    :pagination="pagination"
    :columns="tableColums"
    :data-source="tableData"
  >
    <template #bodyCell="{ column, record }">
      <span>{{ record[column?.key]?.name || record[column?.key] }}</span>
      <template v-if="column?.key === 'isDelete'">
        <span v-if="record.isDelete">是</span>
        <span v-else>否</span>
      </template>
      <template v-else-if="column?.key === 'operation'">
        <a-button type="primary" @click="showModal(record)">编辑</a-button>
        <a-popconfirm
          title="确定删除此行"
          ok-text="Yes"
          cancel-text="No"
          @confirm="handleDelete(record)"
        >
          <a-button type="primary" danger style="margin: 0 0 0 10px">
            删除
          </a-button>
        </a-popconfirm>
      </template>
    </template>
  </a-table>
  <!-- 表单 -->
  <a-modal v-model:visible="visible" :width="modalWidth" @ok="handleSubmit()">
    <slot name="form">
      <a-form :model="formValue" ref="formRef" autocomplete="off">
        <a-form-item
          v-for="(item, index) in Object.keys(fields)"
          :key="index"
          :label="fields[item].chineseName"
          :name="item"
          :rules="[
            {
              required: fields[item].required,
              message: 'Please input your' + fields[item].chineseName,
            },
          ]"
        >
          <component
            v-model:value="formValue[item]"
            :key="visible"
            :is="antd[fields[item].editComponent]"
            :placeholder="'Please input your' + fields[item].chineseName"
            :field-names="{ label: 'name', value: 'objectId' }"
            :options="getSelectOptions(fields[item].dataSource)"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </slot>
    <template #title>
      <span>{{ formValue.objectId != undefined ? "修改" : "新增" }}</span>
    </template>
  </a-modal>

  <!-- 导入 -->
  <a-modal
    v-model:visible="incVisible"
    width="1200px"
    title="导入"
    @ok="handleConfirmUpload"
  >
    <a-upload-dragger
      v-model:fileList="fileList"
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
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  watch,
  watchEffect,
} from "vue";
import { InboxOutlined } from "@ant-design/icons-vue";
import * as antdComponent from "ant-design-vue";
import * as xlsx from "xlsx";
import { debounce } from "lodash";
import { notification, message } from "ant-design-vue";
import richText from "./richText.vue";
import * as base from "@/apis/base";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
export default defineComponent({
  components: {
    InboxOutlined,
  },
  props: {},

  setup(props, ctx) {
    const route = useRoute();
    const store = useStore();
    let { meta } = route;
    let { companyId, className, columns, fields, modalWidth } = meta;
    const formValue = reactive({});
    const visible = ref(false);
    let antd = antdComponent;
    antd["richText"] = richText;
    /* 表头 */
    const tables = computed(() => {
      return store.getters["GETTABLES"];
    });
    let tableColums = ref([]);
    const incHeader = ref([]);
    watch(
      tables,
      (n, o) => {
        if (Object.keys(n).length) {
          Object.keys(n?.[className]).forEach((item) => {
            if (item != "company" && n?.[className]?.[item]?.chineseName) {
              incHeader.value.push({
                title: n?.[className]?.[item]?.chineseName,
                key: item,
              });
            }
          });
          tableColums.value = columns.map((field) => {
            return {
              key: field,
              dataIndex: field,
              title: n?.[className]?.[field]?.chineseName,
            };
          });
          tableColums.value.push({
            title: "操作",
            key: "operation",
            fixed: "right",
            width: 200,
          });
        }
      },
      { deep: true, immediate: true }
    );
    /* 分页器配置 */
    const pagination = reactive({
      position: ["bottomRight"],
      pageSize: 10,
      pageNum: 1,
      showSizeChanger: true,
      total: 0,
      companyId,
      className,
      showTotal: (total) => `Total ${total} items`,
      pageSizeOptions: ["10", "20", "50", "100"],
      onChange: (num, size) => {
        pagination.pageNum = num;
        pagination.pageSize = size;
        loadData({ pageNum: num, pageSize: size, companyId, className });
      },
      name: "",
    });
    /* 加载数据 */
    const tableData = ref([]);
    const loadData = async (params) => {
      const { data, code, msg } = await base.findAll(params);
      if (code == 200) {
        tableData.value = data.list;
        pagination.total = data.count;
      }
    };
    /* 删除 */
    const handleDelete = async ({ objectId }) => {
      const { msg, code, data } = await base.removeById({
        objectId,
        companyId,
        className,
      });
      if (code == 200) {
        notification["success"]({
          message: "删除提醒",
          description: data.name + "删除成功",
        });
        loadData(pagination);
      }
    };
    const showModal = (row) => {
      row
        ? Object.keys(row).map((key) => {
            if (key == "objectId") {
              formValue[key] = row[key];
            } else {
              if (fields[key]) {
                formValue[key] = row[key];
              }
              if (row[key].className && row[key].className !== "Company") {
                formValue[key] = row[key].objectId;
              }
            }
          })
        : (() => {
            Object.keys(fields).map((key) => {
              formValue[key] = fields[key].default || "";
            });
            formValue["objectId"] = undefined;
          })();
      visible.value = true;
    };
    const getSelectOptions = (key) => {
      return store.getters[key];
    };

    const formRef = ref();
    /* 模板导出 */
    const exportTemplate = () => {
      let keys = tables.value?.[className];
      delete keys["company"];
      const worksheet = xlsx.utils.json_to_sheet([], {
        header: Object.keys(keys).map((key) => {
          return keys[key].chineseName;
        }),
      });
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Template");
      xlsx.writeFile(workbook, "导入模板.xlsx");
    };
    /* 导入数据 */
    let incVisible = ref(false);
    const fileList = ref([]);
    const showIncModal = () => {
      incVisible.value = true;
    };
    const incData = ref([]);
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
    /* 确认上传数据 */
    const handleConfirmUpload = debounce(async () => {
      incVisible.value = false;
      let code, msg;
      try {
        ({ code, msg } = await base.insertList({
          className,
          companyId,
          columns: incHeader.value.map((item) => {
            return item.key;
          }),
          columnsData: incData.value,
        }));
        if (code == 200) {
          notification["success"]({
            message: "提醒",
            description: msg,
          });
          loadData(pagination);
        }
      } catch (error) {
        notification["error"]({
          message: "提醒",
          description: errorInfo.msg || "缺少必填项",
        });
      }
    }, 500);

    /* 文件移除 */
    const fileRemove = (e) => {
      incData.value = [];
    };
    /* 表单提交 */
    const handleSubmit = debounce(async (e) => {
      try {
        const params = await formRef.value.validateFields();
        let code, msg;
        if (formValue.objectId) {
          ({ code, msg } = await base.updateById({
            companyId,
            className,
            objectId: formValue.objectId,
            params,
          }));
        } else {
          ({ code, msg } = await base.insert({
            companyId,
            className,
            params,
          }));
        }
        if (code == 200) {
          notification["success"]({
            message: "提醒",
            description: msg,
          });
          loadData(pagination);
        }
        visible.value = false;
      } catch (errorInfo) {
        notification["error"]({
          message: "提醒",
          description: errorInfo.msg || "缺少必填项",
        });
      }
    }, 100);

    const exportData = debounce(async () => {
      const { total } = pagination;
      let { data, code, msg } = await base.findAll({
        pageSize: total,
        pageNum: 1,
        companyId,
        className,
      });
      let keys = tables.value?.[className];
      delete keys["company"];
      const worksheet = xlsx.utils.json_to_sheet(
        data.list.map((item) => {
          let t = new Object();
          Object.keys(keys).forEach((key) => {
            item[key] != null
              ? (t[JSON.stringify(keys[key].chineseName)] = item[key])
              : "";
          });
          return t;
        })
      );
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Template");
      xlsx.writeFile(workbook, "导出数据.xlsx");
    }, 500);
    onMounted(() => {
      loadData(pagination);
    });
    return {
      tableData,
      tableColums,
      pagination,
      visible,
      formValue,
      handleSubmit,
      formRef,
      fields,
      modalWidth,
      antd,
      fileList,
      incVisible,
      incData,
      incHeader,
      showModal,
      loadData,
      handleDelete,
      getSelectOptions,
      exportTemplate,
      showIncModal,
      upload,
      fileRemove,
      handleConfirmUpload,
      exportData,
    };
  },
});
</script>
