
import { notification } from "ant-design-vue";
import Parse from "parse";
export const handleParseError = (err) => {
    switch (err.code) {
        case Parse.Error.INVALID_SESSION_TOKEN:
            sessionStorage.clear()
            localStorage.clear()
        default:
            notification.error({
                message: err.code,
                description: String(err),
            });
            location.reload()
            break;
    }
}

export const Capture = (func) => {
    return new Promise((resolve, reject) => {
        func.then(success => {
            notification.success({
                message: 'success',
                description: '更新成功',
            });
            resolve(success)
        }).catch(error => {
            notification.error({
                message: 'error',
                description: error.toString(),
            });
            handleParseError(error)
            /*   reject(error) */
        })
    })
}

export class FindList {
    constructor(data, count) {
        this.data = data
        this.count = count
    }

    setData(arg) {
        this.data = arg
    }

    setCount(arg) {
        this.count = arg
    }

    getData() {
        return this.data
    }

    getCount() {
        return this.count = arg
    }
}