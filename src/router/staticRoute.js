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
    {
        path: '/front',
        name: "front",
        //前台展示页面路由在此处添加
        children: [
            {
                path: 'travel',
                name: 'Travel',
                component: () => import("@/views/front/travel")
            }
        ]
    }
]