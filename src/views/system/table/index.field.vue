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
      size="small"
      ref="form1"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
    >
      <a-form-item
        label="字段名称"
        name="fieldName"
        :rules="[{ required: true, message: '请输入字段名称' }]"
      >
        <a-input
          size="small"
          v-model:value="formState.fieldName"
          allowClear
          placeholder="请输入字段名称"
          :disabled="props.type == 'edit'"
        />
      </a-form-item>

      <a-form-item
        label="字段类型"
        name="fieldType"
        :rules="[
          {
            required: true,
            message: '请选择字段类型',
            trigger: 'change',
          },
        ]"
      >
        <a-select
          size="small"
          v-model:value="formState.fieldType"
          show-search
          placeholder="请选择字段类型"
          allowClear
          :disabled="props.type == 'edit'"
          :options="[
            {
              label: '布尔值',
              value: 'Boolean',
            },
            {
              label: '字符串',
              value: 'String',
            },
            {
              label: '数字',
              value: 'Number',
            },
            {
              label: '日期',
              value: 'Date',
            },
            {
              label: '对象',
              value: 'Object',
            },
            {
              label: '数组',
              value: 'Array',
            },
            {
              label: '地理坐标',
              value: 'GeoPoint',
            },
            {
              label: '多边形',
              value: 'Polygon',
            },
            {
              label: '文件',
              value: 'File',
            },
            {
              label: '关联指针',
              value: 'Pointer',
            },
            {
              label: '多对多关系',
              value: 'Relation',
            },
          ]"
        ></a-select>
      </a-form-item>
    </a-form>

    <!-- 字段配置 -->
    <a-form
      :model="optionState"
      size="small"
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
          { required: true, message: '请输入中文字段名称' },
        ]"
      >
        <a-input
          size="small"
          v-model:value="optionState.chineseName"
          allowClear
          placeholder="请输入中文字段名称"
        />
      </a-form-item>

      <a-form-item
        v-if="formState.fieldType == 'Pointer' || optionState.isPointer"
        label="指向表名"
        name="targetClass"
        :rules="[
          {
            required: true,
            message: '请选择指向表名',
            trigger: 'change',
          },
        ]"
      >
        <a-select
          size="small"
          v-model:value="optionState.targetClass"
          show-search
          placeholder="请选择指向表名"
          allowClear
          :disabled="props.type == 'edit'"
          :fieldNames="{
            label: 'name',
            value: 'name',
          }"
          :options="schemas"
          @change="targetClassChange"
        ></a-select>
      </a-form-item>

      <a-form-item
        label="默认值"
        name="defaultValue"
        :rules="[{ required: false, message: '请输入字段默认值' }]"
      >
        <template v-if="optionState.targetClass">
          <a-select
            size="small"
            v-model:value="optionState.defaultValue"
            show-search
            placeholder="请选择默认值"
            allowClear
            :disabled="props.type == 'edit'"
            :fieldNames="{
              label: 'name',
              value: 'objectId',
            }"
            :options="defaultValueList"
          ></a-select>
        </template>
        <template v-else>
          <a-input
            size="small"
            v-model:value="optionState.defaultValue"
            allowClear
            :disabled="props.type == 'edit'"
            placeholder="请输入字段默认值"
          />
        </template>
      </a-form-item>

      <a-form-item
        label="字段必填"
        name="required"
        style="min-width: 200px"
        :rules="[
          {
            required: true,
            message: '请选择字段是否必填',
            trigger: 'change',
          },
        ]"
      >
        <a-switch
          size="small"
          v-model:checked="optionState.required"
          :disabled="props.type == 'edit'"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>

      <template v-if="formState.fieldType == 'Array'">
        <a-form-item
          label="数组元素类型"
          name="isPointer"
          style="min-width: 200px"
        >
          <a-switch
            size="small"
            v-model:checked="optionState.isPointer"
            checked-children="是"
            un-checked-children="否"
          />
        </a-form-item>
      </template>

      <a-form-item
        label="编辑组件"
        name="editComponent"
        :rules="[
          {
            required: false,
            message: '请选择编辑组件',
            trigger: 'change',
          },
        ]"
      >
        <a-select
          size="small"
          v-model:value="optionState.editComponent"
          show-search
          allowClear
          placeholder="请选择编辑组件"
          :options="antdComponents"
        ></a-select>
      </a-form-item>

      <a-form-item label="筛选字段" name="isFilter" style="min-width: 200px">
        <a-switch
          size="small"
          v-model:checked="optionState.isFilter"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>

      <a-form-item label="表格展示" name="isTable" style="min-width: 200px">
        <a-switch
          size="small"
          v-model:checked="optionState.isTable"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>

      <template v-if="formState.fieldType == 'Array' && optionState.isPointer">
        <a-form-item label="不可重复" name="isSole" style="min-width: 200px">
          <a-switch
            size="small"
            v-model:checked="optionState.isSole"
            checked-children="是"
            un-checked-children="否"
          />
        </a-form-item>
      </template>
    </a-form>

    <!-- 组件配置 -->
    <a-form
      :model="componentOption"
      size="small"
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
          :rules="[{ required: false, message: '请选择选择模式' }]"
        >
          <a-radio-group v-model:value="componentOption.mode" size="small">
            <a-radio-button value="multiple">多选</a-radio-button>
            <a-radio-button value="tags">标签输入</a-radio-button>
            <a-radio-button value="combobox">可搜索下拉</a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- label key -->
        <a-form-item
          label="显示字段键名"
          name="labelKey"
          :rules="[
            { required: true, message: '请输入显示字段键名' },
          ]"
        >
          <a-input
            size="small"
            v-model:value="componentOption.labelKey"
            allowClear
            placeholder="例如：name"
          />
        </a-form-item>

        <!-- value key -->
        <a-form-item
          label="值字段键名"
          name="valueKey"
          :rules="[
            { required: true, message: '请输入值字段键名' },
          ]"
        >
          <a-input
            size="small"
            v-model:value="componentOption.valueKey"
            allowClear
            placeholder="例如：objectId"
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
        :rules="[{ required: false, message: '请选择数据源' }]"
      >
        <a-select
          size="small"
          v-model:value="componentOption.selectTable"
          show-search
          placeholder="请选择数据源"
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
        label="子数据集字段"
        name="fieldNames"
        :rules="[
          { required: true, message: '请输入子数据集字段' },
        ]"
      >
        <a-input
          size="small"
          v-model:value="componentOption.fieldNames"
          allowClear
          placeholder="例如：children"
        />
      </a-form-item>

      <a-form-item
        v-if="optionState.editComponent == 'ATreeSelect'"
        label="最多可选择数量"
        name="maxCount"
        :rules="[
          { required: true, message: '请输入最多可选择数量' },
        ]"
      >
        <a-input-number
          size="small"
          placeholder="请输入最多可选择数量"
          allowClear
          id="inputNumber"
          v-model:value="componentOption.maxCount"
          :min="1"
        />
      </a-form-item>

      <!-- Upload 组件配置 -->
      <template v-if="optionState.editComponent == 'AUpload'">
        <a-form-item
          label="文件数量"
          name="maxLength"
          :rules="[
            { required: true, message: '请输入文件数量' },
          ]"
        >
          <a-input-number
            size="small"
            placeholder="请输入文件数量"
            allowClear
            id="inputNumber"
            v-model:value="componentOption.maxLength"
            :min="1"
          />
        </a-form-item>
        <a-form-item
          label="格式限制"
          name="fileType"
          :rules="[{ required: false, message: '请选择文件格式限制' }]"
        >
          <a-radio-group
            v-model:value="componentOption.fileType"
            size="small"
          >
            <a-radio-button value="*">无</a-radio-button>
            <a-radio-button value="image/*">图片</a-radio-button>
            <a-radio-button value="audio/*">音频</a-radio-button>
            <a-radio-button value="video/*">视频</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </template>

      <a-form-item
        label="提示文案"
        name="placeholder"
        :rules="[{ required: false, message: '请输入提示文案' }]"
      >
        <a-input
          size="small"
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
            message: '请选择是否禁用',
            trigger: 'change',
          },
        ]"
      >
        <a-switch
          size="small"
          v-model:checked="componentOption.disabled"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>

      <a-form-item
        label="清除按钮"
        v-if="optionState.editComponent != 'RichTextEditor'"
        name="allowClear"
        style="min-width: 200px"
        :rules="[
          {
            required: true,
            message: '请选择是否显示清除按钮',
            trigger: 'change',
          },
        ]"
      >
        <a-switch
          size="small"
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
import { findAll } from "@/service/base.service";
import * as antd from "ant-design-vue";
import { notification } from "ant-design-vue";
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

