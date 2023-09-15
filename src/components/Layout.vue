<template>
  <component
    :AntdIcon="AntdIcon"
    :systemOptions="systemOptions"
    :is="LayoutComponents[systemOptions.layout]"
  >
    <template #layout-content>
      <a-layout-content
        :style="{
          margin:
            systemOptions.layout == 'TopLayout'
              ? '88px 16px 24px'
              : '24px 16px',
          padding: '24px',
          background: '#fff',
          minHeight: '280px',
        }"
      >
        <router-view v-slot="{ Component, route }">
          <suspense>
            <template #default>
              <component :is="Component" :key="route.path" />
            </template>
            <template #fallback>
              <div class="pageLoading">
                <a-spin tip="loading..." size="large" />
              </div>
            </template>
          </suspense>
        </router-view>
      </a-layout-content>
    </template>

    <template #layout-menu>
      <div
        class="logo"
        :style="{
          width: systemOptions.layout == 'TopLayout' ? '200px' : 'auto',
        }"
      />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        :theme="systemOptions.theme"
        :mode="systemOptions.layout == 'TopLayout' ? 'horizontal' : 'inline'"
      >
        <template v-for="item in modules">
          <template v-if="item.children">
            <a-sub-menu :key="'sub' + item.objectId">
              <template #title>
                <span>
                  <component :is="AntdIcon[item.meta.icon]"></component>
                  <span>{{ item.name }}</span>
                </span>
              </template>

              <a-menu-item
                v-for="chil in item.children"
                :key="'chil' + chil.objectId"
                @click="toPage('/' + item.path + '/' + chil.path)"
              >
                {{ chil.name }}
              </a-menu-item>
            </a-sub-menu>
          </template>
          <template v-else>
            <a-menu-item :key="item.objectId" @click="toPage('/' + item.path)">
              <component :is="AntdIcon[item.meta.icon]"></component>
              <span>{{ item.name }}</span>
            </a-menu-item>
          </template>
        </template>
      </a-menu>
    </template>

    <template #layout-header-right>
      <div style="display: flex; align-items: center; min-width: 88px">
        <!-- 全屏 -->
        <a-tooltip placement="bottom" v-if="!isFullScreen">
          <template #title>
            <span>全屏</span>
          </template>
          <component
            :is="AntdIcon['ExpandOutlined']"
            style="font-size: 15px; color: gray"
            @click="zoomPage"
          ></component>
        </a-tooltip>

        <!-- 退出全屏 -->
        <a-tooltip placement="bottom" v-else>
          <template #title>
            <span>退出全屏</span>
          </template>
          <component
            :is="AntdIcon['CompressOutlined']"
            style="font-size: 15px; color: gray; margin-left: 10px"
            @click="zoomPage"
          ></component>
        </a-tooltip>

        <!-- 刷新按钮 -->
        <a-tooltip placement="bottom">
          <template #title>
            <span>刷新</span>
          </template>
          <component
            :is="AntdIcon['ReloadOutlined']"
            style="font-size: 15px; color: gray; margin-left: 10px"
            @click="pageReload"
          ></component>
        </a-tooltip>

        <a-popover placement="bottomRight">
          <template #content>
            <a-button
              @click="() => (systemModal.show = true)"
              style="margin-top: 10px"
              block
            >
              主题配置
            </a-button>
            <div style="display: flex; flex-direction: column">
              <a-button @click="loginOut" style="margin-top: 10px">
                退出登录
              </a-button>
            </div>
          </template>
          <img
            v-if="Parse.User.current().get('avatar')"
            :src="Parse.User.current().get('avatar')"
            style="
              height: 40px;
              width: 40px;
              object-fit: cover;
              border-radius: 50%;
              overflow: hidden;
              margin: 0 10px;
            "
            alt=""
          />
          <component
            v-else
            :is="AntdIcon['UserOutlined']"
            style="font-size: 24px; margin: 0 24px"
          ></component>
          <span>{{ Parse.User.current().get("name") }}</span>
        </a-popover>
      </div>
    </template>
  </component>

  <!-- 设置弹窗 -->
  <a-drawer
    :zIndex="2000"
    v-model:visible="systemModal.show"
    title="主题配置"
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
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import store from "@/store";
const { toPage } = Mixins();

const LayoutComponents = {
  LeftLayout,
  TopLayout,
};

const selectedKeys = ref(["1"]);

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

const isFullScreen = ref(false);

/* 系统配置改变 */
const onChange = () => {
  const user = Parse.User.current();
  user.set(
    "systemOptions",
    Object.assign({}, user.get("systemOptions"), systemOptions)
  );
  user.save();
};

/* 页面刷新 */
const pageReload = () => {
  window.location.reload();
};

/* 全屏，退出全屏 */
const zoomPage = () => {
  if (document.webkitIsFullScreen) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen();
  }
};

const loginOut = async () => {
  toPage("/login");
  await Parse.User.logOut();
  localStorage.clear();
  store.commit("SET_MODULES", []);
};

document.onfullscreenchange = (e) => {
  if (!document.webkitIsFullScreen) {
    isFullScreen.value = false;
  } else {
    isFullScreen.value = true;
  }
};

onUnmounted(() => {
  document.onfullscreenchange = undefined;
});
</script>

<style lang="scss">
@import "@/assets/scss/Layout.scss";
</style>