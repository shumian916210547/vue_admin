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
    get("/devModule/findAll", { pageSize, pageNum })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 模块详情
 * @path /findById
 * @method GET
 * @param {String} objectId 模块Id
 * @returns {Promise}
 */
export function findById(params) {
  return new Promise((resolve, reject) => {
    get("/devModule/findById", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 新增模块
 * @path /insertDevModule
 * @method POST
 * @param {Object} meta 模块参数
 * @param {String} name 模块名称
 * @param {Array} routes 路由列表
 * @returns {Promise}
 */
export function insertDevModule(params) {
  return new Promise((resolve, reject) => {
    post("/devModule/insertDevModule", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 修改模块
 * @path /updateById
 * @method POST
 * @param {String} objectId 模块Id
 * @param {Object} meta 模块参数
 * @param {String} name 模块名称
 * @param {Array} routes 路由列表
 * @returns {Promise}
 */
export function updateById(params) {
  return new Promise((resolve, reject) => {
    put("/devModule/updateById", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 模块详情
 * @path /removeById
 * @method DELETE
 * @param {String} objectId 模块Id
 * @returns {Promise}
 */
export function removeById(params) {
  return new Promise((resolve, reject) => {
    remove("/devModule/removeById", params)
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
