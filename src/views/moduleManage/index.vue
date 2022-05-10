<template>
  <a-form :model="filterForm">
    <a-row>
      <a-col :span="8">
        <a-form-item label="模块名称">
          <a-input
            v-model:value="filterForm.name"
            placeholder="请输入模块名称"
          />
        </a-form-item>
      </a-col>

      <a-col :span="8" :offset="1">
        <a-form-item label="是否删除">
          <a-select v-model:value="filterForm.isDelete">
            <a-select-option :value="true"> 是 </a-select-option>
            <a-select-option :value="false"> 否 </a-select-option>
            <a-select-option value="all"> 全部 </a-select-option>
          </a-select>
        </a-form-item>
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
  <a-modal v-model:visible="visible" @ok="handleOk">
    <a-form :model="formValue" :key="formValue.objectId">
      <a-form-item label="模块名称">
        <a-input v-model:value="formValue.name" placeholder="请输入模块名称" />
      </a-form-item>
    </a-form>

    <template #title>
      <span>{{ formValue.objectId != undefined ? "修改" : "新增" }}</span>
    </template>
  </a-modal>
</template>

<script>
import { defineComponent, onMounted, reactive, ref } from "vue";
import { SmileOutlined, DownOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import { findAll, removeById } from "@/apis/devModule";
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

export default defineComponent({
  components: {
    SmileOutlined,
    DownOutlined,
  },
  setup() {
    const visible = ref(false);

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
        formValue[key] = params[key];
      });
    };

    const handleOk = (e) => {
      console.log(e);
      visible.value = false;
    };

    /* 筛选数据表单 */
    let filterForm = reactive({
      name: "",
      isDelete: "all",
    });

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

    /* 生命周期， 页面挂在后 */
    onMounted(() => {
      loadModule(pagination);
    });

    return {
      filterForm,
      formValue,
      pagination,
      tableData,
      columns,
      visible,
      showModal,
      handleOk,
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
