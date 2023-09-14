<template>
  <component
    @toPage="toPage"
    @loginOut="loginOut"
    @setting="() => (systemModal.show = true)"
    :AntdIcon="AntdIcon"
    :modules="modules"
    :systemOptions="systemOptions"
    :UserInfo="Parse.User.current()"
    :is="LayoutComponents[systemOptions.layout]"
  ></component>

  <!-- 设置弹窗 -->
  <a-drawer
    zIndex="2000"
    v-model:visible="systemModal.show"
    title="设置"
    placement="right"
  >
    <a-form
      :model="systemOptions"
      name="basic"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
    >
      <a-form-item label="页面布局">
        <a-radio-group
          v-model:value="systemOptions.layout"
          size="large"
          @change="onChange"
        >
          <a-radio value="LeftLayout">左右布局</a-radio>
          <a-radio value="TopLayout">上下布局</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="菜单栏主题">
        <a-radio-group
          v-model:value="systemOptions.theme"
          size="large"
          @change="onChange"
        >
          <a-radio value="light">light</a-radio>
          <a-radio value="dark">dark</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>


<script setup>
import { Mixins } from "@/mixins/index";
import * as AntdIcon from "@ant-design/icons-vue";
import LeftLayout from "./LeftLayout.vue";
import TopLayout from "./TopLayout.vue";
import Parse from "parse";
import { computed, reactive, ref } from "vue";
import store from "@/store";
const { toPage } = Mixins();

const LayoutComponents = {
  LeftLayout,
  TopLayout,
};

/* 设置弹窗 */
const systemModal = reactive({
  show: false,
});

/* 系统主题配置 */
const systemOptions = reactive(
  Object.assign(
    {},
    {
      theme: "light",
      layout: "TopLayout",
    },
    Parse.User.current().get("systemOptions")
  )
);

const modules = computed(() => {
  return store.getters["GET_MODULES"];
});

/* 系统配置改变 */
const onChange = () => {
  const user = Parse.User.current();
  user.set(
    "systemOptions",
    Object.assign({}, user.get("systemOptions"), systemOptions)
  );
  user.save();
};

const loginOut = async () => {
  toPage("/login");
  await Parse.User.logOut();
  localStorage.clear();
  store.commit("SET_MODULES", []);
};
</script>

<style lang="scss" scoped>
@import "@/assets/scss/Layout.scss";
</style>