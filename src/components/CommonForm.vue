<template>
  <el-dialog
    v-model="visible"
    :class="['common-form-modal', { 'common-form-modal--fullscreen': isFullscreen }]"
    :width="modalWidth"
    :fullscreen="isFullscreen"
    draggable
    destroy-on-close
  >
    <template #header>
      <div class="common-form-modal__header">
        <div class="common-form-modal__title">
          {{ modalType[type] + " " + className }}
        </div>
        <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏编辑'" placement="bottom">
          <el-button
            class="common-form-modal__fullscreen-button"
            size="small"
            text
            :aria-label="isFullscreen ? '退出全屏编辑' : '全屏编辑'"
            @click.stop="toggleFullscreen"
          >
            <el-icon v-if="isFullscreen"><Close /></el-icon>
            <el-icon v-else><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </template>

    <div
      v-if="visible"
      class="common-form-modal__body"
      :style="{
        '--common-form-width': formWidth,
        '--common-form-min-height': formMinHeight,
      }"
    >
      <el-form
        ref="formRef"
        class="common-form-modal__form"
        :model="formState"
        label-position="left"
        label-width="120px"
        size="small"
        autocomplete="off"
      >
        <el-form-item
          v-for="(key, index) in formFieldKeys"
          :key="index"
          :label="fields[key].chineseName"
          :prop="key"
          :rules="fieldRules(fields[key], key)"
          :class="{
            'common-form-modal__rich-text-item': getEditComponent(fields[key]) === 'RichTextEditor',
          }"
        >
          <el-tree-select
            v-if="getEditComponent(fields[key]) === 'ElTreeSelect'"
            v-model="formState[key]"
            size="small"
            class="common-form-modal__control"
            :data="treeSelectLabel(selectoptions[componentOption(key).selectTable])"
            node-key="objectId"
            :props="treeProps(key)"
            :show-checkbox="treeIsMultiple(key)"
            :multiple="treeIsMultiple(key)"
            :check-strictly="true"
            :default-expand-all="true"
            :clearable="componentOption(key).allowClear !== false"
            filterable
            :placeholder="getFieldPlaceholder(fields[key], key, true)"
            :disabled="componentOption(key).disabled"
            @change="handleTreeSelectChange(key, $event)"
          />

          <el-select
            v-else-if="getEditComponent(fields[key]) === 'ElSelect'"
            v-model="formState[key]"
            class="common-form-modal__control"
            size="small"
            filterable
            :placeholder="getFieldPlaceholder(fields[key], key, true)"
            :disabled="componentOption(key).disabled"
            :clearable="componentOption(key).allowClear !== false"
            :multiple="isMultiple(fields[key])"
          >
            <el-option
              v-for="(item, optionIndex) in selectOptions(key)"
              :key="item.objectId || item.value || item.name || optionIndex"
              :label="getOptionLabel(item, fields[key])"
              :value="getOptionValue(item, fields[key])"
            >
              <span v-if="componentOption(key).selectTable === 'ElementIcon'" class="form-option">
                <el-icon><component :is="getElementIcon(item[componentOption(key).labelKey])" /></el-icon>
                <span>{{ item[componentOption(key).labelKey] }}</span>
              </span>
            </el-option>
          </el-select>

          <Upload
            v-else-if="getEditComponent(fields[key]) === 'ElUpload'"
            v-model="formState[key]"
            :max-length="componentOption(key).maxLength"
            :disabled="componentOption(key).disabled"
            :file-type="componentOption(key).fileType"
            :placeholder="getFieldPlaceholder(fields[key], key)"
          />

          <el-switch
            v-else-if="getEditComponent(fields[key]) === 'ElSwitch'"
            v-model="formState[key]"
            size="small"
            :disabled="componentOption(key).disabled"
            :active-text="componentOption(key).activeText || '是'"
            :inactive-text="componentOption(key).inactiveText || '否'"
          />

          <RichTextEditor
            v-else-if="getEditComponent(fields[key]) === 'RichTextEditor'"
            v-model="formState[key]"
            :disabled="componentOption(key).disabled"
            :placeholder="getFieldPlaceholder(fields[key], key)"
            min-height="320px"
          />

          <el-input-number
            v-else-if="getEditComponent(fields[key]) === 'ElInputNumber'"
            v-model="formState[key]"
            class="common-form-modal__control"
            size="small"
            controls-position="right"
            :disabled="componentOption(key).disabled"
            :placeholder="getFieldPlaceholder(fields[key], key)"
          />

          <el-date-picker
            v-else-if="getEditComponent(fields[key]) === 'ElDatePicker'"
            v-model="formState[key]"
            class="common-form-modal__control"
            size="small"
            type="datetime"
            :placeholder="getFieldPlaceholder(fields[key], key)"
            :disabled="componentOption(key).disabled"
            :clearable="componentOption(key).allowClear !== false"
          />

          <el-date-picker
            v-else-if="getEditComponent(fields[key]) === 'ElDateRangePicker'"
            v-model="formState[key]"
            class="common-form-modal__control"
            size="small"
            type="datetimerange"
            :start-placeholder="`${getFieldPlaceholder(fields[key], key)}开始`"
            :end-placeholder="`${getFieldPlaceholder(fields[key], key)}结束`"
            :disabled="componentOption(key).disabled"
            :clearable="componentOption(key).allowClear !== false"
          />

          <el-input
            v-else
            v-model="formState[key]"
            class="common-form-modal__control"
            size="small"
            :type="getEditComponent(fields[key]) === 'ElInputPassword' ? 'password' : 'text'"
            :show-password="getEditComponent(fields[key]) === 'ElInputPassword'"
            :placeholder="getFieldPlaceholder(fields[key], key)"
            :disabled="componentOption(key).disabled"
            :clearable="componentOption(key).allowClear !== false"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button size="small" type="primary" @click="handleOk">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { Close, FullScreen } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { computed, reactive, ref, watch } from "vue";

