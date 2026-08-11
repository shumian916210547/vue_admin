import { Capture, handleParseError } from "@/service/service.config";
import { ElNotification } from "element-plus";
import Parse from "@/service/parse-client";
export const defaultFields = [
  {
    fieldName: "objectId",
    type: "String",
    fieldOption: {
      required: false,
      chineseName: "对象ID",
      editComponent: "ElInput",
      isTable: false,
      componentOption: {
        disabled: true,
        allowClear: false,
        placeholder: "",
      },
    },
  },
  {
    fieldName: "company",
    type: "Pointer",
    fieldOption: {
      isTable: false,
      isFilter: false,
      required: true,
      chineseName: "公司",
      targetClass: "Company",
      editComponent: "ElSelect",
      componentOption: {
        mode: "combobox",
        disabled: false,
        labelKey: "name",
        valueKey: "objectId",
        allowClear: false,
        placeholder: "请输入内容",
        selectTable: "Company",
      },
    },
  },
  {
    fieldName: "createdAt",
    type: "Date",
    fieldOption: {
      required: false,
      chineseName: "创建时间",
      editComponent: "ElInput",
      isTable: false,
      componentOption: {
        disabled: true,
        allowClear: false,
        placeholder: "",
      },
    },
  },
  {
    fieldName: "updatedAt",
    type: "Date",
    fieldOption: {
      required: false,
      chineseName: "修改时间",
      editComponent: "ElInput",
      isTable: false,
      componentOption: {
        disabled: true,
        allowClear: false,
        placeholder: "",
      },
    },
  },
];

/**
 * 组织范围业务表的标准字段定义。字段名必须固定为 organization，后端据此识别并执行组织树、
 * 成员管理范围以及启用状态校验；任何改名都会使该表失去组织级数据隔离。
 * @type {{fieldName: "organization", type: "Pointer", fieldOption: {required: boolean, chineseName: string, targetClass: "Organization", editComponent: "ElSelect", isFilter: boolean, isTable: boolean, componentOption: Record<string, unknown>}}}
 */
export const organizationScopeField = {
  fieldName: "organization",
  type: "Pointer",
  fieldOption: {
    required: true,
    chineseName: "所属组织",
    targetClass: "Organization",
    editComponent: "ElSelect",
    isFilter: true,
    isTable: true,
    componentOption: {
      mode: undefined,
      disabled: false,
      labelKey: "name",
      valueKey: "objectId",
      allowClear: false,
      placeholder: "请选择所属组织",
      selectTable: "Organization",
    },
  },
};

/* 更新所有表格权限 */
export const UpdateTablePermission = async (className, arg2) => {
  const schema = new Parse.Schema(className);
  const clp = new Parse.CLP(arg2);
  schema.setCLP(clp);
  return await Capture(schema.update());
};

const parseStructuredDefaultValue = (fieldType, value) => {
  if (!["Object", "Array"].includes(fieldType) || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Object and Array default values must be valid JSON");
  }
};

/* 获取所有schema列表（包含系统schema） */
export const loadAllSchema = async () => {
  return await Parse.Schema.all().catch((err) => {
    handleParseError(err);
  });
};

/* 获取所有schema */
export const loadSchemas = async (query) => {
  return await GetSchemaList(query);
};

/**
 * 创建业务数据表及其 Schema 元数据；启用组织范围时同时创建不可改名的 organization Pointer 字段。
 * @param {{className: string, nickName: string, organizationScoped?: boolean}} input 数据表表单数据；organizationScoped 为 true 时按组织树隔离业务数据。
 * @returns {Promise<import("@/service/parse-client").ParseObject>} 已创建的 Schema 元数据对象，供调用方生成默认路由。
 * @throws {Error} 表名无效、组织基础设施未就绪或任一受控 Schema 请求失败时向页面抛出异常。
 */
export const createSchema = async ({ className, nickName, organizationScoped = false }) => {
  const table = new Parse.Schema(className);
  table.addPointer("company", "Company");
  if (organizationScoped) table.addPointer("organization", "Organization");
  await Capture(table.save());
  return await InsertSchema(className, nickName, organizationScoped);
};

/* 新增字段 */
export const addField = async (
  className,
  fieldType,
  fieldName,
  fieldOption
) => {
  const table = new Parse.Schema(className);
  fieldOption.defaultValue = parseStructuredDefaultValue(
    fieldType,
    fieldOption.defaultValue
  );
  table.addField(fieldName, fieldType, fieldOption);
  await Capture(table.update());
  return await UpdateSchema(className, fieldType, fieldName, fieldOption);
};

