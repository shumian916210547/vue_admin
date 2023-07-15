import { findAll } from "@/service/base.service";
import Parse from 'parse';
import router from './index'
import store from "@/store";
import { chil_routes } from "./staticRoute";
import PageLoading from '@/components/PageLoading'
let routes = []
Parse.initialize("shumian0511", "shumian100329");
Parse.serverURL = process.env.VUE_APP_BACK_SERVER + '/parse'

export const loadRoutes = async () => {
    const role = JSON.parse(localStorage.getItem("role"));
    if (store.getters['GET_MODULES'].length) {
        routes = [...chil_routes, ...store.getters['GET_MODULES']]
    } else {
        /* 筛选用户有权限的页面 */
        const modules = (await findAll('Module')).filter((module) => {
            if (module.routes) {
                module.routes = module.routes.filter((route) => {
                    return role.module.includes(route.objectId);
                }).sort((a, b) => {
                    return a.index - b.index
                });
                if (!module.routes.length) {
                    delete module.routes;
                }
            }
            return role.module.includes(module.objectId) || module.routes;
        }).sort((a, b) => {
            return a.index - b.index
        });

        /* 添加到路由 */
        routes = [...chil_routes, ...modules.map((module, index) => {
            if (module.pageComponent) {
                try {
                    require('@/views' + module.pageComponent)
                    module.component = () => import("@/views" + module.pageComponent)
                } catch (error) {
                    module.component = () => import('@/components' + module.pageComponent)
                }
            } else {
                module.component = PageLoading
            }
            module.meta = {
                targetClass: module.targetClass,
                icon: module.icon
            }
            if (module.routes) {
                module.children = module.routes.map(route => {
                    route.meta = {
                        targetClass: route.targetClass
                    }
                    try {
                        require('@/views' + route.pageComponent)
                        route.component = () => import('@/views' + route.pageComponent)
                    } catch (error) {
                        route.component = () => import('@/components' + route.pageComponent)
                    }
                    return route
                })
                delete module.routes
            }
            router.addRoute('Layout', module)
            return module
        })]
        store.commit('SET_MODULES', routes)
    }
    return routes
}

