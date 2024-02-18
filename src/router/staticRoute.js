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
                component: () => import("@/views/front/travel"),
                children: [
                    {
                        path: 'home',
                        name: 'Home',
                        component: () => import("@/views/front/travel/home")
                    },
                    {
                        path: 'note',
                        name: 'Note',
                        component: () => import("@/views/front/travel/note")
                    },
                    {
                        path: 'note/:objectId',
                        name: 'noteDetail',
                        component: () => import("@/views/front/travel/note/noteDetail")
                    },
                    {
                        path: 'noteIssue',
                        name: 'noteIssue',
                        component: () => import("@/views/front/travel/note/issue")
                    },
                    {
                        path: 'strategy',
                        name: 'Strategy',
                        component: () => import("@/views/front/travel/strategy"),
                    },
                    {
                        path: 'issue',
                        name: 'StrategyIssue',
                        component: () => import("@/views/front/travel/strategy/issue")
                    },
                    {
                        path: 'strategy/:objectId',
                        name: 'StrategyDetail',
                        component: () => import("@/views/front/travel/strategy/strategyDetail")
                    },
                    {
                        path: 'login',
                        name: 'Login',
                        component: () => import("@/views/front/travel/login")
                    },
                    {
                        path: 'register',
                        name: 'Register',
                        component: () => import("@/views/front/travel/register")
                    }, {
                        path: 'my',
                        name: 'My',
                        component: () => import("@/views/front/travel/my")
                    }, {
                        path: 'city',
                        name: 'City',
                        component: () => import("@/views/front/travel/city")
                    }, {
                        path: 'hotel',
                        name: 'Hotel',
                        component: () => import("@/views/front/travel/hotel")
                    }, {
                        path: 'hotel/:objectId',
                        name: 'HotelDetail',
                        component: () => import("@/views/front/travel/hotel/hotelDetail")
                    }, {
                        path: 'city/:objectId',
                        name: 'CityDetail',
                        component: () => import("@/views/front/travel/city/cityDetail")
                    },
                ]
            }
        ]
    }
]