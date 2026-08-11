<template>
  <el-dialog
    v-model="visible"
    :title="modalType[props.type]"
    width="600px"
    destroy-on-close
  >
    <!-- 字段基础信息 -->
    <el-form
      ref="form1"
      :model="formState"
      label-position="left"
      label-width="120px"
      size="small"
      autocomplete="off"
    >
      <el-form-item
        label="字段名称"
        prop="fieldName"
        :rules="[{ required: true, message: '请输入字段名称', trigger: 'blur' }]"
      >
        <el-input
          v-model="formState.fieldName"
          size="small"
          clearable
          placeholder="请输入字段名称"
          :disabled="props.type === 'edit'"
        />
      </el-form-item>

      <el-form-item
        label="字段类型"
        prop="fieldType"
        :rules="[{ required: true, message: '请选择字段类型', trigger: 'change' }]"
      >
        <el-select
          v-model="formState.fieldType"
          size="small"
          filterable
          clearable
          placeholder="请选择字段类型"
          :disabled="props.type === 'edit'"
        >
          <el-option label="布尔值" value="Boolean" />
          <el-option label="字符串" value="String" />
          <el-option label="数字" value="Number" />
          <el-option label="日期" value="Date" />
          <el-option label="对象" value="Object" />
          <el-option label="数组" value="Array" />
          <el-option label="地理坐标" value="GeoPoint" />
          <el-option label="多边形" value="Polygon" />
          <el-option label="文件" value="File" />
          <el-option label="关联指针" value="Pointer" />
          <el-option label="多对多关系" value="Relation" />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 字段配置 -->
    <el-form
      ref="form2"
      :model="optionState"
      label-position="left"
      label-width="120px"
      size="small"
      autocomplete="off"
    >
      <el-form-item
        label="中文名称"
        prop="chineseName"
        :rules="[{ required: true, message: '请输入中文字段名称', trigger: 'blur' }]"
      >
        <el-input
          v-model="optionState.chineseName"
          size="small"
          clearable
          placeholder="请输入中文字段名称"
        />
      </el-form-item>

      <el-form-item
        v-if="formState.fieldType === 'Pointer' || optionState.isPointer"
        label="指向表名"
        prop="targetClass"
        :rules="[{ required: true, message: '请选择指向表名', trigger: 'change' }]"
      >
        <el-select
          v-model="optionState.targetClass"
          size="small"
          filterable
          clearable
          placeholder="请选择指向表名"
          :disabled="props.type === 'edit'"
          @change="targetClassChange"
        >
          <el-option
            v-for="schema in schemas"
            :key="schema.objectId || schema.name || schema.className"
            :label="schemaName(schema)"
            :value="schema.name || schema.className"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        label="默认值"
        prop="defaultValue"
        :rules="[{ required: false, message: '请输入字段默认值', trigger: 'blur' }]"
      >
        <el-select
          v-if="optionState.targetClass"
          v-model="optionState.defaultValue"
          size="small"
          filterable
          clearable
          placeholder="请选择默认值"
          :disabled="props.type === 'edit'"
        >
          <el-option
            v-for="item in defaultValueList"
            :key="item.objectId"
            :label="item.name || item.objectId"
            :value="item.objectId"
          />
        </el-select>
        <el-input
          v-else
          v-model="optionState.defaultValue"
          size="small"
          clearable
          :disabled="props.type === 'edit'"
          placeholder="请输入字段默认值"
        />
      </el-form-item>

      <el-form-item
        label="字段必填"
        prop="required"
        class="schema-field-form__switch-item"
        :rules="[{ required: true, message: '请选择字段是否必填', trigger: 'change' }]"
      >
        <el-switch
          v-model="optionState.required"
          size="small"
          active-text="是"
          inactive-text="否"
          :disabled="props.type === 'edit'"
        />
      </el-form-item>

      <el-form-item
        v-if="formState.fieldType === 'Array'"
        label="数组元素类型"
        prop="isPointer"
        class="schema-field-form__switch-item"
      >
        <el-switch
          v-model="optionState.isPointer"
          size="small"
          active-text="指针"
          inactive-text="普通值"
        />
      </el-form-item>

      <el-form-item
        label="编辑组件"
        prop="editComponent"
        :rules="[{ required: false, message: '请选择编辑组件', trigger: 'change' }]"
      >
        <el-select
          v-model="optionState.editComponent"
          size="small"
          filterable
          clearable
          placeholder="请选择编辑组件"
        >
          <el-option
            v-for="item in componentOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="筛选字段" prop="isFilter" class="schema-field-form__switch-item">
        <el-switch
          v-model="optionState.isFilter"
          size="small"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item label="表格展示" prop="isTable" class="schema-field-form__switch-item">
        <el-switch
          v-model="optionState.isTable"
          size="small"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item
        v-if="formState.fieldType === 'Array' && optionState.isPointer"
        label="不可重复"
        prop="isSole"
        class="schema-field-form__switch-item"
      >
        <el-switch
          v-model="optionState.isSole"
          size="small"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>
    </el-form>

    <!-- 组件配置 -->
    <el-form
      ref="form3"
      :model="componentOption"
      label-position="left"
      label-width="120px"
      size="small"
      autocomplete="off"
    >
      <!-- 兼容历史 Schema 中的选择组件标识；界面控件本身由 Element Plus 提供。 -->
      <template v-if="optionState.editComponent === 'ElSelect'">
        <el-form-item
          label="模式"
          prop="mode"
          :rules="[{ required: false, message: '请选择选择模式', trigger: 'change' }]"
        >
          <el-radio-group v-model="componentOption.mode" size="small">
            <el-radio-button label="multiple">多选</el-radio-button>
            <el-radio-button label="tags">标签输入</el-radio-button>
            <el-radio-button label="combobox">可搜索下拉</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          label="显示字段键名"
          prop="labelKey"
          :rules="[{ required: true, message: '请输入显示字段键名', trigger: 'blur' }]"
        >
          <el-input
            v-model="componentOption.labelKey"
            size="small"
            clearable
            placeholder="例如：name"
          />
        </el-form-item>

        <el-form-item
          label="值字段键名"
          prop="valueKey"
          :rules="[{ required: true, message: '请输入值字段键名', trigger: 'blur' }]"
        >
          <el-input
            v-model="componentOption.valueKey"
            size="small"
            clearable
            placeholder="例如：objectId"
          />
        </el-form-item>
      </template>

      <el-form-item
          v-if="optionState.editComponent === 'ElSelect' || optionState.editComponent === 'ElTreeSelect'"
        label="数据源"
        prop="selectTable"
        :rules="[{ required: false, message: '请选择数据源', trigger: 'change' }]"
      >
        <el-select
          v-model="componentOption.selectTable"
          size="small"
          filterable
          clearable
          placeholder="请选择数据源"
        >
          <el-option
            v-for="schema in schemas"
            :key="schema.objectId || schema.name || schema.className"
            :label="schemaName(schema)"
            :value="schema.name || schema.className"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="optionState.editComponent === 'ElTreeSelect'"
        label="子数据集字段"
        prop="fieldNames"
        :rules="[{ required: true, message: '请输入子数据集字段', trigger: 'blur' }]"
      >
        <el-input
          v-model="componentOption.fieldNames"
          size="small"
          clearable
          placeholder="例如：children"
        />
      </el-form-item>

      <el-form-item
        v-if="optionState.editComponent === 'ElTreeSelect'"
        label="最多可选择数量"
        prop="maxCount"
        :rules="[{ required: true, message: '请输入最多可选择数量', trigger: 'change' }]"
      >
        <el-input-number
          v-model="componentOption.maxCount"
          size="small"
          controls-position="right"
          :min="1"
          placeholder="请输入最多可选择数量"
        />
      </el-form-item>

      <!-- Element Plus 没有与历史上传配置完全同名的表单组件，此处仅配置 Upload 的业务参数。 -->
      <template v-if="optionState.editComponent === 'ElUpload'">
        <el-form-item
          label="文件数量"
          prop="maxLength"
          :rules="[{ required: true, message: '请输入文件数量', trigger: 'change' }]"
        >
          <el-input-number
            v-model="componentOption.maxLength"
            size="small"
            controls-position="right"
            :min="1"
            placeholder="请输入文件数量"
          />
        </el-form-item>
        <el-form-item
          label="格式限制"
          prop="fileType"
          :rules="[{ required: false, message: '请选择文件格式限制', trigger: 'change' }]"
        >
          <el-radio-group v-model="componentOption.fileType" size="small">
            <el-radio-button label="*">无</el-radio-button>
            <el-radio-button label="image/*">图片</el-radio-button>
            <el-radio-button label="audio/*">音频</el-radio-button>
            <el-radio-button label="video/*">视频</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </template>

      <el-form-item
        label="提示文案"
        prop="placeholder"
        :rules="[{ required: false, message: '请输入提示文案', trigger: 'blur' }]"
      >
        <el-input
          v-model="componentOption.placeholder"
          size="small"
          clearable
          placeholder="请输入提示文案"
        />
      </el-form-item>

      <el-form-item
        label="是否禁用"
        prop="disabled"
        class="schema-field-form__switch-item"
        :rules="[{ required: true, message: '请选择是否禁用', trigger: 'change' }]"
      >
        <el-switch
          v-model="componentOption.disabled"
          size="small"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item
        v-if="optionState.editComponent !== 'RichTextEditor'"
        label="清除按钮"
        prop="allowClear"
        class="schema-field-form__switch-item"
        :rules="[{ required: true, message: '请选择是否显示清除按钮', trigger: 'change' }]"
      >
        <el-switch
          v-model="componentOption.allowClear"
          size="small"
          active-text="开"
          inactive-text="关"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button size="small" type="primary" @click="handleOk">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElNotification } from "element-plus";
