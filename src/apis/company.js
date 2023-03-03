import {
  get,
  post,
  remove,
  put
} from "@/http/index";
/**
 * 所有公司列表
 * @path /findList
 * @method GET
 * @param isDelete
 * @returns {Pomise}
 */
export function findList({
  isDelete
}) {
  return new Promise((resolve, reject) => {
    get("/admin/company/findList", {
        isDelete
      })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