const schemas = computed(() => {
  return store.getters["GET_TABLES"];
});

const defaultValueList = ref([]);
//targetClass 修改时/触发
const targetClassChange = async (className) => {
  if (!className) return;
  defaultValueList.value = [...(await findAll(className))];
};

const form1 = ref();
const form2 = ref();
const form3 = ref();
watch(
  () => props.modalVisible,
  (n) => {
    visible.value = n;
    if (!n)
      form1.value.resetFields(),
        form2.value.resetFields(),
        form3.value.resetFields();
  }
);
/**
 * 校验字段定义的三个表单分区，并将合并后的字段配置提交给父级 Schema 页面。
 * @returns {Promise<void>} 校验成功时触发 onSubmit；失败时保留弹窗和字段错误状态。
 */
const handleOk = async () => {
  try {
    const success = await Promise.all([
      form1.value.validate(),
      form2.value.validate(),
      form3.value.validate(),
    ]);
      const { fieldType, fieldName } = success[0];
      const {
        required,
        chineseName,
        defaultValue,
        editComponent,
        targetClass,
        isFilter,
        isTable,
        isPointer,
        isSole,
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
        fileType,
        maxCount,
      } = success[2];
      const params = {
        fieldType,
        fieldName,
        fieldOption: {
          required,
          targetClass,
          chineseName,
          defaultValue,
          editComponent,
          isFilter,
          isTable,
          isPointer,
          isSole,
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
            fileType,
            maxCount,
          },
        },
      };
    emit("onSubmit", params);
  } catch {
    notification.warning({
      message: "字段配置未完成",
      description: "请检查必填项和组件配置后再提交。",
    });
  }
};
/** 动态表单实际支持的编辑组件中文名称；value 仍保留组件标识供 CommonForm 渲染。 */
const componentLabels = {
  AInput: "单行输入框",
  AInputNumber: "数字输入框",
  ASelect: "下拉选择",
  ATreeSelect: "树形选择",
  ASwitch: "开关",
  ADatePicker: "日期选择",
  ARangePicker: "日期范围选择",
  AUpload: "文件上传",
  RichTextEditor: "纯文本编辑器",
};

