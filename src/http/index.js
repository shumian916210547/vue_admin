import axios from "axios";
import store from "@/store";
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
const router = useRouter();

axios.defaults.timeout = 5000;
axios.defaults.baseURL = "http://localhost:3000";
let companyId = computed(() => {
  return store.getters["GETCURRENTCOMPANY"];
});
//http request 拦截器
axios.interceptors.request.use(
  (config) => {
    if (companyId) {
      config.data = Object.assign({}, config.data, {
        companyId: companyId.value,
      });
    }
    return config;
  },
  (error) => {}
);

//http response 拦截器
axios.interceptors.response.use(
  (response) => {
    if (response) {
      if (response.data.code == 200) {
        return response;
      } else {
      }
    } else {
    }
  },
  (error) => {}
);

/**
 * 封装get方法
 * @param url
 * @param data
 * @returns {Promise}
 */

export function get(url, params = {}) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        params: params,
      })
      .then((response) => {
        resolve(response?.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function post(url, data = {}) {
  return new Promise((resolve, reject) => {
    axios.post(url, data).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      }
    );
  });
}

/**
 * 封装patch请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function patch(url, data = {}) {
  return new Promise((resolve, reject) => {
    axios.patch(url, data).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      }
    );
  });
}

/**
 * 封装put请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function put(url, data = {}) {
  return new Promise((resolve, reject) => {
    axios.put(url, data).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      }
    );
  });
}

/**
 * 封装delete请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function remove(url, data) {
  return new Promise((resolve, reject) => {
    axios.delete(url, { data: data }).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      }
    );
  });
}
