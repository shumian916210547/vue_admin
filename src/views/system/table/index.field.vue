<template>
  <a-modal
    v-model:visible="visible"
    :title="modalType[props.type]"
    @ok="handleOk"
    width="600px"
  >
    <!-- 字段基础信息 -->
    <a-form
      :model="formState"
      ref="form1"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
    >
      <a-form-item
        label="字段名称"
        name="fieldName"
        :rules="[{ required: true, message: 'Please input your 字段名称!' }]"
      >
        <a-input
          v-model:value="formState.fieldName"
          allowClear
          placeholder="请输入字段名称"
        />
      </a-form-item>

      <a-form-item
        label="字段类型"
        name="fieldType"
        :rules="[
          {
            required: true,
            message: 'Please input your 字段类型!',
            trigger: 'change',
          },
        ]"
      >
        <a-select
          v-model:value="formState.fieldType"
          show-search
          placeholder="情选择字段类型"
          allowClear
          :options="[
            {
              label: 'Boolean',
              value: 'Boolean',
            },
            {
              label: 'String',
              value: 'String',
            },
            {
              label: 'Number',
              value: 'Number',
            },
            {
              label: 'Date',
              value: 'Date',
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
              label: 'GeoPoint',
              value: 'GeoPoint',
            },
            {
              label: 'Polygon',
              value: 'Polygon',
            },
            {
              label: 'File',
              value: 'File',
            },
            {
              label: 'Pointer',
              value: 'Pointer',
            },
            {
              label: 'Relation',
              value: 'Relation',
            },
          ]"
        ></a-select>
      </a-form-item>
    </a-form>

    <!-- 字段配置 -->
    <a-form
      :model="optionState"
      ref="form2"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
    >
      <a-form-item
        label="中文名称"
        name="chineseName"
        :rules="[
          { required: true, message: 'Please input your 中文字段名称!' },
        ]"
      >
        <a-input
          v-model:value="optionState.chineseName"
          allowClear
          placeholder="请输入中文字段名称"
        />
      </a-form-item>

      <a-form-item
        v-if="formState.fieldType == 'Pointer'"
        label="指向表名"
        name="targetClass"
        :rules="[
          {
            required: true,
            message: 'Please input your 指向表名!',
            trigger: 'change',
          },
        ]"
      >
        <a-select
          v-model:value="optionState.targetClass"
          show-search
          placeholder="情选择指向表名"
          allowClear
          :fieldNames="{
            label: 'name',
            value: 'name',
          }"
          :options="schemas"
        ></a-select>
      </a-form-item>

      <a-form-item
        label="字段默认"
        name="defaultValue"
        :rules="[{ required: false, message: 'Please input your 字段默认值!' }]"
      >
        <a-input
          v-model:value="optionState.defaultValue"
          allowClear
          placeholder="请输入字段默认值"
        />
      </a-form-item>

      <a-form-item
        label="字段必填"
        name="required"
        style="min-width: 200px"
        :rules="[
          {
            required: true,
            message: 'Please input your 字段必填',
            trigger: 'change',
          },
        ]"
      >
        <a-switch
          v-model:checked="optionState.required"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>

      <a-form-item
        label="编辑组件"
        name="editComponent"
        :rules="[
          {
            required: false,
            message: 'Please input your 编辑组件!',
            trigger: 'change',
          },
        ]"
      >
        <a-select
          v-model:value="optionState.editComponent"
          show-search
          allowClear
          placeholder="情选择编辑组件!"
          :options="antdComponents"
        ></a-select>
      </a-form-item>
    </a-form>

    <!-- 组件配置 -->
    <a-form
      :model="componentOption"
      ref="form3"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
    >
      <!-- Select 组件配置 -->
      <template v-if="optionState.editComponent == 'ASelect'">

        <!-- 模式 -->
        <a-form-item
          label="模式"
          name="mode"
          :rules="[{ required: false, message: 'Please input your mode' }]"
        >
          <a-radio-group v-model:value="componentOption.mode" size="default">
            <a-radio-button value="multiple">multiple</a-radio-button>
            <a-radio-button value="tags">tags</a-radio-button>
            <a-radio-button value="combobox">combobox</a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- label key -->
        <a-form-item
          label="labelKey"
          name="labelKey"
          :rules="[
            { required: true, message: 'Please input your 请输入labelKey' },
          ]"
        >
          <a-input
            v-model:value="componentOption.labelKey"
            allowClear
            placeholder="请输入labelKey"
          />
        </a-form-item>

        <!-- value key -->
        <a-form-item
          label="valueKey"
          name="valueKey"
          :rules="[
            { required: true, message: 'Please input your 请输入valueKey' },
          ]"
        >
          <a-input
            v-model:value="componentOption.valueKey"
            allowClear
            placeholder="请输入valueKey"
          />
        </a-form-item>

      </template>

      <!-- Select、TreeSelect 组件配置 -->
      <a-form-item
        v-if="
          optionState.editComponent == 'ASelect' ||
          optionState.editComponent == 'ATreeSelect'
        "
        label="数据源"
        name="selectTable"
        :rules="[{ required: false, message: 'Please input your 数据源' }]"
      >
        <a-select
          v-model:value="componentOption.selectTable"
          show-search
          placeholder="情选择数据源"
          allowClear
          :fieldNames="{
            label: 'className',
            value: 'className',
          }"
          :options="schemas"
        ></a-select>
      </a-form-item>

      <!-- TreeSelect 组件配置 -->
      <a-form-item
        v-if="optionState.editComponent == 'ATreeSelect'"
        label="数据集key"
        name="fieldNames"
        :rules="[
          { required: true, message: 'Please input your 请输入子数据集key' },
        ]"
      >
        <a-input
          v-model:value="componentOption.fieldNames"
          allowClear
          placeholder="请输入子数据集key"
        />
      </a-form-item>

      <!-- Upload 组件配置 -->
      <a-form-item
        v-if="optionState.editComponent == 'AUpload'"
        label="图片数量"
        name="maxLength"
        :rules="[
          { required: true, message: 'Please input your 请输入图片数量' },
        ]"
      >
        <a-input-number
          placeholder="请输入图片数量"
          allowClear
          id="inputNumber"
          v-model:value="componentOption.maxLength"
          :min="1"
        />
      </a-form-item>

      <a-form-item
        label="提示文案"
        name="placeholder"
        :rules="[{ required: false, message: 'Please input your 提示文案!' }]"
      >
        <a-input
          v-model:value="componentOption.placeholder"
          allowClear
          placeholder="请输入提示文案"
        />
      </a-form-item>

      <a-form-item
        label="是否禁用"
        name="disabled"
        style="min-width: 200px"
        :rules="[
          {
            required: true,
            message: 'Please input your 是否禁用!',
            trigger: 'change',
          },
        ]"
      >
        <a-switch
          v-model:checked="componentOption.disabled"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>

      <a-form-item
        label="清除按钮"
        name="allowClear"
        style="min-width: 200px"
        :rules="[
          {
            required: true,
            message: 'Please input your 清除按钮!',
            trigger: 'change',
          },
        ]"
      >
        <a-switch
          v-model:checked="componentOption.allowClear"
          checked-children="开"
          un-checked-children="关"
        />
      </a-form-item>
      
    </a-form>
  </a-modal>
