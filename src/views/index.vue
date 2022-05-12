<template>
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
        <a-sub-menu v-for="module in modules" :key="module.objectId">
          <template #icon>
            <MailOutlined />
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
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
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
import { computed, defineComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

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
    const toPage = (path, params) => {
      router.push(path, params);
    };

    const store = useStore();
    let selectedKeys = ref([route.path]);

    const modules = computed(() => {
      return store.getters["GETMODULES"];
    });

    return {
      selectedKeys,
      collapsed: ref(false),
      modules,
      toPage,
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
