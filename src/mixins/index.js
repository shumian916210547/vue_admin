import { useRouter } from "vue-router";

export function Mixins() {

    const router = useRouter()

    // 页面跳转
    const toPage = (path) => {
        router.push(path);
    };

    return {
        toPage,
    }
}