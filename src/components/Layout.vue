<template>
  <component
    :AntdIcon="AntdIcon"
    :systemOptions="systemOptions"
    :is="LayoutComponents[systemOptions.layout]"
    :key="systemOptions.showTags"
  >
    <template #layout-content>
      <a-layout-content
        :style="{
          margin:
            systemOptions.layout == 'TopLayout' ? '24px 16px' : '24px 16px',
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
        v-if="systemOptions.showLogo"
        class="logo"
        :style="{
          width: systemOptions.layout == 'TopLayout' ? '200px' : 'auto',
          padding: systemOptions.layout == 'TopLayout' ? '4px 0' : '4px 0 0 0',
        }"
      >
        <img
          v-if="systemOptions.logoURL"
          :src="systemOptions.logoURL"
          alt=""
          style="height: 100%; width: 100%; object-fit: contain"
        />
      </div>
      <a-menu
        v-model:openKeys="openKeys"
        v-model:selectedKeys="selectedKeys"
        :theme="systemOptions.theme"
        :mode="systemOptions.layout == 'TopLayout' ? 'horizontal' : 'inline'"
        :style="
          systemOptions.layout == 'TopLayout'
            ? { width: '70%' }
            : { with: 'auto' }
        "
        @openChange="openChange"
      >
        <template v-for="item in modules">
          <template v-if="item.children">
            <a-sub-menu :key="'sub' + item.objectId" :hidden="!item.menu">
              <template #title>
                <span>
                  <component :is="AntdIcon[item.meta.icon]"></component>
                  <span>{{ item.name }}</span>
                </span>
              </template>
              <template
                v-for="chil in item.children"
                :key="'chil' + chil.objectId"
              >
                <a-menu-item
                  :hidden="!chil.menu"
                  @click="
                    toPage(
                      '/' + item.path + '/' + chil.path,
                      'chil' + chil.objectId,
                      chil.name
                    )
                  "
                >
                  {{ chil.name }}
                </a-menu-item>
              </template>
            </a-sub-menu>
          </template>
          <template v-else>
            <a-menu-item
              :key="item.objectId"
              @click="toPage('/' + item.path, item.objectId, item.name)"
              v-if="item.menu"
            >
              <component :is="AntdIcon[item?.meta?.icon]"></component>
              <span>{{ item.name }}</span>
            </a-menu-item>
          </template>
        </template>
      </a-menu>
    </template>

    <template #layout-header-right>
      <div style="display: flex; align-items: center; min-width: 88px">
        <!-- 主题配置 -->
        <a-tooltip placement="bottom">
          <template #title>
            <span>主题配置</span>
          </template>
          <component
            :is="AntdIcon['SkinOutlined']"
            class="mini_btn"
            @click="() => (systemModal.show = true)"
          ></component>
        </a-tooltip>

        <template v-if="systemOptions.fullScreen">
          <!-- 全屏 -->
          <a-tooltip placement="bottom" v-if="!isFullScreen">
            <template #title>
              <span>全屏</span>
            </template>
            <component
              :is="AntdIcon['ExpandOutlined']"
              class="mini_btn"
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
              class="mini_btn"
              @click="zoomPage"
            ></component>
          </a-tooltip>
        </template>

        <!-- 刷新按钮 -->
        <a-tooltip placement="bottom" v-if="systemOptions.refresh">
          <template #title>
            <span>刷新</span>
          </template>
          <component
            :is="AntdIcon['ReloadOutlined']"
            class="mini_btn"
            @click="pageReload"
          ></component>
        </a-tooltip>

        <a-popover placement="bottomRight">
          <template #content>
            <div style="display: flex; flex-direction: column">
              <a-button
                @click="
                  toPage('/personalCenter', 'personalCenter', '个人中心'),
                    recoverMenuStatus()
                "
                style="margin-top: 10px"
              >
                个人中心
              </a-button>
              <a-button @click="loginOut" style="margin-top: 10px">
                退出登录
              </a-button>
            </div>
          </template>
          <div class="header-right">
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
            <component
              :is="AntdIcon['DownOutlined']"
              class="mini_btn"
              style="margin-left: 10px"
            ></component>
          </div>
        </a-popover>
      </div>
    </template>

    <template #layout-tags v-if="systemOptions.showTags">
      <div
        class="tags-view"
        :style="{
          padding:
            systemOptions.layout == 'TopLayout' ? '4px 0 4px 0px' : '4px 10px',
          marginLeft: systemOptions.layout == 'TopLayout' ? '200px' : '0',
        }"
      >
        <template v-for="(item, index) in historyPage" :key="item.pageKey">
          <a-tag
            :color="item.pageKey == selectedKeys[0] ? '#108ee9' : '#87d068'"
            :id="item.pageKey"
            @click="handleTag(item)"
            closable
            @close="removeHistoryRoute(index)"
          >
            {{ item.pageName }}
          </a-tag>
        </template>
      </div>
    </template>
  </component>

  <!-- 设置弹窗 -->
  <a-drawer
    v-model:visible="systemModal.show"
    title="主题配置"
    placement="right"
    width="300"
  >
    <a-form
      :model="systemOptions"
      name="basic"
      :label-col="{ span: 10 }"
      :wrapper-col="{ span: 14 }"
      autocomplete="off"
      labelAlign="left"
    >
      <a-form-item label="布局">
        <a-select
          v-model:value="systemOptions.layout"
          @change="onChange"
          style="width: 120px"
        >
          <a-select-option value="LeftLayout">纵向</a-select-option>
          <a-select-option value="TopLayout">横向</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="主题">
        <a-select
          v-model:value="systemOptions.theme"
          @change="onChange"
          style="width: 120px"
        >
          <a-select-option value="light">light</a-select-option>
          <a-select-option value="dark">dark</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="图标">
        <a-switch
          v-model:checked="systemOptions.showLogo"
          checked-children="开"
          un-checked-children="关"
          @change="onChange"
        />
      </a-form-item>

      <a-form-item label="资源" v-if="systemOptions.showLogo">
        <component
          v-model:files="systemOptions.logoURL"
          :maxLength="1"
          @change="onChange"
          fileType="image/*"
          :is="Upload"
        ></component>
      </a-form-item>

      <a-form-item label="标签">
        <a-switch
          v-model:checked="systemOptions.showTags"
          checked-children="开"
          un-checked-children="关"
          @change="onChange"
        />
      </a-form-item>

      <a-form-item label="刷新">
        <a-switch
          v-model:checked="systemOptions.refresh"
          checked-children="开"
          un-checked-children="关"
          @change="onChange"
        />
      </a-form-item>

      <a-form-item label="全屏">
        <a-switch
          v-model:checked="systemOptions.fullScreen"
          checked-children="开"
          un-checked-children="关"
          @change="onChange"
        />
      </a-form-item>
    </a-form>
  </a-drawer>
