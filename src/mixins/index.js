import { useRouter, useRoute } from "vue-router";
import Parse from "parse";
import { useStore } from "vuex";
import { ref } from "vue";
export function Mixins() {

    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const historyPage = ref(JSON.parse(sessionStorage.getItem('historyPage')) || [])

    //查询页面按钮权限
    const queryPermission = async (id) => {
        const query = new Parse.Query('AllotPermission')
        query.equalTo('route', id || route.meta.id)
        query.equalTo('role', Parse.User.current().get('role').id)
        const result = await query.first()
        if (result && result.id) {
            return result.get("permissions")
        } else {
            return []
        }
    }

    //删除历史数据中的其中一项
    const removeHistoryRoute = (index) => {
        historyPage.value.splice(index, 1)
        sessionStorage.setItem("historyPage", JSON.stringify(historyPage.value))
    }

    //查询历史页面中是否存在
    const hasRoute = (rid) => {
        return historyPage.value.some(item => {
            return item.pageKey === rid
        })
    }

    // 页面跳转
    const toPage = (path, pageKey, pageName) => {
        router.push({ path });
        if (pageKey) sessionStorage.setItem('pageKey', pageKey)
        if (pageName) sessionStorage.setItem('pageName', pageName)
        if (!hasRoute(pageKey)) historyPage.value.push({ path, pageKey, pageName }), sessionStorage.setItem("historyPage", JSON.stringify(historyPage.value))
    };

    return {
        toPage,
        queryPermission,
        historyPage,
        removeHistoryRoute
    }
}