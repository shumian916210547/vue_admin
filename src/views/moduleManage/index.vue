<template>
  <a-form :model="pagination">
    <a-row>
      <a-col :span="8">
        <a-form-item label="模块名称">
          <a-input
            v-model:value="pagination.name"
            placeholder="请输入模块名称"
          />
        </a-form-item>
      </a-col>

      <a-col :span="8" :offset="1"> </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-button type="primary" @click="loadModule(pagination)">查询</a-button>
        <a-button
          @click="
            () => {
              pagination.name = '';
            }
          "
          >重置</a-button
        >
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
        <a-button
          type="primary"
          @click="
            showModal({
              objectId: record.objectId,
              name: record.name,
              router: record.router,
            })
          "
          >编辑</a-button
        >
        <a-popconfirm
          title="确定删除此模块"
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
      <a-form-item label="模块名称" name="name">
        <a-input v-model:value="formValue.name" placeholder="请输入模块名称" />
      </a-form-item>

      <a-form-item label="模块路由" name="router">
        <a-select
          v-model:value="formValue.router"
          mode="multiple"
          style="width: 100%"
          placeholder="请选择模块路由"
          :options="routes"
        ></a-select>
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
  insertDevModule,
  updateById,
} from "@/apis/devModule";
import { findList } from "@/apis/devRoute";
const columns = [
  {
    title: "模块名称",
    dataIndex: "name",
    key: "name",
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
      message: "请输入模块名称",
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

    const formRef = ref();

    /* 添加/修改数据表单 */
    let formValue = reactive({
      router: [],
      name: "",
      objectId: undefined,
    });

    const showModal = (
      params = { router: [], name: "", objectId: undefined }
    ) => {
      visible.value = true;
      Object.keys(params).forEach((key) => {
        if (key == "router") {
          formValue[key] = params[key].map((route) => {
            return route.objectId;
          });
        } else {
          formValue[key] = params[key];
        }
      });
    };

    /* 表单提交 */
    const handleSubmit = debounce(async (e) => {
      try {
        await formRef.value.validateFields();
        visible.value = false;
        console.log(formValue);
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
        loadModule(pagination);
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
            insertDevModule(params).then((result) => {
              resolve(result);
            });
            break;
        }
      });
    };

    /* 删除模块 */
    const confirmDelete = async ({ objectId }) => {
      const { msg, code, data } = await removeById({ objectId });
      if (code == 200) {
        notification["success"]({
          message: "删除提醒",
          description: "模块" + data.name + "删除成功",
        });
        loadModule(pagination);
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
        loadModule({ pageNum: num, pageSize: size });
      },
    });

    /* 表格数据 */
    let tableData = ref([]);

    /* 加载数据 */
    const loadModule = async (params) => {
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

    /* 加载路由下拉选择列表 */
    let routes = ref([]);
    const loadSelectOption = async () => {
      const { code, data } = await findList();
      if (code == 200) {
        routes.value = data;
      }
    };

    /* 生命周期， 页面挂在后 */
    onMounted(() => {
      loadModule(pagination);
      loadSelectOption();
    });

    return {
      formValue,
      pagination,
      tableData,
      columns,
      visible,
      routes,
      formRef,
      rules,
      showModal,
      handleSubmit,
      loadModule,
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