</template>


<script setup>
import { Mixins } from "@/mixins/index";
import * as AntdIcon from "@ant-design/icons-vue";
import LeftLayout from "./LeftLayout.vue";
import TopLayout from "./TopLayout.vue";
import Upload from "./Upload.vue";
import Parse from "parse";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import store from "@/store";
import { arrayImgsToString } from "@/utils/utils";

const { toPage, historyPage, removeHistoryRoute } = Mixins();

const LayoutComponents = {
  LeftLayout,
  TopLayout,
};

const openKeys = ref([]);
const selectedKeys = ref([""]);

/* menu 打开/关闭回掉 */
const openChange = (keys) => {
  sessionStorage.setItem("openKeys", JSON.stringify(keys));
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
      showLogo: true,
      logoURL: "",
      showTags: true,
      refresh: true,
      fullScreen: true,
    },
    Parse.User.current().get("systemOptions")
  )
);
/* 恢复菜单栏状态 */
const recoverMenuStatus = () => {
  openKeys.value = JSON.parse(sessionStorage.getItem("openKeys")) || [];
  selectedKeys.value = [sessionStorage.getItem("pageKey") || ""];
};
watch(
  systemOptions,
  (n) => {
    if (n.layout == "TopLayout") {
      openKeys.value = [];
    } else {
      recoverMenuStatus();
    }
  },
  { deep: true, immediate: true }
);

const modules = computed(() => {
  return store.getters["GET_MODULES"];
});

const isFullScreen = ref(false);

/* 系统配置改变 */
const onChange = () => {
  if (typeof systemOptions.logoURL == "object")
    systemOptions.logoURL = arrayImgsToString(systemOptions.logoURL, "url");
  const user = Parse.User.current();
  user.set(
    "systemOptions",
    Object.assign({}, user.get("systemOptions"), systemOptions)
  );
  setIcon();
  user.save();
};

const setIcon = () => {
  const link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "shortcut icon";
  link.href = systemOptions.logoURL;
  document.getElementsByTagName("head")[0].appendChild(link);
};

/* tag点击 */
const handleTag = (ev) => {
  toPage(ev.path, ev.pageKey, ev.pageName);
  selectedKeys.value = [sessionStorage.getItem("pageKey")];
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

onMounted(() => {
  setIcon();
  recoverMenuStatus();
});

onUnmounted(() => {
  document.onfullscreenchange = undefined;
});
</script>

<style lang="scss">
@import "@/assets/scss/Layout.scss";

.mini_btn {
  font-size: 12px;
  color: gray;
  margin-right: 20px;
  transition: 0.3s ease-in-out;
}

.header-right {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  min-width: 138px;
}

.header-right:hover .mini_btn {
  transform: rotate(180deg);
}

.tags-view {
  display: flex;
  align-items: center;
  /* height: 80px; */
  overflow-x: auto;
  /* width: 70%; */
  transition: 0.3s ease-in-out;

  .ant-tag {
    height: 30px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
}

.ant-drawer .ant-form-item-control-input-content {
  display: flex;
  justify-content: flex-end;
}
</style>