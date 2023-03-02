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


/**
 * 用户注册
 * @path /admin/user/signUp
 * @method POST
 * @param username 用户名
 * @param password 用户密码
 * @param email
 * @param companyId
 * @param identity
 * @param nickname
 * @returns {Pomise}
 */
export function signUp({ username, password, email, companyId, identity, nickname }) {
  return new Promise((resolve, reject) => {
    post("/admin/user/signUp", { username, password, email, companyId, identity, nickname })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}








