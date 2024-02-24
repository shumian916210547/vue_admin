
import { notification } from "ant-design-vue";
import Parse from "parse";

export const handleParseError = (err) => {
    switch (err.code) {
        case Parse.Error.INVALID_SESSION_TOKEN:
            localStorage.clear()
            location.reload()
            break;
        default:
            notification.error({
                message: err.code,
                description: String(err),
                duration: 0.5
            });
            break;
    }
}

export const Capture = (func) => {
    return new Promise((resolve, reject) => {
        func.then(success => {
            resolve(success)
        }).catch(error => {
            notification.error({
                message: sessionStorage.getItem('pageName') || 'error',
                description: error.toString(),
                duration: 0.5
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