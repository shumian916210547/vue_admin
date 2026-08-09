// Compatibility wrapper for generated modules. Authentication, tenant scope,
// and CSRF headers are owned by the shared BFF client rather than callers.
import api from "@/service/api-client";

const unwrap = (promise) => promise.then((response) => response.data);

export const get = (url, params = {}) => unwrap(api.get(url, { params }));
export const post = (url, data = {}) => unwrap(api.post(url, data));
export const patch = (url, data = {}) => unwrap(api.patch(url, data));
export const put = (url, data = {}) => unwrap(api.put(url, data));
export const remove = (url, data = {}) => unwrap(api.delete(url, { data }));
