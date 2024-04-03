import Parse from "parse";

/* 节点是否已选 */
export const isSelected = async (className, classField, selectId) => {
  const table = new Parse.Query(className);
  table.containedIn(classField, [selectId]);
  return await table.count();
};
