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
        <a-button type="primary" @click="showModal()">新建</a-button>
      </a-col>
    </a-row>
  </a-form>
  <a-table
    :pagination="pagination"
    :columns="tableColums"
    :data-source="tableData"
  >
    <template #bodyCell="{ column, record }">
      <span>{{ record[column.key]?.name || record[column.key] }}</span>
      <template v-if="column.key === 'isDelete'">
        <span v-if="record.isDelete">是</span>
        <span v-else>否</span>
      </template>
      <template v-else-if="column.key === 'operation'">
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
import * as antdComponent from "ant-design-vue";
import { debounce } from "lodash";
import { notification } from "ant-design-vue";
import richText from "./richText.vue";
import * as base from "@/apis/base";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
export default defineComponent({
  components: {
    /* richText */
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
    watch(
      tables,
      (n, o) => {
        if (n) {
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
    /* 表单提交 */
    const formRef = ref();
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
      showModal,
      loadData,
      handleDelete,
      getSelectOptions,
    };
  },
});
</script>
