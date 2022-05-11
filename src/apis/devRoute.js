import { get, post, remove, put } from "@/http/index";

/**
 * 分页
 * @path /findAll
 * @method GET
 * @param {number} pageSize 默认10
 * @param {number} pageNum 默认1
 * @returns {Promise}
 */
export function findAll({ pageSize, pageNum }) {
  return new Promise((resolve, reject) => {
    get("/devRoute/findAll", { pageSize, pageNum })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 所有路由列表
 * @path /findList
 * @method GET
 * @returns {Pomise}
 */
export function findList() {
  return new Promise((resolve, reject) => {
    get("/devRoute/findList")
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 路由详情
 * @path /findById
 * @method GET
 * @param {String} objectId 路由Id
 * @returns {Promise}
 */
export function findById(params) {
  return new Promise((resolve, reject) => {
    get("/devRoute/findById", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 新增路由
 * @path /insertDevRoute
 * @method POST
 * @param {String} pagePath 页面路径
 * @param {String} name 路由名称
 * @param {String} path 路由路径
 * @returns {Promise}
 */
export function insertDevRoute(params) {
  return new Promise((resolve, reject) => {
    post("/devRoute/insertDevRoute", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 修改路由
 * @path /updateById
 * @method POST
 * @param {String} objectId 路由Id
 * @param {String} pagePath 页面路径
 * @param {String} name 路由名称
 * @param {String} path 路由路径
 * @returns {Promise}
 */
export function updateById(params) {
  return new Promise((resolve, reject) => {
    put("/devRoute/updateById", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 路由详情
 * @path /removeById
 * @method DELETE
 * @param {String} objectId 路由Id
 * @returns {Promise}
 */
export function removeById(params) {
  return new Promise((resolve, reject) => {
    remove("/devRoute/removeById", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
