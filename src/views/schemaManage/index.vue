<template>
  <a-layout>
    <a-layout-sider>
      <a-row style="display: flex; align-items: center; padding: 10px 0">
        <a-col :span="8">Schema</a-col>
        <a-col :span="8" offset="1">
          <a-button
            type="primary"
            @click="
              () => {
                schemaVisible = true;
              }
            "
            >Create Schema
          </a-button>
        </a-col>
      </a-row>
      <a-menu
        v-model:selectedKeys="current"
        mode="inline"
        style="flex: 1; overflow-y: scroll; overflow-x: hidden"
      >
        <template v-if="schemas.length">
          <a-menu-item
            v-for="schema in schemas"
            :key="schema.objectId"
            @click="handleClick(schema)"
          >
            <a-tag color="green">{{ schema.name }}</a-tag>
            <a-tag color="orange">{{
              Object.keys(schema.fields)?.length
            }}</a-tag>
          </a-menu-item>
        </template>
        <template v-else>
          <a-empty :image="simpleImage" />
        </template>
      </a-menu>
    </a-layout-sider>
    <a-layout-content style="display: flex; flex-direction: column">
      <a-row style="padding: 10px 0">
        <a-col span="6"></a-col>
        <a-col span="6"></a-col>
        <a-col span="6"></a-col>
        <a-col span="4" offset="2">
          <a-button
            type="primary"
            @click="showModal('add')"
            v-if="current.length"
            >添加字段</a-button
          >
        </a-col>
      </a-row>

      <div class="fieldContent">
        <a-table
          :pagination="false"
          sticky
          :dataSource="fields"
          :columns="columns"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'operation'">
              <a-button type="primary" @click="showModal('edit', record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除此字段"
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
      </div>
    </a-layout-content>
  </a-layout>

  <!-- 新建Schema modal -->
  <a-modal
    v-model:visible="schemaVisible"
    title="新建Schema"
    @ok="schemaSubmit()"
  >
    <a-form :model="schemaState" ref="schemaForm" autocomplete="off">
      <a-form-item
        label="schema名称"
        name="name"
        :rules="[{ required: true, message: 'Please input your schema名称!' }]"
      >
        <a-input placeholder="请输入表名" v-model:value="schemaState.name" />
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 编辑/新建字段 -->
  <a-modal
    v-model:visible="fieldVisible"
    :title="modalType == 'add' ? '新建字段' : '修改字段'"
    @ok="fieldSubmit()"
  >
    <a-form :model="fieldState" ref="fieldForm" autocomplete="off">
      <a-form-item
        label="字段名称"
        name="name"
        :rules="[{ required: true, message: 'Please input your 字段名称!' }]"
      >
        <a-input
          v-model:value="fieldState.name"
          placeholder="请输入字段名称"
          :disabled="modalType == 'edit'"
        />
      </a-form-item>
      <a-form-item
        label="中文名称"
        name="chineseName"
        :rules="[{ required: true, message: 'Please input your 中文名称!' }]"
      >
        <a-input
          placeholder="请输入字段中文名称"
          v-model:value="fieldState.chineseName"
        />
      </a-form-item>
      <a-form-item
        label="是否必填"
        name="required"
        :rules="[{ required: true, message: 'Please select your 是否必填!' }]"
      >
        <a-switch
          v-model:checked="fieldState.required"
          :disabled="modalType == 'edit'"
        />
      </a-form-item>
      <a-form-item
        label="字段类型"
        name="type"
        :rules="[{ required: true, message: 'Please select your 字段类型!' }]"
      >
        <a-select
          v-model:value="fieldState.type"
          style="width: 100%"
          placeholder="请选择字段类型"
          :disabled="modalType == 'edit'"
          show-search
          allowClear
          :options="fieldTypes"
        ></a-select>
      </a-form-item>
      <a-form-item label="字段默认值" name="defaultValue">
        <a-input
          v-model:value="fieldState.defaultValue"
          placeholder="请输入字段默认值"
          :disabled="modalType == 'edit'"
        />
      </a-form-item>
      <a-form-item
        label="编辑组件"
        name="editComponent"
        :rules="[
          { required: false, message: 'Please select your 字段编辑组件!' },
        ]"
      >
        <a-select
          v-model:value="fieldState.editComponent"
          style="width: 100%"
          placeholder="请选择字段编辑组件"
          :options="antdComponents"
          show-search
          allowClear
        ></a-select>
      </a-form-item>
      <a-form-item
        v-if="fieldState.editComponent == 'Select'"
        label="数据源"
        name="type"
        :rules="[{ required: true, message: 'Please select your 数据源!' }]"
      >
        <a-select
          v-model:value="fieldState.dataSource"
          style="width: 100%"
          placeholder="请选择数据源"
          :options="dataOrigin"
          show-search
          allowClear
        ></a-select>
      </a-form-item>
      <a-form-item
        v-if="fieldState.type == 'Pointer'"
        label="指向表名"
        name="type"
        :rules="[{ required: true, message: 'Please select your 指向表名!' }]"
      >
        <a-select
          :disabled="modalType == 'edit'"
          v-model:value="fieldState.targetClass"
          style="width: 100%"
          placeholder="请选择指向表名"
          :options="schemaOptions"
          show-search
          allowClear
        ></a-select>
      </a-form-item>

      <a-form-item
        v-if="fieldState.targetClass === '_User'"
        label="仅自己"
        name="type"
      >
        <a-switch
          v-model:checked="fieldState.isOneself"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script>
