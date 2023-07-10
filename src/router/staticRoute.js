import Layout from '@/components/Layout'
export let chil_routes = [
]
export const routes = [
    {
        path: '/',
        name: "Layout",
        component: Layout,
        children: [...chil_routes]
    },
    {
        path: '/login',
        name: '登录',
        component: () => import("@/views/login"),
    },
]