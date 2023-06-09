
import store from "@/store/index";

export const permission = {
    mounted(el, binding, vnode) {
        const { value } = binding;
        let f = store.getters["GETCURRENTSWITCHS"].some((p) => {
            return p.key == value;
        });
        if (!f) {
            el.parentNode && el.parentNode.removeChild(el);
        }
    },
}