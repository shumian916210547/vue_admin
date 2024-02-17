<template>
  <div class="travel">
    <header v-if="route.name != 'Login' && route.name != 'Register'">
      <div class="left">
        <img
          style="width: 100%; object-fit: cover; height: 100%"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGaaLSM0dkOWaJ1NseGhAMp049j9PlZQe-AA&usqp=CAU"
          alt=""
        />
      </div>
      <div class="mid">
        <a-menu v-model:selectedKeys="current" mode="horizontal">
          <a-menu-item key="Home" @click="toPage('/front/travel/home')">
            首页
          </a-menu-item>
          <a-menu-item key="Strategy" @click="toPage('/front/travel/strategy')">
            旅游攻略
          </a-menu-item>
          <a-menu-item key="Note" @click="toPage('/front/travel/note')">
            旅游手记
          </a-menu-item>
        </a-menu>
      </div>
      <div class="right">
        <template v-if="userInfo">
          <a-popover placement="bottomRight">
            <template #content>
              <a-button
                @click="toPage('/front/travel/my')"
                style="margin-top: 10px"
              >
                个人中心
              </a-button>
              <div style="display: flex; flex-direction: column">
                <a-button @click="loginOut" style="margin-top: 10px">
                  退出登录
                </a-button>
              </div>
            </template>
            <div class="header-right">
              <img
                v-if="userInfo.avatar"
                :src="userInfo.avatar"
                style="
                  height: 34px;
                  width: 34px;
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
              <span>{{ userInfo.name }}</span>
              <component
                :is="AntdIcon['DownOutlined']"
                class="mini_btn"
                style="margin-left: 10px"
              ></component>
            </div>
          </a-popover>
        </template>
        <template v-else>
          <span @click="toPage('/front/travel/login')">登录</span>
          <span @click="toPage('/front/travel/register')">注册</span>
        </template>
      </div>
    </header>
    <section>
      <router-view></router-view>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import * as AntdIcon from "@ant-design/icons-vue";
import { Mixins } from "@/mixins/index";
import { useRoute } from "vue-router";
import Parse from "parse";
const route = useRoute();
const { toPage } = Mixins();
document.title = "基于Vue.js的旅游信息分享网站";
const current = ref([route.name]);
const userInfo = ref();
watch(route, () => {
  document.title = "基于Vue.js的旅游信息分享网站";
  userInfo.value = JSON.parse(sessionStorage.getItem("userInfo"));
});
const loginOut = async () => {
  await Parse.User.logOut();
  toPage("/front/travel/home");
  location.reload();
  sessionStorage.clear();
  localStorage.clear();
};
onMounted(() => {
  userInfo.value = JSON.parse(sessionStorage.getItem("userInfo"));
});
</script>

<style lang="scss" scoped>
.travel {
  padding: 46px 0 0 0;
  position: relative;
}
section,
header {
  width: 920px;
  margin: 0 auto;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 46px;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  background: white;
  .mid {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .right,
  .left {
    width: 200px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .right {
    color: #f8d289;
    letter-spacing: 2px;
    cursor: pointer;
    span:nth-child(1) {
      margin-right: 10px;
    }

    span:hover {
      color: red;
    }
  }
}
</style>