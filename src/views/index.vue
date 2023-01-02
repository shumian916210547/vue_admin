<template>
  <a-config-provider :locale="zhcn" :getPopupContainer="getPopupContainer">
    <a-layout style="height: 100vh">
      <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
        <div class="logo">
          <!-- VUE ADMIN -->
        </div>

        <a-menu
          v-model:openKeys="openKeys"
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          theme="dark"
          :inline-collapsed="collapsed"
        >
          <a-menu-item key="/home" @click="toPage('/home')">
            <template #icon>
              <HomeOutlined />
            </template>
            首页
          </a-menu-item>
          <a-sub-menu v-for="module in modules" :key="module.meta.companyId">
            <template #icon>
              <component :is="antdIcons[module.meta.icon]"></component>
            </template>
            <template #title>{{ module.name }}</template>
            <a-menu-item
              v-for="route in module.router"
              :key="route.path"
              @click="toPage(route.path)"
              >{{ route.name }}</a-menu-item
            >
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-header style="background: #fff; padding: 0">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
        </a-layout-header>
        <a-layout-content
          :style="{
            margin: '24px 16px',
            padding: '24px',
            background: '#fff',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
          }"
        >
          <router-view :key="route.path"></router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>
<script>
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
  MailOutlined,
  DesktopOutlined,
  InboxOutlined,
  AppstoreOutlined,
  HomeOutlined,
} from "@ant-design/icons-vue";
import * as antdIcons from "@ant-design/icons-vue";
import * as antd from "ant-design-vue";
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  toRefs,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import { useStore } from "vuex";
export default defineComponent({
  components: {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PieChartOutlined,
    MailOutlined,
    DesktopOutlined,
    InboxOutlined,
    AppstoreOutlined,
    HomeOutlined,
  },

  setup() {
    const router = useRouter();
    const route = useRoute();
    const zhcn = zhCN;
    const toPage = (path, params) => {
      router.push({ path, query: params });
    };
    const store = useStore();
    let antdComponents = Object.keys(antd).map((key) => {
      return {
        label: key,
        value: key,
      };
    });
    antdComponents = [
      ...antdComponents.filter((item) => {
        return (
          item.label != "version" &&
          item.label != "default" &&
          item.label != "install"
        );
      }),
    ];
    antdComponents.push({ label: "richText", value: "richText" });
    store.commit("SETANTDCOMPONENTS", antdComponents);
    const getPopupContainer = (el, dialogContext) => {
      if (dialogContext) {
        return dialogContext.getDialogWrap();
      } else {
        return document.body;
      }
    };
    let state = reactive({
      selectedKeys: [route.path],
      openKeys: [],
      rootSubmenuKeys: [],
    });
    const modules = computed(() => {
      return store.getters["GETMODULES"];
    });
    onMounted(() => {
      store.dispatch("UpdateStore");
      console.log('index mounted');
    });

    return {
      ...toRefs(state),
      collapsed: ref(false),
      modules,
      zhcn,
      antdIcons,
      route,
      toPage,
      getPopupContainer,
    };
  },
});
</script>
<style lang="scss" scoped>
.trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.logo {
  height: 64px;
  background: rgba(255, 255, 255, 0.3);
  margin: 16px;
}

.site-layout .site-layout-background {
  background: #fff;
}
</style>
