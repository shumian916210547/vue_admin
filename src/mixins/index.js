import { useRouter, useRoute } from "vue-router";
import Parse from "parse";
import { useStore } from "vuex";
export function Mixins() {

    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    //查询页面按钮权限
    const queryPermission = async (id) => {
        const query = new Parse.Query('AllotPermission')
        query.equalTo('route', id || route.meta.id)
        query.equalTo('role', Parse.User.current().get('role').id)
        const result = await query.first()
        if (result.id) {
            return result.get("permissions")
        } else {
            return []
        }
    }

    // 页面跳转
    const toPage = (path) => {
        router.push({ path });
    };

    return {
        toPage,
        queryPermission,
    }
}