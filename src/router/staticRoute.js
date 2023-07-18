import Layout from '@/components/Layout'
export let chil_routes = []
export const routes = [
    {
        path: '/',
        name: "Layout",
        component: Layout,
        children: [...chil_routes,
        {
            path: '404',
            component: () => import("@/views/404")
        },
        {
            path: '/:all(.*)*',
            redirect: '/404'
        }]
    },
    {
        path: '/login',
        name: '登录',
        component: () => import("@/views/login"),
    },
]