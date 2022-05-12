import { get, post, remove, put } from "@/http/index";
/**
 * 所有公司列表
 * @path /findList
 * @method GET
 * @returns {Pomise}
 */
export function findList() {
  return new Promise((resolve, reject) => {
    get("/company/findList")
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
