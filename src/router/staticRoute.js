import Layout from '@/components/Layout'
export let chil_routes = [
    {
        path: 'personalCenter',
        name: '个人中心',
        component: () => import("@/views/personalCenter"),
        menu: false
    }
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