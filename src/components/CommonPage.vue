<template>
    <CommonTable v-model:queryVal="queryState.where" :tableColumns="tableColumns" :tableData="tableData"
        :queryState="queryState" :innerContainer="innerContainer" :innerContainerTitle="innerContainerTitle"
        :fields="fields" @onQueryReset="handleReset()" @onQuery="loadData(queryState)" @onInsert="handleInsert()"
        @onChange="queryState.onChange" @onDelete="handleDelete" @onEdit="handleEdit" @onAdd="emit('add', $event)"
        @onPreview="handlePreview">
        <template v-if="innerContainer" #expandedRowRender="{ record, index, indent, expanded }">
            <slot name="innerContainer" :record="record" :index="index" :indent="indent" :expanded="expanded">
            </slot>
        </template>
    </CommonTable>
    <CommonForm :className="className" :fields="formFields" :editState="editState" :type="formModal.type"
        v-model:modalVisible="formModal.show" @onOk="handleOk"></CommonForm>
    <CommonPreview :className="className" :fields="formFields" v-model:modalVisible="previewMap.show"
        :dataMap="previewMap.data">
    </CommonPreview>
</template>

<script setup>
import CommonTable from "@/components/CommonTable.vue";
import CommonForm from "./CommonForm.vue";
import CommonPreview from "./commonPreview.vue"
import {
    findSchema,
    findList,
    InsertRow,
    removeById,
    UpdateById,
} from "@/service/base.service";
import { reactive, ref } from "vue";
import { deepClone } from "@/utils/utils";
import { defaultFields } from "@/service/schema.service";
import { Mixins } from "@/mixins";
import { notification } from "ant-design-vue";
const emit = defineEmits(["add"]);
const props = defineProps({
    className: {
        required: true,
        type: String,
    },
    innerContainer: {
        type: Boolean,
        default: false,
    },
    innerContainerTitle: {
        type: [Boolean, String],
        default: "新增",
    },
});
const { getFilterField } = Mixins();
let fields = reactive({});
const queryState = reactive({
    pageSize: 10,
    pageNum: 1,
    where: {},
    total: 0,
    className: props.className,
    position: ["bottomRight"],
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
    pageSizeOptions: ["10", "20", "50", "100"],
    onChange: (num, size) => {
        queryState.pageNum = num;
        queryState.pageSize = size;
        loadData(queryState);
    },
    filterFilds: {},
});

const formModal = reactive({
    show: false,
    type: "add",
});

const systemFields = defaultFields.map((item) => item.fieldName);

const tableColumns = ref([]);

const formFields = reactive({});
/* 获取table字段并且保存 */
const loadFields = async (query) => {
    const result = await findSchema(query);
    if (!result) return;

    Object.keys(result.get("fields")).forEach((key) => {
        fields[key] = result.get("fields")[key];

        /* 筛选系统字段，不在新增或者修改表单中展示 */
        if (!systemFields.includes(key)) {
            formFields[key] = result.get("fields")[key];
        }
    });
    getFilterField(fields).forEach((key) => {
        queryState.filterFilds[key] = fields[key];
    });
    loadColumns(fields);
};

/* 获取table表头 */
const loadColumns = async (arg) => {
    tableColumns.value = Object.keys(arg)
        .filter((key) => {
            return arg[key].isTable;
        })
        .map((key) => ({
            title: arg[key].chineseName,
            dataIndex: key,
            key: key,
            resizable: true,
            width: 200,
        }));
    tableColumns.value.push({
        title: "操作",
        dataIndex: "operation",
        key: "operation",
        resizable: true,
        fixed: "right",
        width: 230,
    });
};

const tableData = ref([]);

/* 获取表格数据 */
const loadData = async (query) => {
    const result = await findList(query);
    queryState.total = result.count;
    tableData.value = result.data.sort((a, b) => {
        if (a.rank || b.rank) {
            return a.rank - b.rank;
        } else {
            return a.createdAt - b.createdAt;
        }
    });
    notification.success({
        message: sessionStorage.getItem("pageName"),
        description: "数据获取成功",
        duration: 0.5,
    });
};

/* 重置表格筛选数据 */
const handleReset = () => {
    queryState.where = {};
    loadData(queryState);
};

/* 点击新增 */
const handleInsert = () => {
    formModal.type = "add";
    formModal.show = true;
};

/* 点击删除 */
const handleDelete = async (arg) => {
    await removeById({ objectId: arg.objectId, className: props.className });
    loadData(queryState);
};

/* 点击ok按钮 */
const handleOk = async (arg) => {
    switch (formModal.type) {
        case "add":
            await InsertRow({
                className: props.className,
                params: arg,
                fields,
            });
            break;
        case "edit":
            await UpdateById({
                className: props.className,
                params: Object.assign({}, { objectId: editState.objectId }, arg),
                fields,
            });
            break;
        default:
            break;
    }
    formModal.show = false;
    loadData(queryState);
};

/* 预览 */
const previewMap = reactive({
    show: false,
    data: {}
})
const handlePreview = (args) => {
    previewMap.data = deepClone(args)
    previewMap.show = true
    console.log(args, formFields);
}

/* 点击编辑 */
const editState = reactive({});
const handleEdit = async (arg) => {
    arg = deepClone(arg);
    formModal.type = "edit";
    Object.keys(fields).forEach((key) => {
        if (fields[key].type == "Pointer") {
            editState[key] = arg[key]?.objectId || "";
        } else {
            editState[key] = arg[key];
        }
    });
    editState.objectId = arg.objectId;
    formModal.show = true;
};

await loadFields(queryState);
await loadData(queryState);

/* 将组件内方法暴露出来，使其他组件可以访问 */
defineExpose({ loadData, queryState, tableData });
</script>