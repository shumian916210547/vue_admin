<template>
  <div class="login">
    <a-form
      :model="formState"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
      ref="form"
    >
      <a-form-item
        label="Username"
        name="username"
        :rules="[{ required: true, message: 'Please input your username!' }]"
      >
        <a-input v-model:value="formState.username" />
      </a-form-item>

      <a-form-item
        label="Password"
        name="password"
        :rules="[{ required: true, message: 'Please input your password!' }]"
        style="margin-bottom: 4px"
      >
        <a-input-password v-model:value="formState.password" />
      </a-form-item>

      <a-form-item
        :wrapper-col="{ offset: 20, span: 4 }"
        style="margin-bottom: 0"
      >
        <a @click="toPage('/front/travel/register')">立即注册</a>
      </a-form-item>
      <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
        <a-button type="primary" html-type="submit">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script setup>
import Parse from "parse";
import { notification } from "ant-design-vue";
import { reactive, ref } from "vue";
import { Mixins } from "@/mixins";
const { toPage } = Mixins();
const form = ref();
const formState = reactive({
  username: "",
  password: "",
  remember: false,
});

document.title = "登录";

const onFinish = () => {
  Promise.all([form.value.validate()])
    .then((success) => {
      toLogin(success[0]);
    })
    .catch((error) => {
      console.log(error);
    });
};

const toLogin = async (arg) => {
  try {
    const user = await Parse.User.logIn(arg.username, arg.password);
    const query = new Parse.Query(Parse.User);
    query.equalTo("objectId", user.id);
    query.includeAll();
    const result = (await query.first()).toJSON();
    localStorage.setItem("role", JSON.stringify(result.role));
    sessionStorage.setItem(
      "userInfo",
      JSON.stringify(Parse.User.current().toJSON())
    );
    toPage("/front/travel/home");
  } catch (error) {
    notification.error({ message: error.toString() || error });
  }
};

const onFinishFailed = () => {};
</script>
  
<style lang="scss" scoped>
.login {
  height: 100vh;
  width: 100%;
  background-image: url("https://preview.pro.antdv.com/assets/background.ebcb9160.svg");
  background-size: contain;
  display: flex;
  justify-content: center;
  align-items: center;

  form {
    width: 550px;
    height: 500px;
  }
}
</style>
  