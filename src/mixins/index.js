
import { reactive } from "vue";
export function Mixins() {

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
            loadData({ pageNum: num, pageSize: size });
        },
    });

    return { pagination }

}