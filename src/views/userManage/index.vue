<template>
  <a-form :model="pagination">
    <a-row>
      <a-col :span="8">
        <a-form-item label="名称" v-openSwitch="'Search'">
          <a-input v-model:value="pagination.name" placeholder="请输入名称" />
        </a-form-item>
      </a-col>

      <a-col :span="5" :offset="1"> </a-col>
      <a-col
        :span="2"
        :offset="1"
        style="justify-content: space-evenly; display: flex"
      >
        <a-form-item v-openSwitch="'Search'">
          <a-button
            v-openSwitch="'Search'"
            type="primary"
            @click="loadData(pagination)"
            >查询</a-button
          >
        </a-form-item>

        <a-form-item v-openSwitch="'Search'">
          <a-button
            v-openSwitch="'Search'"
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
          <a-button v-openSwitch="'Insert'" type="primary" @click="showModal()"
            >新建</a-button
          >
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
  <a-table
    :pagination="pagination"
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
          v-openSwitch="'Edit'"
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
            v-openSwitch="'Delete'"
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
  <a-modal
    v-model:visible="visible"
    :width="modalWidth"
    @cancel="onCancel()"
    @ok="handleSubmit()"
  >
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
            v-if="fields[item].editComponent == 'Switch'"
            v-model:checked="formValue[item]"
            :is="antd[fields[item].editComponent]"
            :placeholder="'Please input your' + fields[item].chineseName"
          />
          <component
            v-else-if="fields[item].editComponent == 'TimePicker'"
            v-model:value="formValue[item]"
            :is="antd[fields[item].editComponent]"
            :placeholder="'Please input your' + fields[item].chineseName"
            value-format="HH:mm:ss"
            style="width: 100%"
          />
          <component
            :is="antd[fields[item].editComponent]"
            v-else-if="fields[item].editComponent == 'DatePicker'"
            v-model:value="formValue[item]"
            :placeholder="'Please input your' + fields[item].chineseName"
            value-format="YYYY/MM/DD"
            style="width: 100%"
          />
          <component
            :is="antd[fields[item].editComponent]"
            v-else
            v-model:value="formValue[item]"
            :options="getSelectOptions(fields[item].dataSource)"
            :placeholder="'Please input your' + fields[item].chineseName"
            :field-names="{ label: 'name', value: 'objectId' }"
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
} from "vue";
import { InboxOutlined } from "@ant-design/icons-vue";
import * as antdComponent from "ant-design-vue";
import { debounce } from "lodash";
import { notification } from "ant-design-vue";
import * as base from "@/apis/base";
import * as user from "@/apis/user";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
let list = [];
export default defineComponent({
  directives: {
    openSwitch: {
      mounted(el, binding, vnode) {
        const { value } = binding;
        let f = list?.some((p) => {
          return p.key == value;
        });
        if (!f) {
          el.parentNode && el.parentNode.removeChild(el);
        }
      },
    },
  },
  components: {
    InboxOutlined,
  },
  props: {},

  setup(props, ctx) {
    const route = useRoute();
    const store = useStore();
    let { meta } = route;
    let { companyId, className, columns, fields, modalWidth, switchs } = meta;
    list = switchs;
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

    const onCancel = () => {
      for (const k of Object.keys(formValue)) {
        formValue[k] = undefined;
      }
      visible.value = false;
    };
    let once = ref(true);
    let onceKey = ref([]);
    const getSelectOptions = (key) => {
      if (once.value) {
        if (!onceKey.value.includes(key)) {
          if (key) {
            onceKey.value.push(key);
            store.dispatch("S" + key.slice(1));
          }
        } else {
          once.value = false;
        }
      }
      return store.getters[key];
    };

    const formRef = ref();

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
          ({ code, msg } = await user.signUp({
            companyId,
            ...params,
          }));
        }
        if (code == 200) {
          notification["success"]({
            message: "提醒",
            description: msg,
          });
          loadData(pagination);
          visible.value = false;
        } else {
          notification["error"]({
            message: "提醒",
            description: msg,
          });
        }
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
      onCancel,
    };
  },
});
</script>