import { defineComponent, reactive, ref, computed, onUpdated } from "vue";
import { useRoute } from "vue-router";
import * as base from "@/apis/base";
import { notification, Empty } from "ant-design-vue";
import { insertSchema, updateById, removeFields } from "@/apis/schema";
import { updateOption } from "@/apis/devRoute";
import { useStore } from "vuex";
const columns = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "中文名称",
    dataIndex: "chineseName",
    key: "chineseName",
    ellipsis: true,
  },
  {
    title: "是否必填",
    dataIndex: "required",
    key: "required",
    ellipsis: true,
  },
  {
    title: "字段类型",
    dataIndex: "type",
    key: "type",
    ellipsis: true,
  },
  {
    title: "编辑组件",
    dataIndex: "editComponent",
    key: "editComponent",
    ellipsis: true,
  },
  {
    title: "组件数据源",
    dataIndex: "dataSource",
    key: "dataSource",
    ellipsis: true,
  },
  {
    title: "默认值",
    dataIndex: "defaultValue",
    key: "defaultValue",
    ellipsis: true,
  },
  {
    title: "指向表名",
    dataIndex: "targetClass",
    key: "targetClass",
    ellipsis: true,
  },
  {
    title: "操作",
    dataIndex: "operation",
    width: 180,
  },
];
export default defineComponent({
  async setup() {
    const store = useStore();
    const current = ref(new Array());
    const schemaForm = ref();
    const fieldForm = ref();
    const route = useRoute();
    const modalType = ref("");
    const fieldState = reactive({
      chineseName: "",
      defaultValue: undefined,
      editComponent: "",
      name: "",
      required: false,
      type: "",
    });
    const { meta } = route;
    const schemas = ref(new Array());
    const schemaVisible = ref(false);
    const fieldVisible = ref(false);
    const schemaState = reactive({
      name: "",
    });

    const loadSchema = async ({ className, companyId }) => {
      const { code, data } = await base.findList({ className, companyId });
      if (code == 200) {
        schemas.value = data;
        if (!current.value.length) {
          current.value = data.length ? [data[0]["objectId"]] : [];
        }
        if (data.length) {
          handleClick(
            data.filter((item) => {
              return item.objectId == current.value[0];
            })[0]
          );
        }
      }
    };
    const schemaSubmit = async () => {
      try {
        const result = await schemaForm.value.validateFields();
        const { code, data, msg } = await insertSchema(result);
        if (code == 200) {
          notification["success"]({
            message: "提醒",
            description: msg,
          });
          current.value = [data.objectId];
        }
        loadSchema(meta);
        schemaState["name"] = undefined;
        schemaVisible.value = false;
      } catch (errorInfo) {
        notification["error"]({
          message: "提醒",
          description: errorInfo.msg || "缺少必填项",
        });
      }
    };
    const fields = ref([]);
    const handleClick = async (record) => {
      if (!record || !record.fields) {
        return;
      }
      fields.value = Object.keys(record.fields).map((key) => {
        let field = {
          name: key,
          type: record.fields[key]["type"],
          defaultValue: record.fields[key]["default"],
          required: record.fields[key]["required"],
          chineseName: record.fields[key]["chineseName"],
          editComponent: record.fields[key]["editComponent"],
          dataSource: record.fields[key]["dataSource"],
        };
        return record.fields[key]["type"] == "Pointer"
          ? Object.assign({}, field, {
              targetClass: record.fields[key]["targetClass"],
              isOneself:
                record.fields[key]["targetClass"] === "_User"
                  ? record.fields[key]["isOneself"]
                  : false,
            })
          : field;
      });
    };

    /* modal弹窗类型 */
    const modalOption = {
      edit: (record) => {
        fieldState["editComponent"] = record["editComponent"] || undefined;
        Object.keys(fieldState).forEach((key) => {
          fieldState[key] = undefined;
        });
        Object.keys(record).forEach((key) => {
          fieldState[key] = record[key];
        });
      },
      add: (record) => {
        Object.keys(fieldState).forEach((key) => {
          fieldState[key] = undefined;
          fieldState["required"] = false;
        });
      },
    };
    const showModal = (t, record) => {
      modalOption[t](record);
      modalType.value = t;
      fieldVisible.value = true;
    };
    const antdComponents = computed(() => {
      return store.getters["GETANTDCOMPONENTS"];
    });
    const dataOrigin = computed(() => {
      return Object.keys(store.getters).map((key) => {
        let value, label;
        value = label = key;
        return {
          value,
          label,
        };
      });
    });
    const schemaOptions = computed(() => {
      return store.getters["GETSCHEMA"];
    });
    const fieldSubmit = async () => {
      try {
        const result = await fieldForm.value.validateFields();
        const { code, data, msg } = await updateById(
          Object.assign({}, fieldState, { schemaId: current.value[0] })
        );
        if (code == 200) {
          notification["success"]({
            message: "提醒",
            description: msg,
          });

          updateOption({
            className: schemas.value.filter((item) => {
              return item.objectId == current.value[0];
            })?.[0].name,
            fieldState,
          });
        }
        loadSchema(meta);
        fieldVisible.value = false;
      } catch (errorInfo) {
        notification["error"]({
          message: "提醒",
          description: errorInfo.msg || "缺少必填项",
        });
      }
    };
    const handleDelete = async (field) => {
      const fieldsName = field.name;
      const schemaId = current.value[0];
      const { code, msg } = await removeFields({ fieldsName, schemaId });
      if (code == 200) {
        notification["success"]({
          message: "提醒",
          description: msg,
        });
        loadSchema(meta);
      }
    };

    /* 字段类型列表获取 */
    const fieldTypes = ref([]);
    const getFieldTypes = async () => {
      const result = await base.findList({
        className: "FieldType",
        name: "",
      });
      if (result.code == 200) {
        fieldTypes.value = [
          ...result.data.map((item) => {
            return {
              label: item.name,
              value: item.name,
            };
          }),
        ];
      }
    };

    onUpdated(() => {
      store.dispatch("UpdateStore");
    });

    await loadSchema(meta);
    await getFieldTypes();
    return {
      current,
      schemas,
      schemaVisible,
      fieldVisible,
      schemaState,
      schemaForm,
      fieldForm,
      fields,
      fieldState,
      modalType,
      schemaOptions,
      dataOrigin,
      antdComponents,
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      fieldTypes,
      schemaSubmit,
      fieldSubmit,
      handleClick,
      showModal,
      handleDelete,
      columns,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
}

:deep(.ant-menu-inline::-webkit-scrollbar) {
  width: 0 !important;
}

.fieldContent {
  overflow-y: scroll;
}

.fieldContent::-webkit-scrollbar {
  width: 0 !important;
}

.ant-layout-sider {
  background: white;
  width: 220px !important;
  flex: 0 0 220px !important;
  max-width: none !important;
  min-width: none !important;
}
</style>