const antdComponents = [
  { value: "RichTextEditor", label: componentLabels.RichTextEditor },
  ...Object.keys(antd)
    .map((key) => {
      return {
        label: componentLabels[key] || key,
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
].sort((a, b) => {
  if (a.label < b.label) {
    return -1;
  }
  if (a.label > b.label) {
    return 1;
  }
  return 0;
});

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
    isFilter: false,
    isTable: false,
    isPointer: false,
    isSole: false,
  },
  componentOption: {
    placeholder: "请输入内容",
    disabled: false,
    allowClear: false,
    mode: "combobox",
    fieldNames: undefined,
    valueKey: "objectId",
    labelKey: "name",
    selectTable: undefined,
    maxLength: 8,
    fileType: "*",
    maxCount: 1,
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
  isFilter: false,
  isTable: false,
  isPointer: false,
  isSole: false,
});
let componentOption = reactive({
  placeholder: "请输入内容",
  disabled: false,
  allowClear: false,
  mode: "combobox",
  selectTable: undefined,
  fieldNames: undefined,
  valueKey: "objectId",
  labelKey: "name",
  maxLength: 8,
  fileType: "*",
  maxCount: 1,
});

const visible = ref(props.modalVisible);
watch(visible, (n) => {
  emit("update:modalVisible", n);
  resetData(deepClone(state));
  if (props.type == "edit") {
    resetData(props.editState);
    targetClassChange(optionState.targetClass);
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
