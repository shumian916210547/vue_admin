import axios from "axios";
import store from "@/store";
import { notification } from "ant-design-vue";
import {
    useRoute,
    useRouter
} from "vue-router";
import {
    computed
} from "vue";
const router = useRouter();

axios.defaults.timeout = 5000;
axios.defaults.baseURL = process.env.VUE_APP_BASE_API;
let companyId = computed(() => {
    return store.getters["GETCURRENTCOMPANY"];
});
//http request 拦截器
axios.interceptors.request.use(
    (config) => {
        if (config.url.includes('/findAll')) {
            store.commit('SETLOADING', true)
        }
        config.headers = Object.assign({}, config.headers, { Authorization: sessionStorage.getItem('token') ? 'Bearer ' + sessionStorage.getItem('token') : '', })
        return config;
    },
    (error) => { }
);

//http response 拦截器
axios.interceptors.response.use(
    (response) => {
        store.commit('SETLOADING', false)
        if (response) {
            if (response.data.code == 200) {
                return response;
            } else {
                notification["error"]({
                    message: "错误",
                    description: response.data.msg,
                });

            }
        } else { }
        return response;
    },
    (error) => {
        store.commit('SETLOADING', false)
    }
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
                params: Object.assign(params, {
                    companyId: companyId.value,
                    userid: JSON.parse(sessionStorage.getItem("userInfo"))?.userid
                }),
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
        axios
            .post(
                url,
                Object.assign(data, {
                    companyId: companyId.value,
                    userid: JSON.parse(sessionStorage.getItem("userInfo"))?.userid
                })
            )
            .then(
                (response) => {
                    resolve(response?.data);
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
        axios
            .patch(
                url,
                Object.assign(data, {
                    companyId: companyId.value,
                    userid: JSON.parse(sessionStorage.getItem("userInfo"))?.userid
                })
            )
            .then(
                (response) => {
                    resolve(response?.data);
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
        axios
            .put(
                url,
                Object.assign(data, {
                    companyId: companyId.value,
                    userid: JSON.parse(sessionStorage.getItem("userInfo"))?.userid
                })
            )
            .then(
                (response) => {
                    resolve(response?.data);
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
        axios
            .delete(url, {
                data: Object.assign(data, {
                    companyId: companyId.value,
                    userid: JSON.parse(sessionStorage.getItem("userInfo"))?.userid
                }),
            })
            .then(
                (response) => {
                    resolve(response?.data);
                },
                (err) => {
                    reject(err);
                }
            );
    });
}
