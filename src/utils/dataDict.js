import moment from "moment";

/**
 * 
 * @param {object} column 列
 * @param {object} record 行
 * @param {object} fields 字段集合
 * @returns {string}
 */
export const data_dict = (column, record, fields) => {
    const TYPE = fields[column.key].type
    if (TYPE == 'Array' && fields[column.key]?.isPointer) {
        return (record[column.key]?.map(item => item.name || item.objectId) || []).join(",")
    } else {
        switch (TYPE) {
            case 'Object': return JSON.stringify(record[column.key], null, 2) || "";
            case 'Array': return record[column.key].join(',') || "";
            case 'Date': return moment(record[column.key]).format("YYYY-MM-DD HH:mm:ss");
            case 'Pointer': return record[column.key]?.name || record[column.key];
            case 'Boolean': return record[column.key] ? '是' : '否';
            default: return record[column.key] || "";
        }
    }
}