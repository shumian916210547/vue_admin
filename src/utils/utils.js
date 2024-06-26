/* 深拷贝 */
/**
 * 
 * @param {*} payload 
 * @param {*} map 
 * @returns 
 */
export const deepClone = (payload, map = new Map()) => {
  if (map.has(payload)) return map.get(payload);
  if (typeof payload === "function") return eval(payload.toString());
  if (typeof payload !== "object") return payload;
  let res;
  const constructor = payload.constructor;
  switch (constructor) {
    case String:
    case Number:
    case Boolean:
    case Date:
    case RegExp:
      return new constructor(payload);
    default:
      res = new constructor();
      map.set(payload, res);
  }
  Reflect.ownKeys(payload).forEach((key) => {
    res[key] = deepClone(payload[key], map);
  });
  return res;
};

/**
 * 
 * @param {*} fn 
 * @param {*} wait 
 * @returns 
 */
/* 防抖 */
export const debounce = (fn, wait) => {
  let timer = null;
  return () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, wait);
  };
};

/**
 * 
 * @param {*} arr 
 * @param {*} key 
 * @returns 
 */
/* 处理图片数组转string */
export const arrayImgsToString = (arr, key) => {
  let urls = "";
  arr.forEach((item, index) => {
    urls += item[key];
    if (index != 0 && index != arr.length - 1) {
      urls += ",";
    }
  });
  return urls;
};

/**
 * 
 * @param {*} arr1 
 * @param {*} arr2 
 * @returns 
 */
/* 判断数组相同 */
export const arraysContentAreEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  const sortedArr1 = arr1.slice().sort();
  const sortedArr2 = arr2.slice().sort();
  return sortedArr1.every((value, index) => value === sortedArr2[index]);
};

/* 判断数据类型 */
export const dataDefault = (payload) => {
  switch (payload) {
    case "Array":
      return [];
    case "Object":
      return {};
    default:
      return undefined;
  }
};
