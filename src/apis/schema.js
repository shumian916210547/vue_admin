import { get, post, remove, put } from "@/http/index";
/**
 * 所有schema列表
 * @path /findList
 * @method GET
 * @returns {Pomise}
 */
export function findList() {
  return new Promise((resolve, reject) => {
    get("/admin/schema/findList")
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 新增Schema
 * @path /insertSchema
 * @method POST
 * @param {String} name Schema名称
 * @returns {Promise}
 */
export function insertSchema({ name }) {
  return new Promise((resolve, reject) => {
    post("/admin/schema/insertSchema", { name })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}

/**
 * 更新Schema
 * @path /updateById
 * @method PUT
 * @returns {Promise}
 */
export function updateById({
  name,
  type,
  required,
  chineseName,
  targetClass,
  schemaId,
  defaultValue,
  editComponent,
  dataSource,
}) {
  return new Promise((resolve, reject) => {
    put("/admin/schema/updateById", {
      name,
      type,
      required,
      chineseName,
      targetClass,
      schemaId,
      defaultValue,
      editComponent,
      dataSource,
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
 * 删除Schema字段
 * @path /removeFields
 * @method DELETE
 * @returns {Promise}
 */
export function removeFields({ schemaId, fieldsName }) {
  return new Promise((resolve, reject) => {
    remove("/admin/schema/removeFields", {
      schemaId,
      fieldsName,
    })
      .then((result) => {
        resolve(result);
      })
      .then((err) => {
        reject(err);
      });
  });
}
