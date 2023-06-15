
import router from "@/router/index";
export const SystemRoute = (modules) => {
    JSON.parse(JSON.stringify(modules)).forEach((module) => {
        router.addRoute('index', {
            name: module.objectId,
            path: module.path,
            component: () => import("@/components/Layout"),
            children: module.router.map(route => {
                route["path"] = module['path'] + route["path"]
                try {
                    require("@/views" + route.pagePath);
                    route["component"] = () => import("@/views" + route.pagePath);
                } catch (error) {
                    route["component"] = () => import("@/components" + route.pagePath);
                }
                route["meta"] = Object.assign({}, {
                    companyId: module?.meta?.companyId
                },
                    route.option, {
                    switchs: route.switchs
                }
                );
                route['name'] = route.objectId
                return route
            })
        })
    })
}