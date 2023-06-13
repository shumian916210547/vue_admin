import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
export function Mixins() {
    const router = useRouter();
    const store = useStore()

    /* 分页器配置 */
    let pagination = reactive({
        position: ["bottomRight"],
        pageSize: 10,
        pageNum: 1,
        name: '',
        companyId: '',
        className: '',
        showSizeChanger: true,
        total: 0,
        showTotal: (total) => `Total ${total} items`,
        pageSizeOptions: ["10", "20", "50", "100"],
        onChange: (num, size) => {
            pagination.pageNum = num;
            pagination.pageSize = size;
        },
    });

    // 页面跳转
    const toPage = (path, params) => {
        router.push({ path, query: params });
    };

    const loading = computed(() => {
        return store.getters['GETLOADING']
    })

    return { pagination, toPage, loading }

}