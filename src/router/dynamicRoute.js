import router from "@/router/index";
import { deepClone } from "@/utils/utils";
export const SystemRoute = (modules) => {
    deepClone(modules).forEach((module) => {
        router.addRoute('index', {
            name: module.objectId,
            path: module.path,
            component: () => import("@/components/Layout"),
            children: module.router.map(route => {
                return {
                    name: route.objectId,
                    path: module['path'] + route["path"],
                    meta: Object.assign({}, {
                        companyId: module?.meta?.companyId
                    },
                        route.option, {
                        switchs: route.switchs
                    }
                    ),
                    component: () => {
                        try {
                            require("@/views" + route.pagePath);
                            return import("@/views" + route.pagePath);
                        } catch (error) {
                            return import("@/components" + route.pagePath);
                        }
                    }
                }
            })
        })
    })
}