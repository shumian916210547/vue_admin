import { request } from "@/service/api-client";

/**
 * 访问视频组织、成员、个人视图和审计 API，复用同源 Cookie/CSRF 错误处理。
 * @param {string} method 必填，get/post/put/delete。
 * @param {string} resource 必填，服务代码固定的 /overview、/organizations 等相对资源。
 * @param {object} [data] 可选，组织/成员/视图表单或批量归属载荷。
 * @param {object} [params] 可选，成员选项关键词等查询参数。
 * @returns {Promise<unknown>} BFF data；失败抛出统一 API 错误，不吞掉权限失败。
 */
export const workspaceRequest = (method, resource, data, params) => request({ method, url: `/camera-workspace${resource}`, data, params });

/** 组织类型的中文名称，三类与后端层级约束一致。 */
export const organizationTypes = [
  { value: "company", label: "公司" },
  { value: "organization", label: "组织" },
  { value: "store", label: "门店" },
];

/**
 * 格式化视频组织类型。
 * @param {string} type 必填，company/organization/store。
 * @returns {string} 中文类型，无副作用。
 */
export function organizationTypeLabel(type) { return organizationTypes.find((item) => item.value === type)?.label || "组织"; }

/**
 * 展开选中组织的子树 ID，用于已授权设备快照的本地展示筛选，不代替后端访问校验。
 * @param {object[]} organizations 必填，BFF 已裁剪权限的组织 DTO 数组。
 * @param {string} id 必填，选中组织 UUID。
 * @param {boolean} [includeDescendants=true] 可选，是否含下级组织。
 * @returns {Set<string>} 组织 ID 集合，不修改服务器数据。
 */
export function organizationIds(organizations, id, includeDescendants = true) {
  const ids = [id];
  if (includeDescendants) for (let index = 0; index < ids.length; index += 1) for (const row of organizations) if (row.parent_id === ids[index] && !ids.includes(row.id)) ids.push(row.id);
  return new Set(ids);
}
