/* 深拷贝 */
export const deepClone = (payload, map = new Map()) => {
    if (map.has(payload)) return map.get(payload);
    if (typeof payload === 'function') return eval(payload.toString())
    if (typeof payload !== 'object') return payload;
    let res;
    const constructor = payload.constructor;
    switch (constructor) {
        case String:
        case Number:
        case Boolean:
        case Date:
        case RegExp: return new constructor(payload);
        default:
            res = new constructor();
            map.set(payload, res);
    }
    Reflect.ownKeys(payload).forEach(key => {
        res[key] = deepClone(payload[key], map);
    })
    return res;
}


/* 防抖 */
export const debounce = (fn, wait) => {
    let timer = null
    return () => {
        if (timer !== null) {
            clearTimeout(timer)
        }
        timer = setTimeout(fn, wait)
    }
}


/* 处理图片数组转string */
export const arrayImgsToString = (arr, key) => {
    let urls = ""
    arr.forEach((item, index) => {
        urls += item[key]
        if (index != 0 && index != arr.length - 1) {
            urls += ','
        }
    })
    return urls
}