<template>
  <a-form :model="pagination">
    <a-row>
      <a-col :span="8">
        <a-form-item label="名称" v-permission="'Search'">
          <a-input
            :disabled="false"
            v-model:value="pagination.name"
            placeholder="请输入名称"
          />
        </a-form-item>
      </a-col>

      <a-col :span="5" :offset="1"> </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-form-item v-permission="'Search'">
          <a-button
            v-permission="'Search'"
            type="primary"
            @click="loadData(pagination)"
            >查询</a-button
          >
        </a-form-item>

        <a-form-item v-permission="'Search'">
          <a-button
            v-permission="'Search'"
            @click="
              () => {
                pagination.name = '';
              }
            "
            >重置</a-button
          >
        </a-form-item>
      </a-col>
      <a-col
        :span="5"
        :offset="2"
        style="justify-content: space-evenly; display: flex"
      >
        <a-form-item>
          <a-button v-permission="'Insert'" type="primary" @click="showModal()"
            >新建</a-button
          >
          <a-button v-permission="'Export_Template'" @click="exportTemplate()"
            >导出模板</a-button
          >
          <a-button v-permission="'Import'" @click="showIncModal()"
            >导入</a-button
          >
          <a-button v-permission="'Export'" @click="exportData()"
            >导出</a-button
          >
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
  <a-table
    :pagination="pagination"
    :loading="loading"
    @change="loadData(pagination)"
    :columns="tableColums"
    :data-source="tableData"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column?.key === 'isDelete'">
        <span v-if="record.isDelete">是</span>
        <span v-else>否</span>
      </template>
      <template v-else-if="column?.key === 'status'">
        <span v-if="record.status">已完成</span>
        <span v-else>未完成</span>
      </template>
      <template v-else-if="column?.key === 'operation'">
        <a-button
          v-permission="'Edit'"
          type="primary"
          @click="showModal(record)"
          >编辑</a-button
        >

        <a-popconfirm
          title="确定删除此行"
          ok-text="Yes"
          cancel-text="No"
          @confirm="handleDelete(record)"
        >
          <a-button
            v-permission="'Delete'"
            type="primary"
            danger
            style="margin: 0 0 0 10px"
          >
            删除
          </a-button>
        </a-popconfirm>
      </template>
      <span v-else>{{
        record[column?.key]?.name ||
        record[column?.key]?.username ||
        record[column?.key]
      }}</span>
    </template>
  </a-table>
  <!-- 表单 -->
  <CommonPageForm
    v-model:visible="visible"
    v-model:FormValue="formValue"
    :modalWidth="modalWidth"
    :fields="fields"
    @submit="handleSubmit"
  ></CommonPageForm>
  <!-- 导入 -->
  <CommonPageImport
    v-model:visible="incVisible"
    v-model:fileList="fileList"
    :columns="incHeader"
    :dataSource="incData"
    @confirmUpload="handleConfirmUpload"
  ></CommonPageImport>
</template>
<script>
import { defineComponent, reactive, ref } from "vue";
import * as antdIcon from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import * as xlsx from "xlsx";
import { debounce } from "lodash";
import CommonPageImport from "./CommonPageImport.vue";
import CommonPageForm from "./CommonPageForm.vue";
import * as base from "@/apis/base";
import { Mixins } from "@/mixins";
export default defineComponent({
  components: { ...antdIcon, CommonPageForm, CommonPageImport },
  props: {},
  async setup(props, ctx) {
    let {
      pagination,
      loading,
      tables,
      incHeader,
      tableColums,
      companyId,
      className,
      fields,
      modalWidth,
    } = Mixins();
    const formValue = reactive(new Object());
    const visible = ref(false);

    /* 加载数据 */
    const tableData = ref(new Array());
    const loadData = async (params) => {
      const result = await base.findAll(params);
      if (result?.code == 200) {
        tableData.value = result?.data.list || new Array();
        pagination.total = result?.data.count || 0;
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
      row ? updateData(row) : insetData(row);
      visible.value = true;
    };

    /* 处理数据修改 */
    const updateData = (row) => {
      Object.keys(row).map((key) => {
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
      });
    };

    /* 处理新建数据 */
    const insetData = (row) => {
      Object.keys(fields).forEach((key) => {
        formValue[key] = fields[key].default || "";
        if (fields[key].targetClass == "_User" && fields[key].isOneself) {
          formValue[key] = JSON.parse(
            sessionStorage.getItem("userInfo")
          ).userid;
        }
        if (fields[key].editComponent === "Upload") {
          formValue[key] = [];
        }
      });
      formValue["objectId"] = undefined;
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
    const fileList = ref(new Array());
    const showIncModal = () => {
      incVisible.value = true;
    };
    const incData = ref(new Array());
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

    /* 表单提交 */
    const handleSubmit = async (params) => {
      try {
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
          description: errorInfo.msg || errorInfo || "缺少必填项",
        });
      }
    };

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

    await loadData(pagination);

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
      fileList,
      incVisible,
      incData,
      incHeader,
      loading,
      showModal,
      loadData,
      handleDelete,
      exportTemplate,
      showIncModal,
      handleConfirmUpload,
      exportData,
    };
  },
});
</script>
