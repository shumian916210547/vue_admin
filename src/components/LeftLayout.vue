<template>
  <a-layout>
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      :theme="props.systemOptions.theme"
      collapsible
    >
      <div class="logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        :theme="props.systemOptions.theme"
        mode="inline"
      >
        <template v-for="item in props.modules">
          <template v-if="item.children">
            <a-sub-menu :key="'sub' + item.objectId">
              <template #title>
                <span>
                  <component :is="props.AntdIcon[item.meta.icon]"></component>
                  <span>{{ item.name }}</span>
                </span>
              </template>

              <a-menu-item
                v-for="chil in item.children"
                :key="'chil' + chil.objectId"
                @click="emit('toPage', '/' + item.path + '/' + chil.path)"
              >
                {{ chil.name }}
              </a-menu-item>
            </a-sub-menu>
          </template>
          <template v-else>
            <a-menu-item
              :key="item.objectId"
              @click="emit('toPage', '/' + item.path)"
            >
              <component :is="props.AntdIcon[item.meta.icon]"></component>
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
          :is="props.AntdIcon['MenuFoldOutlined']"
          v-else
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        ></component>

        <div>
          <span>{{ UserInfo.get("name") }}</span>
          <a-popover placement="bottomRight">
            <template #content>
              <a-button @click="emit('setting')" style="margin-top: 10px" block>
                设置
              </a-button>
              <div style="display: flex; flex-direction: column">
                <a-button @click="emit('loginOut')" style="margin-top: 10px">
                  退出登录
                </a-button>
              </div>
            </template>
            <img
              v-if="UserInfo.get('avatar')"
              :src="UserInfo.get('avatar')"
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
              :is="props.AntdIcon['UserOutlined']"
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
import { ref } from "vue";

const props = defineProps({
  systemOptions: {
    type: Object,
    default: () => {},
    required: true,
  },
  modules: {
    type: Array,
    default: () => [],
    required: true,
  },
  AntdIcon: {
    type: Object,
    default: () => {},
    required: true,
  },
  UserInfo: {
    type: Object,
    default: () => {},
    required: true,
  },
});
const selectedKeys = ref(["1"]);
const collapsed = ref(false);
const emit = defineEmits(["toPage", "loginOut", "setting"]);
</script>

<style lang="scss" scoped>
@import "@/assets/scss/Layout.scss";
</style>