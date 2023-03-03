import {
  get,
  post,
  remove,
  put
} from "@/http/index";

/**
 * 分页列表
 * @path /findAll
 * @method GET
 * @returns {Pomise}
 */
export function findAll({
  className,
  pageNum,
  pageSize,
  name,
  companyId
}) {
  return new Promise((resolve, reject) => {
    get("/cmn/findAll", {
        className,
        pageNum,
        pageSize,
        name,
        companyId
      })
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
export function findList({
  className,
  name,
  companyId
}) {
  return new Promise((resolve, reject) => {
    get("/cmn/findList", {
        className,
        name,
        companyId
      })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 插入
 * @path /insert
 * @method POST
 * @returns {Pomise}
 */
export function insert({
  className,
  companyId,
  params
}) {
  return new Promise((resolve, reject) => {
    post("/cmn/insert", {
        className,
        companyId,
        params
      })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 批量插入
 * @path /insertList
 * @method POST
 * @returns {Pomise}
 */
export function insertList({
  className,
  companyId,
  columns,
  columnsData
}) {
  return new Promise((resolve, reject) => {
    post("/cmn/insertList", {
        className,
        companyId,
        columns,
        columnsData
      })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 更新
 * @path /updateById
 * @method PUT
 * @returns {Pomise}
 */
export function updateById({
  className,
  companyId,
  params,
  objectId
}) {
  return new Promise((resolve, reject) => {
    put("/cmn/updateById", {
        className,
        companyId,
        params,
        objectId
      })
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
export function removeById({
  className,
  companyId,
  objectId
}) {
  return new Promise((resolve, reject) => {
    remove("/cmn/removeById", {
        className,
        companyId,
        objectId
      })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 文件上传
 * @path / uploadFile
 * @method post
 * @returns {Pomise}
 */
export function uploadFile(param) {
  return new Promise((resolve, reject) => {
    post("/cmn/uploadFile", {
        file: param
      })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
