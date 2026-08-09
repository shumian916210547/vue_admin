import Parse from "@/service/parse-client";
import { Capture, FindList, handleParseError } from "@/service/service.config";
import { notification } from "ant-design-vue";

/* 搜索数据的方法 */
/**
 * 根据 Schema 字段类型选择 Parse 查询方法；未知字段类型回退为精确匹配以避免筛选页抛出运行时异常。
 * @param {{type?: string} | undefined} field 当前筛选字段的 Schema 配置，可为空。
 * @returns {"equalTo" | "containedIn" | "contains"} Parse Query 可调用的方法名。
 */
const matchMethod = (field) => {
  const method = {
    Pointer: "equalTo",
    Array: "containedIn",
    String: "contains",
    Boolean: "equalTo",
  };
  return method[field?.type] || "equalTo";
};

/**
 * 判断筛选值是否应发送给 BFF；保留 false 与 0 这两类合法业务筛选值。
 * @param {unknown} value 表单或查询状态中的筛选值。
 * @returns {boolean} 值不是 undefined、null 或空字符串时返回 true。
 */
const hasFilterValue = (value) => value !== undefined && value !== null && value !== "";

/* 查询所有数据 */
export const findAll = async (
  className,
  where = { company: sessionStorage.getItem("companyId") }
) => {
  const table = new Parse.Query(className == "_User" ? Parse.User : className);
  Object.keys(where).forEach((key) => {
    if (
      className != "AntdIcon" &&
      className != "UserLogs" &&
      className != "_Session" &&
      className != "Permission"
    ) {
      if (where[key]) table.equalTo(key, where[key]);
    }
  });
  table.limit(10000);
  table.descending("createdAt");
  table.includeAll();
  return (
    await table.find().catch((err) => {
      handleParseError(err);
    })
  )
    ?.filter((item) => {
      return item.id;
    })
    ?.map((item) => {
      return item.toJSON();
    });
};

/* 查询列表 */
export const findList = async (query, where = {}) => {
  const { className, pageSize, pageNum } = query;
  const filters = Object.assign({}, where, query.where);
  if (!className) return new FindList();
  const table = new Parse.Query(className == "_User" ? Parse.User : className);
  if (
    className != "AntdIcon" &&
    className != "UserLogs" &&
    className != "_Session"
  ) {
    table.equalTo("company", sessionStorage.getItem("companyId"));
  }
  Object.keys(filters).forEach((key) => {
    if (hasFilterValue(filters[key])) {
      table[matchMethod(query.filterFilds?.[key])](key, filters[key]);
    }
  });
  table.limit(pageSize || 200);
  table.skip((pageSize || 200) * (pageNum ? pageNum - 1 : 0));
  table.descending("createdAt");
  table.includeAll();
  try {
    const [records, count] = await Promise.all([table.find(), table.count()]);
    return new FindList(records.map((item) => item.toJSON()), count);
  } catch (error) {
    handleParseError(error);
    return new FindList();
  }
};

/* 查询字段 */
export const findSchema = async (query) => {
  const table = new Parse.Query("Schema");
  table.equalTo("name", query.className);
  table.includeAll();
  return await table.first().catch((err) => {
    handleParseError(err);
  });
};

/* 新增一行 */
export const InsertRow = async ({ className, fields, params }) => {
  const Table = Parse.Object.extend(className);
  const table = new Table();
  Object.keys(params).forEach((key) => {
    if (fields[key].type == "Pointer" && params[key]) {
      table.set(key, {
        __type: fields[key].type,
        className: fields[key].targetClass,
        objectId: params[key],
      });
    } else if (fields[key].type == "Array" && fields[key].isPointer) {
      table.set(
        key,
        params[key]?.map((item) => {
          return {
            __type: "Pointer",
            className: fields[key].targetClass,
            objectId: item,
          };
        })
      );
    } else {
      table.set(key, params[key]);
    }
  });
  if (sessionStorage.getItem("companyId")) {
    table.set("company", {
      __type: "Pointer",
      className: "Company",
      objectId: sessionStorage.getItem("companyId"),
    });
  }
  return await Capture(table.save()).then((success) => {
    notification.success({
      message: sessionStorage.getItem("pageName"),
      description:
        (success.get("name") || success.get("objectId")) + "新增成功",
      duration: 0.5,
    });
    /*  UpdateTablePermission(className, success) */
  });
};

/* 修改一行 */
export const UpdateById = async ({ className, fields, params }) => {
  const Table = new Parse.Query(className);
  Table.equalTo("objectId", params.objectId);
  const table = await Table.first();
  Object.keys(params).forEach((key) => {
    if (key !== "objectId") {
      if (fields[key].type == "Pointer" && params[key]) {
        table.set(key, {
          __type: fields[key].type,
          className: fields[key].targetClass,
          objectId: params[key],
        });
      } else if (fields[key].type == "Array" && fields[key].isPointer) {
        table.set(
          key,
          params[key]?.map((item) => {
            return {
              __type: "Pointer",
              className: fields[key].targetClass,
              objectId: item,
            };
          })
        );
      } else {
        table.set(key, params[key]);
      }
    }
  });
  if (sessionStorage.getItem("companyId")) {
    table.set("company", {
      __type: "Pointer",
      className: "Company",
      objectId: sessionStorage.getItem("companyId"),
    });
  }
  return await Capture(table.save()).then((success) => {
    notification.success({
      message: sessionStorage.getItem("pageName"),
      description:
        (success.get("name") || success.get("objectId")) + "修改成功",
      duration: 0.5,
    });
  });
};

/* 删除一行 */
export const removeById = async ({ className, objectId }) => {
  const Table = new Parse.Query(className);
  Table.equalTo("objectId", objectId);
  const table = await Table.first();
  return await Capture(table.destroy()).then((success) => {
    notification.success({
      message: sessionStorage.getItem("pageName"),
      description:
        (success.get("name") || success.get("objectId")) + "删除成功",
      duration: 0.5,
    });
  });
};