import { computed, reactive, ref, watch } from "vue";

import { findAll } from "@/service/base.service";
import store from "@/store";
import { normalizeEditComponent } from "@/utils/element";
import { deepClone } from "@/utils/utils";

const emit = defineEmits(["update:modelValue", "onSubmit"]);
const props = defineProps({
  modelValue: {
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
    default: () => ({}),
  },
});

const modalType = {
  edit: "修改字段",
  add: "新增字段",
};

const schemas = computed(() => store.getters["GET_TABLES"] || []);
const defaultValueList = ref([]);
const form1 = ref();
const form2 = ref();
const form3 = ref();
const visible = ref(props.modelValue);

/**
 * 返回数据表下拉项的可读名称，兼容 Schema 原始记录和页面标准化记录。
 * @param {{name?: string, className?: string, nickName?: string}} schema 数据表元数据。
 * @returns {string} 供 Element Plus Select 展示的名称。
 */
const schemaName = (schema) => schema?.name || schema?.className || schema?.nickName || "未命名表";

/**
 * 根据 Pointer 目标表加载默认值候选记录。
 * @param {string | undefined} className Parse 数据表名；为空时清空候选项。
 * @returns {Promise<void>} 候选记录加载完成后兑现；请求错误由统一服务层提示并向上抛出。
 */
