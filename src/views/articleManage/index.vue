<template>
  <a-form :model="pagination">
    <a-row>
      <a-col :span="8">
        <a-form-item label="名称">
          <a-input v-model:value="pagination.name" placeholder="请输入名称" />
        </a-form-item>
      </a-col>

      <a-col :span="8" :offset="1"> </a-col>
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
      <a-col :span="2" :offset="2">
        <a-button type="primary">新建</a-button>
      </a-col>
    </a-row>
  </a-form>
  <a-table
    :pagination="pagination"
    :columns="tableColums"
    :data-source="tableData"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'isDelete'">
        <span v-if="record.isDelete">是</span>
        <span v-else>否</span>
      </template>

      <template v-else-if="column.key === 'operation'">
        <a-button type="primary">编辑</a-button>
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
</template>
<script>
import { computed, defineComponent, onMounted, reactive, ref } from "vue";
import { notification } from "ant-design-vue";
import { useRoute } from "vue-router";
import * as base from "@/apis/base";
export default defineComponent({
  components: {},

  setup() {
    const route = useRoute();
    const {
      meta: { companyId, className, columns },
    } = route;

    /* 表头 */
    let tableColums = computed(() => {
      let c = columns.map((field) => {
        return {
          key: field,
          dataIndex: field,
          title: field,
        };
      });
      c.push({
        title: "操作",
        key: "operation",
        fixed: "right",
        width: 200,
      });

      return c;
    });

    /* 分页器配置 */
    let pagination = reactive({
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
        loadModule({ pageNum: num, pageSize: size });
      },
      name: "",
    });

    /* 加载数据 */
    let tableData = ref([]);
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

    onMounted(() => {
      loadData(pagination);
    });
    return {
      tableData,
      tableColums,
      pagination,
      loadData,
      handleDelete,
    };
  },
});
</script>
