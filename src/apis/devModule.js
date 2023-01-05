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
    get("/admin/devModule/findAll", { pageSize, pageNum, name })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 所有模块列表
 * @path /findList
 * @method GET
 * @returns {Pomise}
 */
export function findList() {
  return new Promise((resolve, reject) => {
    get("/admin/devModule/findList")
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
export function findById({ objectId }) {
  return new Promise((resolve, reject) => {
    get("/admin/devModule/findById", { objectId })
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
 * @param {String} name 模块名称
 * @param {String} user 模块所属用户
 * @param {Array} router 路由列表
 * @param {object} meta 模块参数
 * @returns {Promise}
 */
export function insertDevModule({ name, router, meta, user }) {
  return new Promise((resolve, reject) => {
    post("/admin/devModule/insertDevModule", { name, router, meta, user })
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
 * @param {String} user 模块所属用户
 * @param {String} name 模块名称
 * @param {Array} router 路由列表
 * @param {object} meta 模块参数
 * @returns {Promise}
 */
export function updateById({ objectId, name, router, meta, user }) {
  return new Promise((resolve, reject) => {
    put("/admin/devModule/updateById", { objectId, name, router, meta, user })
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
export function removeById({ objectId }) {
  return new Promise((resolve, reject) => {
    remove("/admin/devModule/removeById", { objectId })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