/* 重新建立相同字段（修改字段） */
export const updateField = async (
  className,
  fieldType,
  fieldName,
  fieldOption
) => {
  const table = new Parse.Schema(className);
  table.deleteField(fieldName);
  await table.update();
  const table2 = new Parse.Schema(className);
  fieldOption.defaultValue = parseStructuredDefaultValue(
    fieldType,
    fieldOption.defaultValue
  );
  table2.addField(fieldName, fieldType, fieldOption);
  return await Capture(table2.update()).then((success) => {
    UpdateSchema(className, fieldType, fieldName, fieldOption);
  });
};

/* 删除字段 */
export const removeField = async (className, fieldName) => {
  const table = new Parse.Schema(className);
  table.deleteField(fieldName);
  await Capture(table.update());
  return await RemoveTableField(className, fieldName);
};

/* 删除schema */
export const removeSchema = async (className) => {
  const table = new Parse.Schema(className);
  await table.purge();
  await Capture(table.delete());
  return await RemoveTable(className);
};

const GetSchemaList = async (query) => {
  const Schema = new Parse.Query("Schema");
  Schema.contains("name", query.name);
  if (sessionStorage.getItem("companyId"))
    Schema.equalTo("company", sessionStorage.getItem("companyId"));
  Schema.descending("createdAt");
  return (
    await Schema.find().catch((err) => {
      handleParseError(err);
    })
  )?.map((item) => item.toJSON());
};

/**
 * 写入一张业务表的低代码展示元数据，并同步补齐平台字段与可选组织归属字段。
 * @param {string} className 已成功创建的 Parse 业务表名。
 * @param {string} nickName 管理端显示的中文表名。
 * @param {boolean} organizationScoped 是否写入组织归属字段元数据。
 * @returns {Promise<import("@/service/parse-client").ParseObject>} 已保存的 Schema 元数据记录。
 * @throws {Error} 元数据写入失败时抛出；调用方可保留表单并提示管理员处理。
 */
const InsertSchema = async (className, nickName, organizationScoped) => {
  const Schema = Parse.Object.extend("Schema");
  const schema = new Schema();
  schema.set("name", className);
  schema.set("nickName", nickName);
  schema.set("fields", {});
  if (sessionStorage.getItem("companyId")) {
    schema.set("company", {
      __type: "Pointer",
      className: "Company",
      objectId: sessionStorage.getItem("companyId"),
    });
  }
  const success = await Capture(schema.save()).catch((err) => {
    removeSchema(className);
  });
  const initialFields = organizationScoped ? [...defaultFields, organizationScopeField] : defaultFields;
  await Promise.all(
    initialFields.map((item) => {
      return setDefaultFields({ className, ...item });
    })
  );
  ElNotification.success({
    title: sessionStorage.getItem("pageName"),
    message: (success.get("name") || success.get("objectId")) + "添加成功",
    duration: 0.5,
  });
  return success;
};

/* 设置默认字段 */
const setDefaultFields = async ({
  className,
  type,
  fieldName,
  fieldOption,
}) => {
  await UpdateSchema(className, type, fieldName, fieldOption);
};

export const UpdateSchema = async (className, type, fieldName, fieldOption) => {
  let Schema = new Parse.Query("Schema");
  Schema.equalTo("name", className);
  const schema = await Schema.first();
  let fields = schema.get("fields") || {};
  fields[fieldName] = {
    type,
    ...fieldOption,
  };
  schema.set("fields", fields);
  return await Capture(schema.save()).then((success) => {
    ElNotification.success({
      title: sessionStorage.getItem("pageName"),
      message:
        (success.get("name") || success.get("objectId")) + "更新成功",
      duration: 0.5,
    });
  });
};

const RemoveTableField = async (className, fieldName) => {
  let Schema = new Parse.Query("Schema");
  Schema.equalTo("name", className);
  const schema = await Schema.first();
  let fields = schema.get("fields");
  delete fields[fieldName];
  schema.set("fields", fields);
  return await Capture(schema.save()).then((success) => {
    ElNotification.success({
      title: sessionStorage.getItem("pageName"),
      message: "字段" + fieldName + "删除成功",
      duration: 0.5,
    });
  });
};

const RemoveTable = async (className) => {
  let Schema = new Parse.Query("Schema");
  Schema.equalTo("name", className);
  const schema = await Schema.first();
  return await Capture(schema.destroy()).then((success) => {
    ElNotification.success({
      title: sessionStorage.getItem("pageName"),
      message:
        (success.get("name") || success.get("objectId")) + "删除成功",
      duration: 0.5,
    });
  });
};
