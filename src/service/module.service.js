import Parse from "parse";
import { Capture } from "./service.config";

/* 新增路由 */
export const InsertRoute = async ({
  name,
  path,
  pageComponent,
  targetClass,
  rank,
  menu,
  remark,
}) => {
  const Table = Parse.Object.extend("Route");
  const table = new Table();
  table.set("name", name);
  table.set("path", path);
  table.set("rank", rank);
  table.set("menu", menu);
  table.set("remark", remark);
  table.set("pageComponent", pageComponent);
  table.set("targetClass", targetClass);
  if (sessionStorage.getItem("companyId")) {
    table.set("company", {
      __type: "Pointer",
      className: "Company",
      objectId: sessionStorage.getItem("companyId"),
    });
  }
  return await table.save();
};

/* 修改路由 */
export const UpdateRoute = async ({
  objectId,
  name,
  path,
  pageComponent,
  targetClass,
  rank,
  menu,
  remark,
}) => {
  const Table = new Parse.Query("Route");
  Table.equalTo("objectId", objectId);
  const table = await Table.first();
  table.set("name", name);
  table.set("path", path);
  table.set("rank", rank);
  table.set("menu", menu);
  table.set("remark", remark);
  table.set("pageComponent", pageComponent);
  table.set("targetClass", targetClass);
  return await Capture(table.save());
};

/* 删除路由 */
export const DeleteRoute = async ({ objectId }) => {
  const Table = new Parse.Query("Route");
  Table.equalTo("objectId", objectId);
  const table = await Table.first();
  return await Capture(table.destroy());
};

/* 模块新增路由 */
export const UpdateById = async (moduleId, route) => {
  const Module = new Parse.Query("Module");
  Module.equalTo("objectId", moduleId);
  const module = await Module.first();
  const routeId = (await InsertRoute(route)).id;
  let routes = module.get("routes") || [];
  routes.push({
    __type: "Pointer",
    className: "Route",
    objectId: routeId,
  });
  module.set("routes", routes);
  return await Capture(module.save());
};

/* 模块删除路由 */
export const ModuleUpdateRoute = async (moduleId, routes) => {
  const Module = new Parse.Query("Module");
  Module.equalTo("objectId", moduleId);
  const module = await Module.first();
  module.set("routes", routes);
  return await Capture(module.save());
};
