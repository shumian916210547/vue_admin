<template>
  <a-layout>
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <template v-for="(item, index) in modules">
          <template v-if="item.children">
            <a-sub-menu :key="'sub' + index">
              <template #title>
                <span>
                  <component :is="AntdIcon[item.meta.icon]"></component>
                  <span>{{ item.name }}</span>
                </span>
              </template>

              <a-menu-item
                v-for="(chil, chil_idx) in item.children"
                :key="'chil' + chil_idx"
                @click="toPage('/' + item.path + '/' + chil.path)"
                >{{ chil.name }}</a-menu-item
              >
            </a-sub-menu>
          </template>
          <template v-else>
            <a-menu-item :key="index" @click="toPage('/' + item.path)">
              <component :is="AntdIcon[item.meta.icon]"></component>
              <span>{{ item.name }}</span>
            </a-menu-item>
          </template>
        </template>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header
        :style="{
          background: '#fff',
          padding: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }"
      >
        <component
          :is="AntdIcon['MenuUnfoldOutlined']"
          v-if="collapsed"
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        ></component>

        <component
          :is="AntdIcon['MenuFoldOutlined']"
          v-else
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        ></component>

        <div>
          <span>{{ Parse.User.current().get("username") }}</span>
          <a-popover placement="bottomRight">
            <template #content>
              <div style="display: flex; flex-direction: column">
                <a-button @click="loginOut()" style="margin-top: 10px">
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
                margin-left: 10px;
              "
              alt=""
            />
            <component
              v-else
              :is="AntdIcon['UserOutlined']"
              style="font-size: 24px; margin: 0 24px"
            ></component>
          </a-popover>
        </div>
      </a-layout-header>
      <a-layout-content
        :style="{
          margin: '24px 16px',
          padding: '24px',
          background: '#fff',
          minHeight: '280px',
        }"
      >
        <!--   <router-view></router-view> -->
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
    </a-layout>
  </a-layout>
</template>


<script setup>
import { Mixins } from "@/mixins/index";
import * as AntdIcon from "@ant-design/icons-vue";
import Parse from "parse";
import { computed, onMounted, ref } from "vue";
import store from "@/store";
const { toPage } = Mixins();
const selectedKeys = ref(["1"]);
const collapsed = ref(false);
const modules = computed(() => {
  return store.getters["GET_MODULES"];
});
if (!store.getters["GET_SCHEMAS"].length) {
  store.dispatch("SET_SCHEMAS");
}
const loginOut = async () => {
  await Parse.User.logOut();
  localStorage.clear();
  store.commit("SET_MODULES", []);
  toPage("/login");
};
</script>

<style lang="scss" scoped>
#components-layout-demo-custom-trigger .trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

#components-layout-demo-custom-trigger .trigger:hover {
  color: #1890ff;
}

#components-layout-demo-custom-trigger .logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
  margin: 16px;
}

.ant-layout {
  height: 100%;

  .ant-layout-content {
    height: 100%;
    overflow-y: scroll;
  }
  .logo {
    height: 60px;
  }

  .ant-layout-header {
    padding: 0 20px !important;
  }
}

.site-layout .site-layout-background {
  background: #fff;
}

.pageLoading {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>