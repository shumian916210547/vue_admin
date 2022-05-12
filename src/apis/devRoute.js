import { get, post, remove, put } from "@/http/index";

/**
 * 分页
 * @path /findAll
 * @method GET
 * @param {number} pageSize 默认10
 * @param {number} pageNum 默认1
 * @returns {Promise}
 */
export function findAll({ pageSize, pageNum, name }) {
  return new Promise((resolve, reject) => {
    get("/devRoute/findAll", { pageSize, pageNum, name })
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
export function findById({ objectId }) {
  return new Promise((resolve, reject) => {
    get("/devRoute/findById", { objectId })
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
export function insertDevRoute({ pagePath, name, path }) {
  return new Promise((resolve, reject) => {
    post("/devRoute/insertDevRoute", { pagePath, name, path })
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
export function updateById({ objectId, pagePath, name, path }) {
  return new Promise((resolve, reject) => {
    put("/devRoute/updateById", { objectId, pagePath, name, path })
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
export function removeById({ objectId }) {
  return new Promise((resolve, reject) => {
    remove("/devRoute/removeById", { objectId })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