const targetClassChange = async (className) => {
  if (!className) {
    defaultValueList.value = [];
    return;
  }
  defaultValueList.value = [...(await findAll(className))];
};

/**
 * 校验三组字段配置并把 Element Plus Form 状态组合成后端 Schema 契约。
 * @returns {Promise<void>} 校验成功时触发 onSubmit；失败时保留弹窗和字段错误状态。
 */
const handleOk = async () => {
  try {
    await Promise.all([
      form1.value.validate(),
      form2.value.validate(),
      form3.value.validate(),
    ]);
    const {
      fieldType,
      fieldName,
    } = formState;
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
    } = optionState;
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
    } = componentOption;
    emit("onSubmit", {
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
    });
  } catch {
    ElNotification.warning({
      title: "字段配置未完成",
      message: "请检查必填项和组件配置后再提交。",
    });
  }
};

/** 动态表单支持的组件标识；实际渲染组件均由 Element Plus 或本地安全组件提供。 */
const componentOptions = [
  { value: "ElInput", label: "单行输入框" },
  { value: "ElInputNumber", label: "数字输入框" },
  { value: "ElSelect", label: "下拉选择" },
  { value: "ElTreeSelect", label: "树形选择" },
  { value: "ElSwitch", label: "开关" },
  { value: "ElDatePicker", label: "日期选择" },
  { value: "ElDateRangePicker", label: "日期范围选择" },
  { value: "ElUpload", label: "文件上传" },
  { value: "RichTextEditor", label: "纯文本编辑器" },
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

const formState = reactive(deepClone(state.formState));
const optionState = reactive(deepClone(state.optionState));
const componentOption = reactive(deepClone(state.componentOption));

/**
 * 将默认值或编辑值写入三组响应式表单状态。
 * @param {{formState?: Record<string, unknown>, optionState?: Record<string, unknown>, componentOption?: Record<string, unknown>}} data 要回填的分区数据。
 * @returns {void} 原地更新表单状态，不发起请求。
 */
const resetData = (data = state) => {
  Object.entries(data || {}).forEach(([section, values]) => {
    if (!values || typeof values !== "object") return;
    const target = { formState, optionState, componentOption }[section];
    if (target) {
      const nextValues = { ...values };
      if (section === "optionState" && "editComponent" in nextValues) {
        nextValues.editComponent = normalizeEditComponent(nextValues.editComponent);
      }
      Object.assign(target, nextValues);
    }
  });
};

/**
 * 根据父组件的 v-model 初始化新增或编辑状态，并在编辑 Pointer 字段时加载默认值。
 * @param {boolean} nextVisible 父组件传入的最新弹窗可见状态。
 * @returns {Promise<void>} 状态初始化完成后兑现。
 */
const syncFromParent = async (nextVisible) => {
  visible.value = nextVisible;
  if (!nextVisible) {
    form1.value?.resetFields?.();
    form2.value?.resetFields?.();
    form3.value?.resetFields?.();
    return;
  }
  resetData(deepClone(state));
  if (props.type === "edit") {
    resetData(deepClone(props.editState));
    await targetClassChange(optionState.targetClass);
  } else {
    defaultValueList.value = [];
  }
};

watch(
  () => props.modelValue,
  (nextVisible) => {
    void syncFromParent(nextVisible);
  },
  { immediate: true }
);

watch(visible, (nextVisible) => {
  if (nextVisible !== props.modelValue) emit("update:modelValue", nextVisible);
});
</script>
