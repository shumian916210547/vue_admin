<template>
  <component
    v-if="ComponentName == 'Switch'"
    v-model:checked="componentValue"
    :is="antdComponent[ComponentName]"
    :placeholder="'Please input your' + ChineseName"
  />
  <component
    v-else-if="ComponentName == 'TimePicker'"
    v-model:value="componentValue"
    :is="antdComponent[ComponentName]"
    :placeholder="'Please input your' + ChineseName"
    value-format="HH:mm:ss"
    style="width: 100%"
  />
  <component
    v-else-if="ComponentName == 'DatePicker'"
    :is="antdComponent[ComponentName]"
    v-model:value="componentValue"
    :placeholder="'Please input your' + ChineseName"
    value-format="YYYY/MM/DD"
    style="width: 100%"
  />
  <component
    v-else-if="ComponentName == 'Select'"
    :disabled="disabled"
    :is="antdComponent[ComponentName]"
    :placeholder="'Please input your' + ChineseName"
    v-model:value="componentValue"
    :options="options"
    :field-names="{ label: 'name', value: 'objectId' }"
    style="width: 100%"
  />
  <a-upload
    v-else-if="ComponentName == 'Upload'"
    v-model:file-list="componentValue"
    :action="baseUrl + '/cmn/uploadFile'"
    :data="{
      userid: userInfo.userid,
    }"
    accept="video/*,image/*"
  >
    <a-button>
      <upload-outlined></upload-outlined>
      Upload
    </a-button>
  </a-upload>
  <component
    v-else
    :is="antdComponent[ComponentName]"
    :placeholder="'Please input your' + ChineseName"
    :disabled="false"
    v-model:value="componentValue"
    style="width: 100%"
  />
</template>


<script>
import richText from "./richText.vue";
import * as antdComponent from "ant-design-vue";
import * as antdIcon from "@ant-design/icons-vue";
import { defineComponent, ref, watch } from "vue";
export default defineComponent({
  /* 名称 */
  name: "FormItemComponent",

  components: { ...antdIcon, richText },

  props: {
    /* 组件名称 */
    ComponentName: {
      type: String,
      default: "Input",
    },

    /* 字段中文名称 */
    ChineseName: {
      type: String,
      default: "",
    },

    /* 组件Options */
    options: {
      type: Array,
      default: [],
    },

    /* 组件禁用 */
    disabled: {
      type: Boolean,
      default: false,
    },

    /* 双向绑定的值 */
    value: {
      type: [String, Array],
      default: "",
    },
  },

  setup(props, { emit }) {
    antdComponent = { ...antdComponent, richText };
    let componentValue = ref(props.value);
    watch(componentValue, (n) => {
      emit("update:value", n);
    });

    return {
      antdComponent,
      componentValue,
      baseUrl: process.env.VUE_APP_BASE_API,
      userInfo: JSON.parse(sessionStorage.getItem("userInfo")),
    };
  },
});
</script>


<style lang="scss" scoped>
</style>


