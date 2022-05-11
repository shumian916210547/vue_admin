<template>
  <a-form :model="filterForm">
    <a-row>
      <a-col :span="8">
        <a-form-item label="路由名称">
          <a-input
            v-model:value="filterForm.name"
            placeholder="请输入路由名称"
          />
        </a-form-item>
      </a-col>

      <a-col :span="8" :offset="1">
        <!-- <a-form-item label="是否删除">
          <a-select v-model:value="filterForm.isDelete">
            <a-select-option :value="true"> 是 </a-select-option>
            <a-select-option :value="false"> 否 </a-select-option>
            <a-select-option value="all"> 全部 </a-select-option>
          </a-select>
        </a-form-item> -->
      </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-button type="primary">查询</a-button>
        <a-button>重置</a-button>
      </a-col>
      <a-col :span="2" :offset="2">
        <a-button type="primary" @click="showModal()">新建</a-button>
      </a-col>
    </a-row>
  </a-form>

  <a-table
    :pagination="pagination"
    :columns="columns"
    :data-source="tableData"
    style="flex: 1"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'name'">
        <span>{{ record.name }}</span>
      </template>

      <template v-else-if="column.key === 'isDelete'">
        <span v-if="record.isDelete">是</span>
        <span v-else>否</span>
      </template>

      <template v-else-if="column.key === 'operation'">
        <a-button type="primary" @click="showModal(record)">编辑</a-button>
        <a-popconfirm
          title="确定删除此路由"
          ok-text="Yes"
          cancel-text="No"
          @confirm="confirmDelete(record)"
        >
          <a-button type="primary" danger style="margin: 0 0 0 10px">
            删除
          </a-button>
        </a-popconfirm>
      </template>
    </template>
  </a-table>

  <!-- 表单 -->
  <a-modal v-model:visible="visible" @ok="handleSubmit">
    <a-form
      ref="formRef"
      :rules="rules"
      :model="formValue"
      :key="formValue.objectId"
    >
      <a-form-item label="路由名称" name="name">
        <a-input v-model:value="formValue.name" placeholder="请输入路由名称" />
      </a-form-item>

      <a-form-item label="路由路径" name="path">
        <a-input v-model:value="formValue.path" placeholder="请输入路由路径" />
      </a-form-item>

      <a-form-item label="页面路径" name="pagePath">
        <a-input
          v-model:value="formValue.pagePath"
          placeholder="请输入页面路径"
        />
      </a-form-item>
    </a-form>

    <template #title>
      <span>{{ formValue.objectId != undefined ? "修改" : "新增" }}</span>
    </template>
  </a-modal>
</template>

<script>
import { defineComponent, onMounted, reactive, ref } from "vue";
import { debounce } from "lodash";
import { SmileOutlined, DownOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import {
  findAll,
  removeById,
  insertDevRoute,
  updateById,
} from "@/apis/devRoute";

/* 表头 */
const columns = [
  {
    title: "路由名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "路由路径",
    dataIndex: "path",
    key: "path",
  },
  {
    title: "页面路径",
    dataIndex: "pagePath",
    key: "pagePath",
  },
  {
    title: "是否删除",
    dataIndex: "isDelete",
    key: "isDelete",
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
  },
  {
    title: "操作",
    key: "operation",
    fixed: "right",
    width: 200,
  },
];

/* 表单验证 */
const rules = {
  name: [
    {
      required: true,
      trigger: "change",
      message: "请输入路由名称",
    },
  ],
  path: [
    {
      required: true,
      trigger: "change",
      message: "请输入路由路径",
    },
  ],
  pagePath: [
    {
      required: true,
      trigger: "change",
      message: "请输入页面路径",
    },
  ],
};

export default defineComponent({
  components: {
    SmileOutlined,
    DownOutlined,
  },
  setup() {
    const visible = ref(false);

    /* 表单 */
    let formRef = ref();

    /* 添加/修改数据表单 */
    let formValue = reactive({
      path: "",
      name: "",
      objectId: undefined,
      pagePath: "",
    });

    const showModal = (
      params = { path: "", name: "", objectId: undefined, pagePath: "" }
    ) => {
      visible.value = true;
      Object.keys(params).forEach((key) => {
        formValue[key] = params[key];
      });
    };

    /* 表单提交 */
    const handleSubmit = debounce(async (e) => {
      try {
        await formRef.value.validateFields();
        visible.value = false;
        const { code, msg, data } = await submitForm(formValue);
        if (code == 200) {
          notification["success"]({
            message: "提醒",
            description: msg,
          });
        } else {
          throw {
            msg,
          };
        }
        loadRoute(pagination);
      } catch (errorInfo) {
        notification["error"]({
          message: "提醒",
          description: errorInfo.msg || "缺少必填项",
        });
      }
    }, 100);

    /* 修改/新增 */
    const submitForm = (params) => {
      return new Promise((resolve, reject) => {
        switch (params.objectId != undefined) {
          case true:
            updateById(params).then((result) => {
              resolve(result);
            });
            break;
          case false:
            insertDevRoute(params).then((result) => {
              resolve(result);
            });
            break;
        }
      });
    };

    /* 筛选数据表单 */
    let filterForm = reactive({
      name: "",
      isDelete: "all",
    });

    /* 删除路由 */
    const confirmDelete = async ({ objectId }) => {
      const { msg, code, data } = await removeById({ objectId });
      if (code == 200) {
        notification["success"]({
          message: "删除提醒",
          description: "路由" + data.name + "删除成功",
        });
        loadRoute(pagination);
      }
    };

    /* 分页器配置 */
    let pagination = reactive({
      position: ["bottomRight"],
      pageSize: 10,
      pageNum: 1,
      showSizeChanger: true,
      total: 0,
      showTotal: (total) => `Total ${total} items`,
      pageSizeOptions: ["10", "20", "50", "100"],
      onChange: (num, size) => {
        pagination.pageNum = num;
        pagination.pageSize = size;
        loadRoute({ pageNum: num, pageSize: size });
      },
    });

    /* 表格数据 */
    let tableData = ref([]);

    /* 加载数据 */
    const loadRoute = async (params) => {
      try {
        const { code, data } = await findAll(params);
        if (code == 200) {
          tableData.value = data?.list;
          pagination.total = data.count;
        }
      } catch (error) {
        console.log(error);
      }
    };

    /* 生命周期， 页面挂在后 */
    onMounted(() => {
      loadRoute(pagination);
    });

    return {
      filterForm,
      formValue,
      formRef,
      pagination,
      tableData,
      columns,
      visible,
      rules,
      showModal,
      handleSubmit,
      confirmDelete,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.ant-spin-container),
:deep(.ant-spin-nested-loading) {
  height: 100%;
}
</style>