import { findAll } from "@/service/base.service";
import { isSelected } from "@/service/treeSelect.service";
import { deepClone, dataDefault } from "@/utils/utils";
import { getElementIcon, normalizeEditComponent } from "@/utils/element";

import RichTextEditor from "./RichTextEditor.vue";
import Upload from "./Upload.vue";

const emit = defineEmits(["update:modelValue", "onOk"]);
const props = defineProps({
  className: {
    required: true,
    type: String,
  },
  fields: {
    required: true,
    type: Object,
  },
  type: {
    required: true,
    type: String,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  editState: {
    type: Object,
    default: () => ({}),
  },
});

const modalType = {
  add: "新增",
  edit: "修改",
};
const modalWidth = ref("600px");
const formWidth = ref("100%");
const formMinHeight = ref("360px");
const isFullscreen = ref(false);
const formRef = ref();
const visible = ref(props.modelValue);
const formState = reactive({});
const selectoptions = reactive({});
const selectoptionsCopy = reactive({});
const formFieldKeys = computed(() =>
  Object.keys(props.fields || {}).filter((key) => props.fields[key]?.editComponent)
);

/**
 * 读取并规范化字段的编辑组件标识，保证旧 Schema 也只进入 Element Plus 渲染分支。
 * @param {{editComponent?: unknown} | undefined} field Schema 字段配置。
 * @returns {string} Element Plus 组件标识或未知原始标识。
 */
const getEditComponent = (field) => normalizeEditComponent(field?.editComponent);

/**
 * 读取字段的可选组件配置，避免历史 Schema 缺少 componentOption 时渲染异常。
 * @param {string} key Schema 字段键名。
 * @returns {Record<string, unknown>} 规范化后的字段组件配置。
 */
const componentOption = (key) => props.fields[key]?.componentOption || {};

/**
 * 为动态表单字段生成中文占位提示。
 * @param {{chineseName?: string, componentOption?: {placeholder?: string}} | undefined} field 字段元数据。
 * @param {string} fieldName 字段键名，用于中文名称缺失时兜底。
 * @param {boolean} isSelect 是否为选择类控件。
 * @returns {string} Element Plus 控件使用的 placeholder 文案。
 */
const getFieldPlaceholder = (field, fieldName, isSelect = false) => {
  const configured = field?.componentOption?.placeholder;
  if (typeof configured === "string" && configured.trim()) return configured;
  const label = field?.chineseName || fieldName || "该字段";
  return `${isSelect ? "请选择" : "请输入"}${label}`;
};

/**
 * 判断选择字段是否支持多选。
 * @param {{componentOption?: {mode?: string}, type?: string, isPointer?: boolean}} field Schema 字段配置。
 * @returns {boolean} 多选模式或 Pointer 数组字段返回 true。
 */
const isMultiple = (field) =>
  ["multiple", "tags"].includes(field?.componentOption?.mode) ||
  (field?.isPointer && field?.type === "Array");

/**
 * 返回指定字段的下拉选项。
 * @param {string} key Schema 字段键名。
 * @returns {Array<Record<string, unknown>>} 关联数据源的选项数组。
 */
const selectOptions = (key) => selectoptions[componentOption(key).selectTable] || [];

/**
 * 从关联记录中读取下拉显示文本。
 * @param {Record<string, unknown>} option 关联数据源记录。
 * @param {{componentOption?: {labelKey?: string}}} field 字段配置。
 * @returns {string} 下拉项显示文本。
 */
const getOptionLabel = (option, field) =>
  String(option?.[field?.componentOption?.labelKey || "name"] ?? option?.label ?? option?.name ?? "");

/**
 * 从关联记录中读取下拉值。
 * @param {Record<string, unknown>} option 关联数据源记录。
 * @param {{componentOption?: {valueKey?: string}}} field 字段配置。
 * @returns {string | number | boolean | undefined} 下拉项值。
 */
const getOptionValue = (option, field) =>
  option?.[field?.componentOption?.valueKey || "objectId"] ?? option?.value;

/**
 * 为 Element Plus TreeSelect 生成节点字段映射。
 * @param {string} key Schema 字段键名。
 * @returns {{children: string, label: string, value: string}} 树节点字段配置。
 */
const treeProps = (key) => ({
  children: componentOption(key).fieldNames || "children",
  label: "name",
  value: "objectId",
});

/**
 * 判断树选择器是否为多选树，并同步显示复选框。
 * @param {string} key Schema 字段键名。
 * @returns {boolean} Pointer 数组或显式多选模式返回 true。
 */
const treeIsMultiple = (key) =>
  isMultiple(props.fields[key]) || props.fields[key]?.type === "Array";

/**
 * 将树节点深拷贝并把备注拼接到名称，避免直接修改服务端缓存对象。
 * @param {Array<Record<string, unknown>> | undefined} origin 原始树节点数组。
 * @param {{label?: string} | undefined} option 可选的自定义标签字段。
 * @returns {Array<Record<string, unknown>>} Element Plus TreeSelect 可消费的节点数组。
 */
const treeSelectLabel = (origin, option = undefined) => {
  if (!Array.isArray(origin)) return [];
  return deepClone(origin).map((item) => {
    const labelKey = option?.label || "name";
    const originalLabel = item[labelKey] || item.name || item.objectId || "";
    item[labelKey] = `${originalLabel}${item.remark ? `(${item.remark})` : ""}`;
    return item;
  });
};

/**
 * 将父组件的弹窗状态同步到 Element Plus Dialog，并回填编辑数据。
 * @param {boolean} nextVisible 父组件传入的最新可见状态。
 * @returns {void} 更新表单状态或重置字段，不发起额外的弹窗请求。
 */
watch(
  () => props.modelValue,
  (nextVisible) => {
    visible.value = nextVisible;
    if (nextVisible) {
      if (props.type === "edit") fillEditState();
      void loadAllSelectOptions();
    }
  }
);

/**
 * 将 Dialog 的可见状态同步回父组件 v-model。
 * @param {boolean} nextVisible Element Plus Dialog 的最新状态。
 * @returns {void} 发出 update:modelValue 事件。
 */
watch(visible, (nextVisible) => {
  if (!nextVisible) {
    isFullscreen.value = false;
    resetFormState();
  }
  if (nextVisible !== props.modelValue) emit("update:modelValue", nextVisible);
});

/**
 * 切换当前数据表记录编辑弹窗的全屏模式，让宽字段和大段文本获得完整编辑空间。
 * @returns {void} 更新 Element Plus Dialog 的 fullscreen 状态；关闭弹窗时由 visible watcher 自动恢复普通模式。
 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/**
 * 初始化新增表单或清理关闭后的旧值。
 * @returns {void} 按 Schema 默认值重建 formState。
 */
const resetFormState = () => {
  formRef.value?.resetFields?.();
  formFieldKeys.value.forEach((key) => {
    const configuredDefault = props.fields[key]?.defaultValue;
    formState[key] = configuredDefault ?? dataDefault(props.fields[key]?.type);
  });
};

/**
 * 将编辑对象回填到表单，单文件上传会转换为 Upload 组件需要的文件数组。
 * @returns {void} 更新 formState，不修改父组件的 editState。
 */
const fillEditState = () => {
  formFieldKeys.value.forEach((key) => {
    const field = props.fields[key];
    const value = props.editState[key];
    if (getEditComponent(field) === "ElUpload" && componentOption(key).maxLength === 1 && value) {
      const url = String(value);
      formState[key] = [
        {
          uid: `${key}-${Date.now()}`,
          name: url.split("/").pop() || "已上传文件",
          status: "done",
          url,
        },
      ];
    } else {
      formState[key] = deepClone(value);
    }
  });
};

/**
 * 读取一个关联数据源并缓存副本，避免重复打开弹窗产生无意义请求。
 * @param {string} className 关联数据表名；为空时跳过。
 * @returns {Promise<Array<Record<string, unknown>>>} 关联记录数组。
 */
const loadSelectOptions = async (className) => {
  if (!className) return [];
  if (!selectoptions[className]) {
    selectoptions[className] = deepClone(selectoptionsCopy[className]) || (await findAll(className));
    selectoptionsCopy[className] = deepClone(selectoptions[className]);
  }
  return selectoptions[className] || [];
};

/**
 * 加载当前表单所有字段的关联数据源，并把 Pointer 对象标准化为 objectId 数组。
 * @returns {Promise<void>} 所有关联选项加载和 Pointer 标准化完成后兑现。
 */
const loadAllSelectOptions = async () => {
  const classNames = [
    ...new Set(
      formFieldKeys.value
        .map((key) => componentOption(key).selectTable)
        .filter(Boolean)
    ),
  ];
  await Promise.all(classNames.map((className) => loadSelectOptions(className)));
  formFieldKeys.value.forEach((key) => {
    if (props.fields[key]?.isPointer && Array.isArray(formState[key])) {
      formState[key] = formState[key].map((item) => (typeof item === "object" ? item.objectId : item));
    }
  });
};

watch(
  () => props.fields,
  () => {
    if (props.type === "add") resetFormState();
    if (formFieldKeys.value.some((key) => getEditComponent(props.fields[key]) === "RichTextEditor")) {
      modalWidth.value = "1480px";
      formWidth.value = "400px";
      formMinHeight.value = "420px";
    } else {
      modalWidth.value = "600px";
      formWidth.value = "100%";
      formMinHeight.value = "360px";
    }
  },
  { deep: true, immediate: true }
);

/**
 * 为 Element Plus Form 生成字段验证规则，并明确在失焦时执行必填校验。
 * @param {{required?: boolean}} field Schema 字段配置。
 * @param {string} key 字段键名，用于生成中文校验提示。
 * @returns {Array<Record<string, unknown>>} Element Plus FormItem 规则数组。
 */
const fieldRules = (field, key) => [
  {
    required: field?.required === true,
    message: getFieldPlaceholder(field, key),
    trigger: [
      "ElSelect",
      "ElTreeSelect",
      "ElSwitch",
      "ElInputNumber",
      "ElDatePicker",
      "ElDateRangePicker",
      "ElUpload",
    ].includes(getEditComponent(field))
      ? "change"
      : "blur",
  },
];

/**
 * 校验通用动态表单并把标准化数据发给父级页面；单文件上传值转换为受控 URL。
 * @returns {Promise<void>} 校验成功后触发 onOk；失败时保留弹窗和字段提示。
 */
const handleOk = async () => {
  try {
    await formRef.value.validate();
    const values = deepClone(formState);
    const params = deepClone(values);
    Object.keys(values).forEach((key) => {
      if (getEditComponent(props.fields[key]) === "ElUpload" && componentOption(key).maxLength === 1) {
        params[key] = params[key]?.[0]?.url || "";
      }
    });
    emit("onOk", params);
  } catch {
    ElNotification.warning({
      title: "表单校验未通过",
      message: "请检查标记的字段后再提交。",
    });
  }
};

/**
 * 处理树选择器变化，并按历史组织关系规则更新不可重复选择的节点。
 * @param {string} key 当前字段键名。
 * @param {string | string[]} value Element Plus TreeSelect 返回的值。
 * @returns {Promise<void>} 节点状态更新完成后兑现。
 */
const handleTreeSelectChange = async (key, value) => {
  const field = props.fields[key];
  const options = selectOptions(key);
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
  const option = componentOption(key);
  const className = option.selectTable;
  if (!className || !Array.isArray(options)) return;

  if (field?.isPointer && field?.isSole) {
    selectoptions[className] = deepClone(options).map((parent, parentIndex) => {
      const childrenKey = option.fieldNames || "children";
      if (Array.isArray(parent[childrenKey])) {
        parent[childrenKey] = parent[childrenKey].map((child, childIndex) => ({
          ...child,
          disabled: selectedIds.length < (option.maxCount || Number.MAX_SAFE_INTEGER)
            ? false
            : !selectedIds.includes(child.objectId),
          parentIndex,
          childIndex,
        }));
      }
      return parent;
    });
  }

  if (!option.page && field?.isPointer && field?.isSole) {
    await disableSelect(
      selectedIds.flatMap((selectedId) => {
        const node = options.find((item) => item.objectId === selectedId);
        return node
          ? [{ searchClassName: props.className, className, classField: key, objectId: selectedId, node }]
          : [];
      })
    );
  }
};

/**
 * 查询服务端是否已存在相同 Pointer 关系并禁用已被占用的节点。
 * @param {Array<{searchClassName: string, className: string, classField: string, objectId: string, node: Record<string, unknown>}>} items 待检查节点。
 * @returns {Promise<void>} 节点 disabled 状态更新完成后兑现。
 */
const disableSelect = async (items) => {
  for (const item of items) {
    const result = await isSelected(item.searchClassName, item.classField, {
      __type: "Pointer",
      className: item.className,
      objectId: item.objectId,
    });
    item.node.disabled = Boolean(result);
  }
};
</script>

<style lang="scss" scoped>
.common-form-modal__header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.common-form-modal__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: move;
}

.common-form-modal__fullscreen-button {
  flex: 0 0 auto;
}

.common-form-modal__body {
  position: relative;
  width: var(--common-form-width, 100%);
  min-height: var(--common-form-min-height, 360px);
}

.common-form-modal--fullscreen .common-form-modal__body {
  width: 100%;
  min-height: 0;
}

.common-form-modal--fullscreen :deep(.el-dialog__body) {
  overflow: auto;
}

.common-form-modal__form {
  position: relative;
}

.common-form-modal__control {
  width: 100%;
}

.common-form-modal__rich-text-item {
  position: absolute;
  top: 0;
  left: 420px;
  width: 1000px;
}

.form-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: normal;
}

@media (min-width: 901px) {
  .common-form-modal--fullscreen .common-form-modal__rich-text-item {
    width: calc(100% - 440px);
  }
}

@media (max-width: 900px) {
  .common-form-modal__body {
    width: 100%;
    min-height: var(--common-form-min-height, 360px);
  }

  .common-form-modal__rich-text-item {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
  }
}
</style>
