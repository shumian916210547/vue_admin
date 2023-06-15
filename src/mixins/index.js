import { computed, reactive, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
export function Mixins() {
    const router = useRouter();
    const store = useStore()
    const route = useRoute();
    const incHeader = ref(new Array());
    const tableColums = ref(new Array());
    let { companyId, className, columns, fields, modalWidth } = route.meta;

    const tables = computed(() => {
        return store.getters["GETTABLES"];
    });

    watch(
        tables,
        (n, o) => {
            if (n && Object.keys(n).length && className) {
                Object.keys(n?.[className]).forEach((item) => {
                    if (item != "company" && n?.[className]?.[item]?.chineseName) {
                        incHeader.value.push({
                            title: n?.[className]?.[item]?.chineseName,
                            key: item,
                        });
                    }
                });
                tableColums.value = [...columns.map((field) => {
                    return {
                        key: field,
                        dataIndex: field,
                        title: n?.[className]?.[field]?.chineseName,
                    };
                }), {
                    title: "操作",
                    key: "operation",
                    fixed: "right",
                    width: 200,
                }]
            }
        },
        { deep: true, immediate: true }
    );

    /* 分页器配置 */
    const pagination = reactive({
        position: ["bottomRight"],
        pageSize: 10,
        pageNum: 1,
        name: '',
        companyId,
        className,
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

    return {
        pagination,
        toPage,
        loading,
        tables,
        incHeader,
        tableColums,
        companyId,
        className,
        columns,
        fields,
        modalWidth
    }

}