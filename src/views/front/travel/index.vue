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
          <a-menu-item key="Home" @click="toPage('home')"> 首页 </a-menu-item>
          <a-menu-item key="Strategy" @click="toPage('strategy')">
            攻略
          </a-menu-item>
          <a-menu-item key="Note" @click="toPage('note')"> 社区 </a-menu-item>
        </a-menu>
      </div>
      <div class="right">
        <span @click="toPage('login')">登录</span>
        <span @click="toPage('register')">注册</span>
      </div>
    </header>
    <section>
      <router-view></router-view>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Mixins } from "@/mixins/index";
import { useRoute } from "vue-router";
const route = useRoute();
const { toPage } = Mixins();
document.title = "基于Vue.js的旅游信息分享网站";
const current = ref([route.name]);
</script>

<style lang="scss" scoped>
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