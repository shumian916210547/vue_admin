<template>
  <a-form :model="pagination">
    <a-row>
      <a-col :span="8">
        <a-form-item label="名称" v-permission="'Search'">
          <a-input v-model:value="pagination.name" placeholder="请输入名称" />
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
      <span v-else>{{ record[column?.key]?.name || record[column?.key] }}</span>
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
</template>
<script>
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { InboxOutlined } from "@ant-design/icons-vue";
import * as antdComponent from "ant-design-vue";
import CommonPageForm from "@/components/CommonPageForm.vue";
import { notification } from "ant-design-vue";
import * as base from "@/apis/base";
import * as user from "@/apis/user";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { Mixins } from "@/mixins";
export default defineComponent({
  components: {
    InboxOutlined,
    CommonPageForm,
  },
  props: {},

  setup(props, ctx) {
    const route = useRoute();
    const store = useStore();
    let { meta } = route;
    const { pagination, loading } = Mixins();
    let { companyId, className, columns, fields, modalWidth } = meta;
    pagination.companyId = companyId;
    pagination.className = className;
    const formValue = reactive({});
    const visible = ref(false);
    let antd = antdComponent;
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

    /* 加载数据 */
    const tableData = ref([]);
    const loadData = async (params) => {
      const result = await base.findAll(params);
      if (result?.code == 200) {
        tableData.value = result?.data.list || [];
        pagination.total = result?.data.count || 0;
      }
    };
    /* 删除 */
    const handleDelete = async ({ objectId }) => {
      const { msg, code, data } = await user.removeUser({
        objectId,
        up: sessionStorage.getItem("To"),
      });
      if (code == 200) {
        notification["success"]({
          message: "删除提醒",
          description: data.username + "删除成功",
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
      fields,
      modalWidth,
      antd,
      showModal,
      loadData,
      handleDelete,
      loading,
    };
  },
});
</script>
