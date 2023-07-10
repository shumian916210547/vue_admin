<template>
  <a-modal
    v-model:visible="visible"
    :title="modalType[type] + ' ' + className"
    @ok="handleOk"
    width="600px"
  >
    <a-form
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      labelAlign="left"
      ref="form1"
    >
      <a-form-item
        v-for="(key, index) in Object.keys(fields).filter((key) => {
          return fields[key].editComponent;
        })"
        :label="fields[key].chineseName"
        :name="key"
        :rules="[
          {
            required: fields[key].required,
            message: fields[key].componentOption.placeholder,
          },
        ]"
        :key="index"
      >
        <component
          v-if="fields[key].editComponent == 'ATreeSelect'"
          v-model:value="formState[key]"
          style="width: 100%"
          :tree-data="selectoptions[fields[key].componentOption.selectTable]"
          tree-checkable
          :allowClear="fields[key].componentOption.allowClear"
          :placeholder="fields[key].componentOption.placeholder"
          tree-node-filter-prop="label"
          :fieldNames="{
            children: fields[key].componentOption.fieldNames,
            label: 'name',
            value: 'objectId',
          }"
          :is="fields[key].editComponent"
        ></component>
        <component
          v-else-if="
            fields[key].editComponent == 'ASelect' &&
            fields[key].componentOption.selectTable == 'AntdIcon'
          "
          v-model:value="formState[key]"
          :placeholder="fields[key].componentOption.placeholder"
          :disabled="fields[key].componentOption.disabled"
          :allowClear="fields[key].componentOption.allowClear"
          :mode="fields[key].componentOption.mode"
          :is="fields[key].editComponent"
        >
          <a-select-option
            v-for="(item, index) in selectoptions[
              fields[key].componentOption.selectTable
            ]"
            :key="index"
            :label="item.name"
            :value="item.name"
          >
            <component
              :is="AntdIcon[item[fields[key].componentOption.labelKey]]"
            ></component>
            {{ item[fields[key].componentOption.labelKey] }}
          </a-select-option>
        </component>
        <component
          v-else
          v-model:value="formState[key]"
          :placeholder="fields[key].componentOption.placeholder"
          :disabled="fields[key].componentOption.disabled"
          :allowClear="fields[key].componentOption.allowClear"
          :mode="fields[key].componentOption.mode"
          :fieldNames="{
            label: fields[key].componentOption.labelKey,
            value: fields[key].componentOption.valueKey,
          }"
          :options="selectoptions[fields[key].componentOption.selectTable]"
          :is="fields[key].editComponent"
        >
        </component>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { findAll } from "@/service/base.service";
import { reactive, watch, ref } from "vue";
import * as AntdIcon from "@ant-design/icons-vue";
const emit = defineEmits(["update:modalVisible", "onOk"]);
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
  modalVisible: {
    type: Boolean,
    default: false,
  },
  editState: {
    type: Object,
    default: () => new Object(),
  },
});
const modalType = {
  add: "Create A",
  edit: "Editing",
};
const form1 = ref();
watch(
  () => props.modalVisible,
  (n) => {
    visible.value = n;
    if (n && props.type == "edit") {
      Object.keys(props.editState).forEach((key) => {
        formState[key] = props.editState[key];
      });
    }
  }
);
const visible = ref(props.modalVisible);
watch(visible, (n) => {
  if (!n) {
    Object.keys(props.fields).forEach((key) => {
      formState[key] = undefined;
    });
  }
  emit("update:modalVisible", n);
});

const selectoptions = reactive({});
const loadSelectOptions = async (className) => {
  if (!className) return [];
  selectoptions[className] = [];
  selectoptions[className] = await findAll(className);
};
const formState = reactive({});
watch(
  () => props.fields,
  (n) => {
    if (props.type == "add") {
      Object.keys(props.fields).forEach((key) => {
        formState[key] = undefined;
        if (props.fields[key].componentOption.selectTable) {
          loadSelectOptions(props.fields[key].componentOption.selectTable);
        }
      });
    }
  },
  { deep: true, immediate: true }
);

const handleOk = () => {
  Promise.all([form1.value.validate()])
    .then((success) => {
      emit("onOk", success[0]);
    })
    .catch((error) => {
      console.log(error);
    });
};
</script>