import { get, post, remove, put } from "@/http/index";

/**
 * 分页列表
 * @path /findAll
 * @method GET
 * @returns {Pomise}
 */
export function findAll({ className, pageNum, pageSize, name, companyId }) {
  return new Promise((resolve, reject) => {
    get("/cmn/findAll", { className, pageNum, pageSize, name, companyId })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 所有列表
 * @path /findList
 * @method GET
 * @returns {Pomise}
 */
export function findList({ className, name, companyId }) {
  return new Promise((resolve, reject) => {
    get("/cmn/findList", { className, name, companyId })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 删除
 * @path /removeById
 * @method DELETE
 * @returns {Pomise}
 */
export function removeById({ className, companyId, objectId }) {
  return new Promise((resolve, reject) => {
    remove("/cmn/removeById", { className, companyId, objectId })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