</template>

<script setup>
import { deepClone } from "@/utils/utils";
import { computed, reactive, ref, watch } from "vue";
import * as antd from "ant-design-vue";
import store from "@/store";
const emit = defineEmits(["update:modalVisible", "onSubmit"]);
const props = defineProps({
  modalVisible: {
    type: Boolean,
    default: false,
  },
  type: {
    required: true,
    type: String,
    default: "",
  },
  editState: {
    type: Object,
    default: {},
  },
});

const modalType = {
  edit: "修改字段",
  add: "新增字段",
};

watch(
  () => props.modalVisible,
  (n) => {
    visible.value = n;
  }
);

const schemas = computed(() => {
  return store.getters["GET_TABLES"];
});

const form1 = ref();
const form2 = ref();
const form3 = ref();
const handleOk = () => {
  Promise.all([
    form1.value.validate(),
    form2.value.validate(),
    form3.value.validate(),
  ])
    .then((success) => {
      const { fieldType, fieldName } = success[0];
      const {
        required,
        chineseName,
        defaultValue,
        editComponent,
        targetClass,
      } = success[1];
      const {
        placeholder,
        disabled,
        allowClear,
        mode,
        selectTable,
        fieldNames,
        valueKey,
        labelKey,
        maxLength,
      } = success[2];
      const params = {
        fieldType,
        fieldName,
        fieldOption: {
          required,
          targetClass,
          chineseName,
          defaultValue: eval("(" + deepClone(defaultValue) + ")"),
          editComponent,
          componentOption: {
            placeholder,
            disabled,
            allowClear,
            mode,
            selectTable,
            fieldNames,
            valueKey,
            labelKey,
            maxLength,
          },
        },
      };
      emit("onSubmit", params);
    })
    .catch((err) => {
      console.log(err);
    });
};
let antdComponents = [
  ...Object.keys(antd)
    .map((key) => {
      return {
        label: key,
        value: antd[key].name,
      };
    })
    .filter((item) => {
      return (
        item.label != "version" &&
        item.label != "default" &&
        item.label != "install"
      );
    }),
];

const state = {
  formState: {
    fieldType: undefined,
    fieldName: "",
  },
  optionState: {
    required: false,
    chineseName: "",
    defaultValue: undefined,
    editComponent: undefined,
    targetClass: undefined,
  },
  componentOption: {
    placeholder: "",
    disabled: false,
    allowClear: false,
    mode: "combobox",
    fieldNames: undefined,
    valueKey: "objectId",
    labelKey: "name",
    selectTable: undefined,
    maxLength: 8,
  },
};

let formState = reactive({
  fieldType: undefined,
  fieldName: "",
});
let optionState = reactive({
  required: false,
  chineseName: "",
  defaultValue: undefined,
  editComponent: undefined,
  targetClass: undefined,
});
let componentOption = reactive({
  placeholder: "",
  disabled: false,
  allowClear: false,
  mode: "combobox",
  selectTable: undefined,
  fieldNames: undefined,
  valueKey: "objectId",
  labelKey: "name",
  maxLength: 8,
});

const visible = ref(props.modalVisible);
watch(visible, (n) => {
  emit("update:modalVisible", n);
  resetData(deepClone(state));
  if (props.type == "edit") {
    resetData(props.editState);
  }
});

const resetData = (arg) => {
  Object.keys(arg).forEach((state) => {
    Object.keys(arg[state]).forEach((key) => {
      switch (state) {
        case "formState":
          formState[key] = arg[state][key];
          break;
        case "optionState":
          optionState[key] = arg[state][key];
          break;
        case "componentOption":
          componentOption[key] = arg[state][key];
          break;
        default:
          break;
      }
    });
  });
};
</script>

<style lang="scss" scoped>
.ant-form-item {
  margin-bottom: 10px;
  min-width: 200px;
}
</style>