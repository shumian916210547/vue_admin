import { get, post, remove, put } from "@/http/index";
/**
 * 用户登录
 * @path /admin/user/loggingIn
 * @method POST
 * @param username 用户名
 * @param password 用户密码
 * @returns {Pomise}
 */
export function loggingIn({ username, password }) {
  return new Promise((resolve, reject) => {
    post("/admin/user/loggingIn", { username, password })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
