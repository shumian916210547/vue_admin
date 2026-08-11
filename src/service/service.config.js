import { ElNotification } from "element-plus";

import Parse from "@/service/parse-client";

/**
 * 将接口或 Parse 兼容层错误转换为不泄露内部实现细节的用户可读提示。
 * @param {unknown} error 请求、表单或 Parse 适配层抛出的原始异常。
 * @returns {void} 显示统一错误提示；会话异常仅提示重新登录，不清空无关浏览器数据。
 */
export const handleParseError = (error) => {
  const isSessionError =
    error?.code === Parse.Error.INVALID_SESSION_TOKEN ||
    error?.status === 401 ||
    error?.status === 403;

  ElNotification.error({
    title: isSessionError ? "会话已失效" : "操作未完成",
    message: isSessionError
      ? "当前登录状态已失效，请重新登录后继续操作。"
      : "服务暂时无法完成此操作，请检查输入或稍后重试。",
    duration: 3,
  });
};

/**
 * 统一包装异步数据操作，确保失败会向调用方抛出而不是遗留永不结束的 Promise。
 * @template T
 * @param {Promise<T>} requestPromise 已经发起的数据操作 Promise。
 * @returns {Promise<T>} 成功时返回原结果；失败时完成统一提示后重新抛出错误。
 */
export const Capture = async (requestPromise) => {
  try {
    return await requestPromise;
  } catch (error) {
    handleParseError(error);
    throw error;
  }
};

/**
 * 封装列表数据与总数，供 CommonPage 和 CommonTable 以稳定的结构读取分页结果。
 */
export class FindList {
  /**
   * 创建一个分页结果实例。
   * @param {Array<Record<string, unknown>>} data 当前页数据数组；默认空数组。
   * @param {number} count 满足查询条件的记录总数；默认 0。
   */
  constructor(data = [], count = 0) {
    this.data = Array.isArray(data) ? data : [];
    this.count = Number.isFinite(Number(count)) ? Number(count) : 0;
  }

  /**
   * 更新当前页数据。
   * @param {Array<Record<string, unknown>>} data 新的当前页数据数组。
   * @returns {void} 替换内部数据；非法值安全回退为空数组。
   */
  setData(data) {
    this.data = Array.isArray(data) ? data : [];
  }

  /**
   * 更新满足筛选条件的记录总数。
   * @param {number} count 新的记录总数。
   * @returns {void} 替换内部总数；非法值安全回退为 0。
   */
  setCount(count) {
    this.count = Number.isFinite(Number(count)) ? Number(count) : 0;
  }

  /**
   * 读取当前页数据。
   * @returns {Array<Record<string, unknown>>} 当前页记录数组。
   */
  getData() {
    return this.data;
  }

  /**
   * 读取满足筛选条件的记录总数。
   * @returns {number} 当前记录总数。
   */
  getCount() {
    return this.count;
  }
}
