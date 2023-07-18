import { findAll } from "@/service/base.service";
import Parse from 'parse';
import router from './index'
import store from "@/store";
import { chil_routes } from "./staticRoute";
import PageLoading from '@/components/PageLoading'
let routes = []
Parse.initialize(process.env.VUE_APP_PARSE_SERVER_APPLICATION_ID, "shumian100329");
Parse.serverURL = process.env.VUE_APP_PARSE_SERVER_HOST + '/parse'
Parse.masterKey = process.env.VUE_APP_PARSE_SERVER_MASTER_KEY
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
                    return a.rank - b.rank
                });
                if (!module.routes.length) {
                    delete module.routes;
                }
            }
            return role.module.includes(module.objectId) || module.routes;
        }).sort((a, b) => {
            return a.rank - b.rank
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
        router.addRoute('Layout', {
            path: '404',
            component: () => import("@/views/404")
        })
        router.addRoute('Layout', {
            path: '/:all(.*)*',
            redirect: '/404'
        })
        store.commit('SET_MODULES', routes)
    }

    return routes
}

