export const getAPI = ({ className, fields }) => {
  const writableFields = fields
    .map((item) => item.formState.fieldName)
    .filter((name) => !["objectId", "createdAt", "updatedAt", "company"].includes(name));
  const parameterList = writableFields.join(", ");

  return `
/* ${className}.service.js - generated BFF client */
import { request } from "@/service/api-client";

const className = "${className}";

export const find${className}List = async ({ pageSize = 50, pageNum = 1, where = {} } = {}) =>
  request({
    method: "post",
    url: "/data/query",
    data: {
      className,
      filters: Object.entries(where).map(([field, value]) => ({ field, operator: "equalTo", value })),
      includeAll: true,
      limit: pageSize,
      skip: pageSize * Math.max(pageNum - 1, 0),
      descending: "createdAt",
    },
  });

export const find${className}ById = async (objectId) => {
  const result = await request({
    method: "post",
    url: "/data/query",
    data: { className, filters: [{ field: "objectId", operator: "equalTo", value: objectId }], includeAll: true, limit: 1 },
  });
  return result.data[0];
};

export const insert${className} = async ({ ${parameterList} }) =>
  request({
    method: "post",
    url: \`/data/\${className}\`,
    data: { attributes: { ${parameterList} } },
  });

export const update${className}ById = async ({ objectId, ...attributes }) =>
  request({
    method: "put",
    url: \`/data/\${className}/\${objectId}\`,
    data: { attributes },
  });

export const remove${className}ById = (objectId) =>
  request({ method: "delete", url: \`/data/\${className}/\${objectId}\` });
`;
};
