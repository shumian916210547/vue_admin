<template>
  <a-layout>
    <a-layout-sider>
      <a-row style="display: flex; align-items: center; padding: 10px 0">
        <a-col :span="8">Schema</a-col>
        <a-col :span="8" offset="2">
          <a-button
            type="primary"
            @click="
              () => {
                schemaVisible = true;
              }
            "
            >create class
          </a-button>
        </a-col>
      </a-row>
      <a-menu v-model:selectedKeys="current" mode="inline">
        <a-menu-item
          v-for="schema in schemas"
          :key="schema.objectId"
          @click="handleClick(schema)"
        >
          {{ schema.name }}
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout-content style="display: flex; flex-direction: column">
      <a-row style="padding: 10px 0">
        <a-col span="6"></a-col>
        <a-col span="6"></a-col>
        <a-col span="6"></a-col>
        <a-col span="4" offset="2">
          <a-button type="primary" @click="showModal('add')">添加字段</a-button>
        </a-col>
      </a-row>

      <div style="display: flex; flex-wrap: wrap; overflow-y: scroll; flex: 1">
        <template v-for="field in fields" :key="field.name">
          <a-card
            style="width: 300px; height: min-content; margin-bottom: 10px"
          >
            <a-descriptions :title="field.chineseName" bordered>
              <template #extra>
                <a-button type="primary" @click="showModal('edit', field)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定删除此字段"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="handleDelete(field)"
                >
                  <a-button type="primary" danger style="margin: 0 0 0 10px">
                    删除
                  </a-button>
                </a-popconfirm>
              </template>
              <a-descriptions-item label="字段名称" :span="3">
                {{ field.name }}
              </a-descriptions-item>
              <a-descriptions-item label="中文名称" :span="3">
                {{ field.chineseName }}
              </a-descriptions-item>
              <a-descriptions-item label="是否必填" :span="3">
                {{ field.required }}
              </a-descriptions-item>
              <a-descriptions-item label="字段类型" :span="3">
                {{ field.type }}
              </a-descriptions-item>
              <a-descriptions-item label="编辑组件" :span="3">
                {{ field.editComponent }}
              </a-descriptions-item>
              <a-descriptions-item
                v-if="field.editComponent == 'a-select'"
                label="组件数据源"
                :span="3"
              >
                {{ field.dataSource }}
              </a-descriptions-item>
              <a-descriptions-item label="默认值" :span="3">
                {{ field.defaultValue }}
              </a-descriptions-item>
              <a-descriptions-item
                label="指向表名"
                v-if="field.type == 'Pointer'"
                :span="3"
              >
                {{ field.targetClass }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </template>
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
        <a-input v-model:value="schemaState.name" />
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
          :disabled="modalType == 'edit'"
        />
      </a-form-item>
      <a-form-item
        label="中文名称"
        name="chineseName"
        :rules="[{ required: true, message: 'Please input your 中文名称!' }]"
      >
        <a-input v-model:value="fieldState.chineseName" />
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
          :options="[
            {
              label: 'String',
              value: 'String',
            },
            {
              label: 'Number',
              value: 'Number',
            },
            {
              label: 'Object',
              value: 'Object',
            },
            {
              label: 'Array',
              value: 'Array',
            },
            {
              label: 'Pointer',
              value: 'Pointer',
            },
            {
              label: 'Boolean',
              value: 'Boolean',
            },
            {
              label: 'Date',
              value: 'Date',
            },
          ]"
        ></a-select>
      </a-form-item>
      <a-form-item label="字段默认值" name="defaultValue">
        <a-input
          v-model:value="fieldState.defaultValue"
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
        ></a-select>
      </a-form-item>
      <a-form-item
        v-if="fieldState.editComponent == 'a-select'"
        label="数据源"
        name="type"
        :rules="[{ required: true, message: 'Please select your 数据源!' }]"
      >
        <a-select
          v-model:value="fieldState.dataSource"
          style="width: 100%"
          placeholder="请选择数据源"
          :options="dataOrigin"
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
        ></a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script>
import {
  defineComponent,
  onMounted,
  reactive,
  ref,
  computed,
  onUpdated,
} from "vue";
import { useRoute } from "vue-router";
import * as base from "@/apis/base";
import { notification } from "ant-design-vue";
import { insertSchema, updateById, removeFields } from "@/apis/schema";
import { updateOption } from "@/apis/devRoute";
import { useStore } from "vuex";
export default defineComponent({
  setup() {
    const store = useStore();
    const current = ref([]);
    const schemaForm = ref();
    const fieldForm = ref();
    const route = useRoute();
    const modalType = ref("");
    const fieldState = reactive({});
    const { meta } = route;
    const schemas = ref([]);
    const schemaVisible = ref(false);
    const fieldVisible = ref(false);
    const schemaState = reactive({
      chineseName: "",
      defaultValue: undefined,
      editComponent: "",
      name: "",
      required: false,
      type: "",
    });
    const loadSchema = async ({ className, companyId }) => {
      const { code, data } = await base.findList({ className, companyId });
      if (code == 200) {
        schemas.value = data;
        if (!current.value.length) {
          current.value = [data[0]["objectId"]];
        }

        handleClick(
          data.filter((item) => {
            return item.objectId == current.value[0];
          })[0]
        );
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
        }
        loadSchema(meta);
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
            })
          : field;
      });
    };
    const showModal = (t, record) => {
      if (t == "edit") {
        fieldState["editComponent"] = record["editComponent"] || undefined;
        Object.keys(record).forEach((key) => {
          fieldState[key] = record[key];
        });
      }
      if (t == "add") {
        Object.keys(fieldState).forEach((key) => {
          fieldState[key] = undefined;
          fieldState["required"] = false;
        });
      }
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
          }).then((res) => {
            console.log(res);
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
    onMounted(() => {
      loadSchema(meta);
    });

    onUpdated(() => {
      store.dispatch("UpdateStore");
    });
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
      schemaSubmit,
      fieldSubmit,
      handleClick,
      showModal,
      handleDelete,
    };
  },
});
</script>

<style lang="scss" scoped>
.ant-layout-sider {
  background: white;
}
</style>
