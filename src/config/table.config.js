export const columns = [
    {
        title: "表格名称",
        dataIndex: "className",
        key: "className",
    },
    {
        title: "表格别名",
        dataIndex: "nickName",
        key: "nickName",
    },
    {
        title: "字段数量",
        dataIndex: "fields_num",
        key: "fields_num",
    },
    {
        title: "运行状态",
        dataIndex: "status",
        key: "status",
        width: 100,
    },
    {
        title: "操作",
        key: "operation",
        fixed: "right",
        width: 256,
        className: "table-operation-column",
    },
];

export const innerColumns = [
    {
        title: "字段名称",
        dataIndex: "fieldName",
        key: "fieldName",
    },
    {
        title: "字段类型",
        dataIndex: "fieldType",
        key: "fieldType",
    },
    {
        title: "操作",
        dataIndex: "operation",
        key: "operation",
        fixed: "right",
        width: 176,
        className: "table-operation-column",
    },
];
