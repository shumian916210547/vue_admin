<template>
  <a-modal
    v-model:visible="visible"
    @ok="handleOk"
    :width="modalWidth"
    ref="modalRef"
    style="position: relative"
  >
    <template #title>
      <div ref="modalTitleRef" style="width: 100%; cursor: move">
        {{ modalType[type] + " " + className }}
      </div>
    </template>

    <div
      :style="{
        position: 'relative',
        height: '100%',
        width: formWidth,
        height: formHeight,
      }"
    >
      <a-form
        :model="formState"
        autocomplete="off"
        labelAlign="left"
        ref="form1"
        v-if="visible"
        style="position: relative"
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
          :style="
            fields[key].editComponent == 'RichTextEditor'
              ? {
                  position: 'absolute',
                  left: '420px',
                  width: '1000px',
                  top: 0,
                }
              : {}
          "
          :key="index"
          :labelCol="
            fields[key].editComponent == 'RichTextEditor'
              ? { span: 2 }
              : { span: 6 }
          "
          :wrapperCol="
            fields[key].editComponent == 'RichTextEditor'
              ? { span: 22 }
              : { span: 18 }
          "
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
            v-else-if="fields[key].editComponent == 'AUpload'"
            v-model:files="formState[key]"
            :maxLength="fields[key].componentOption.maxLength"
            :disabled="fields[key].componentOption.disabled"
            :fileType="fields[key].componentOption.fileType"
            :is="Upload"
          ></component>

          <component
            v-else-if="fields[key].editComponent == 'ASwitch'"
            v-model:checked="formState[key]"
            :disabled="fields[key].componentOption.disabled"
            :is="fields[key].editComponent"
          ></component>

          <component
            v-else-if="fields[key].editComponent == 'RichTextEditor'"
            ref="richTextRef"
            v-model:value="formState[key]"
            :disabled="fields[key].componentOption.disabled"
            :placeholder="fields[key].componentOption.placeholder"
            minHeight="320px"
            :is="RichTextEditor"
          ></component>

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
    </div>
    <div class="bar" @mousedown="down($event)" ref="bar"></div>
    <template #modalRender="{ originVNode }">
      <div :style="transformStyle">
        <component :is="originVNode" />
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { findAll } from "@/service/base.service";
import { reactive, watch, ref, watchEffect, computed } from "vue";
import * as AntdIcon from "@ant-design/icons-vue";
import Upload from "./Upload.vue";
import { deepClone } from "@/utils/utils";
import { useDraggable } from "@vueuse/core";
import RichTextEditor from "./RichTextEditor.vue";
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
const modalWidth = ref("600px");
const formWidth = ref("100%");
const formHeight = ref("auto");
const richTextRef = ref();
const form1 = ref();
watch(
  () => props.modalVisible,
  (n) => {
    visible.value = n;
    if (n && props.type == "edit") {
      Object.keys(props.editState).forEach((key) => {
        if (
          props.fields[key] &&
          props.fields[key].editComponent &&
          props.fields[key].editComponent == "AUpload" &&
          props.fields[key].componentOption.maxLength == 1
        ) {
          formState[key] = [
            {
              uid: new Date().getMilliseconds(),
              name: props.editState[key].match(/\upload\/(.*)/)[1],
              status: "done",
              url: props.editState[key],
            },
          ];
        } else {
          formState[key] = props.editState[key];
        }
      });
    }
  }
);
const visible = ref(props.modalVisible);
watch(visible, (n) => {
  if (!n) {
    Object.keys(props.fields).forEach((key) => {
      formState[key] = props.fields[key].defaultValue || undefined;
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
        formState[key] = props.fields[key].defaultValue || undefined;
        /* 获取下拉组件数据 */
        if (props.fields[key].componentOption.selectTable) {
          loadSelectOptions(props.fields[key].componentOption.selectTable);
        }

        if (props.fields[key].editComponent == "RichTextEditor") {
          modalWidth.value = "1480px";
          formWidth.value = "400px";
          formHeight.value = 420 + "px";
        }
      });
    }
  },
  { deep: true, immediate: true }
);

const handleOk = () => {
  Promise.all([form1.value.validate()])
    .then((success) => {
      const params = deepClone(success[0]);
      Object.keys(success[0]).forEach((key) => {
        if (
          props.fields[key] &&
          props.fields[key].editComponent &&
          props.fields[key].editComponent == "AUpload" &&
          props.fields[key].componentOption.maxLength == 1
        ) {
          params[key] = params[key]?.[0]?.url;
        } else {
          params[key] = params[key];
        }
      });
      emit("onOk", params);
    })
    .catch((error) => {
      console.log(error);
    });
};

const modalTitleRef = ref();
const { x, y, isDragging } = useDraggable(modalTitleRef);
const startX = ref(0);
const startY = ref(0);
const startedDrag = ref(false);
const transformX = ref(0);
const transformY = ref(0);
const preTransformX = ref(0);
const preTransformY = ref(0);
const dragRect = ref({
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
});
watch([x, y], () => {
  if (!startedDrag.value) {
    startX.value = x.value;
    startY.value = y.value;
    const bodyRect = document.body.getBoundingClientRect();
    const titleRect = modalTitleRef.value.getBoundingClientRect();
    dragRect.value.right = bodyRect.width - titleRect.width;
    dragRect.value.bottom = bodyRect.height - titleRect.height;
    preTransformX.value = transformX.value;
    preTransformY.value = transformY.value;
  }
  startedDrag.value = true;
});
watch(isDragging, () => {
  if (!isDragging) {
    startedDrag.value = false;
  }
});
watchEffect(() => {
  if (startedDrag.value) {
    transformX.value =
      preTransformX.value +
      Math.min(Math.max(dragRect.value.left, x.value), dragRect.value.right) -
      startX.value;
    transformY.value =
      preTransformY.value +
      Math.min(Math.max(dragRect.value.top, y.value), dragRect.value.bottom) -
      startY.value;
  }
});
const transformStyle = computed(() => {
  return {
    transform: `translate(${transformX.value}px, ${transformY.value}px)`,
  };
});

const down = (e) => {
  const startX = e.clientX;
  const offsetX = e.target.offsetLeft; //元素左边到窗口左边的距离
  e.target.setCaptrue; //设置鼠标捕获(之后的事件捕获会作用在当前元素上)
  document.onmousemove = (e) => {
    const endX = e.clientX;
    const width = offsetX - (startX - endX);
    if (width > 600) modalWidth.value = width + "px";
  };
  document.onmouseup = (e) => {
    document.onmousemove = null;
    document.onmouseup = null;
    e.target.releaseCaptrue; //释放鼠标捕获
  };
};
</script>

<style lang="scss" scoped>
.bar {
  cursor: col-resize;
  width: 24px;
  display: inline-block;
  line-height: 200px;
  vertical-align: middle;
  position: absolute;
  right: 0px;
  top: 0;
  height: 100%;
}
</style>