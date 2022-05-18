<template>
  <commonPageVue
    :columns="columns"
    :className="className"
    :companyId="companyId"
    :fields="fields"
    :modalWidth="1000"
    v-model:formValue="formValue"
    @handleOk="handleSubmit"
  >
    <template #form>
      <a-form
        :rules="rules"
        :model="formValue"
        ref="formRef"
        autocomplete="off"
      >
        <a-form-item label="文章标题" name="name">
          <a-input v-model:value="formValue.name" />
        </a-form-item>
        <a-form-item label="文章内容" name="content">
          <richTextVue
            :key="formValue.content"
            v-model:valueHtml="formValue.content"
          ></richTextVue>
        </a-form-item>
      </a-form>
    </template>
  </commonPageVue>
</template>
<script>
import { defineComponent, reactive, toRefs, watch, ref, computed } from "vue";
import { notification } from "ant-design-vue";
import commonPageVue from "@/components/commonPage.vue";
import richTextVue from "@/components/richText.vue";
import { useRoute } from "vue-router";
export default defineComponent({
  components: { commonPageVue, richTextVue },

  setup() {
    const route = useRoute();
    const { meta } = route;
    console.log(meta);
    let formRef = ref();

    let formValue = reactive({});
    let rules = reactive({
      content: [
        {
          required: computed(() => {
            return meta.fields["content"].required;
          }),
          trigger: "change",
          message: "请输入文章内容",
        },
      ],
      name: [
        {
          required: computed(() => {
            return meta.fields["name"].required;
          }),
          trigger: "change",
          message: "请输入文章标题",
        },
      ],
    });

    const handleSubmit = async () => {
      try {
        await formRef.value.validateFields();
        console.log(formValue);
      } catch (errorInfo) {
        console.log(errorInfo);
        notification["error"]({
          message: "提醒",
          description: errorInfo.msg || errorInfo.toString() || "缺少必填项",
        });
      }
    };

    return {
      ...toRefs(meta),
      formValue,
      formRef,
      rules,
      handleSubmit,
    };
  },
});
</script>
