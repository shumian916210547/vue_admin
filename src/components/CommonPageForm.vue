<template>
  <a-modal
    v-model:visible="modalVisible"
    :key="modalVisible"
    :width="modalWidth"
    @ok="handleSubmit"
    @cancel="onCancel()"
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
          <FormItemComponent
            :ComponentName="fields[item].editComponent"
            :ChineseName="fields[item].chineseName"
            :disabled="String(fields[item]) ? false : true"
            :options="getSelectOptions(fields[item].dataSource)"
            v-model:value="formValue[item]"
          ></FormItemComponent>
        </a-form-item>
      </a-form>
    </slot>
    <template #title>
      <span>{{ formValue.objectId != undefined ? "修改" : "新增" }}</span>
    </template>
  </a-modal>
</template>

<script>
import FormItemComponent from "./FormItemComponent.vue";
import { debounce } from "@/utils/utils";
import { defineComponent, reactive, ref, watch } from "vue";
import { useStore } from "vuex";
export default defineComponent({
  name: "CommonPageForm",
  components: { FormItemComponent },
  props: {
    /* 隐藏显示 */
    visible: {
      type: Boolean,
      default: false,
    },

    /* 宽度 */
    modalWidth: {
      type: [Number, String],
      default: 520,
    },

    /* 表单绑定数据 */
    FormValue: {
      type: Object,
      default: {},
    },

    /* 字段 */
    fields: {
      type: Object,
      default: {},
    },
  },
  setup(props, { emit }) {
    const store = useStore();
    const formRef = ref();
    let formValue = reactive(props.FormValue);
    let modalVisible = ref(props.visible);
    watch(
      () => props.visible,
      (n) => {
        modalVisible.value = n;
      },
      { deep: true }
    );
    watch(modalVisible, (n) => {
      emit("update:visible", n);
    });

    /* 获取options */
    let once = ref(true);
    let onceKey = ref(new Array());
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

    let fileField = new Array();
    Object.keys(props.fields).forEach((k) => {
      if (props.fields[k].editComponent === "Upload") {
        fileField.push(k);
      }
    });

    /* 提交 */
    const handleSubmit = debounce(async () => {
      const params = await formRef.value.validateFields();
      fileField.forEach((k) => {
        params[k] = params[k].map((item) => {
          if (item.response) {
            item = item.response?.data;
          }
          return item;
        });
      });
      emit("submit", params);
    }, 300);

    /* 取消 */
    const onCancel = () => {
      for (const k of Object.keys(formValue)) {
        formValue[k] = undefined;
      }
      emit("update:FormValue", formValue);
    };

    return {
      formRef,
      formValue,
      modalVisible,
      getSelectOptions,
      handleSubmit,
      onCancel,
    };
  },
});
</script>