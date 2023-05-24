<template>
  <div class="login">
    <a-form
      :model="formState"
      name="basic"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
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
      >
        <a-input-password v-model:value="formState.password" />
      </a-form-item>

      <a-form-item name="remember" :wrapper-col="{ offset: 8, span: 16 }">
        <a-checkbox v-model:checked="formState.remember"
          >Remember me</a-checkbox
        >
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
        <a-button type="primary" html-type="submit">Submit</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script>
import { defineComponent, onMounted, reactive } from "vue";
import { loggingIn } from "@/apis/user";
import { notification } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
export default defineComponent({
  setup() {
    const router = useRouter();
    const store = useStore();
    const formState = reactive({
      username: "",
      password: "",
      remember: false,
    });

    const onFinish = async (values) => {
      let { code, data, msg } = await loggingIn(values);
      if (code == 200) {
        sessionStorage.setItem("token", data.sessionToken);
        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({
            userid: data.objectId,
            username: data.username,
          })
        );
        store.commit("SETMODULES", data.modules);
        notification["success"]({
          message: "提醒",
          description: "登录成功",
        });

        document.title = data.company.name;
        if (formState.remember) {
          localStorage.setItem(
            "To",
            JSON.stringify({
              username: values.username,
              password: values.password,
            })
          );
        }
        router.push("/home");
      } else {
        notification["error"]({
          message: "提醒",
          description: msg,
        });
      }
    };

    const onFinishFailed = (errorInfo) => {};

    onMounted(() => {
      if (localStorage.getItem("To")) {
        formState.remember = true;
        onFinish(JSON.parse(localStorage.getItem("To")));
      }
    });

    return {
      formState,
      onFinish,
      onFinishFailed,
    };
  },
});
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
