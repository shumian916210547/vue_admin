import { Capture, handleParseError } from "@/service/service.config";
import { notification } from "ant-design-vue";
import Parse from "parse";
Parse.masterKey = "shumian100329"
export const defaultFields = [
    {
        "fieldName": "objectId",
        "type": "String",
        "fieldOption": {
            "required": false,
            "chineseName": "objectId",
            "editComponent": "AInput",
            "componentOption": {
                "disabled": true,
                "allowClear": false,
                "placeholder": ""
            }
        }
    },
    {
        "fieldName": "createdAt",
        "type": "Date",
        "fieldOption": {
            "required": false,
            "chineseName": "createdAt",
            "editComponent": "AInput",
            "componentOption": {
                "disabled": true,
                "allowClear": false,
                "placeholder": ""
            }
        }
    },
    {
        "fieldName": "updatedAt",
        "type": "Date",
        "fieldOption": {
            "required": false,
            "chineseName": "updatedAt",
            "editComponent": "AInput",
            "componentOption": {
                "disabled": true,
                "allowClear": false,
                "placeholder": ""
            }
        }
    }
]

/* 更新所有表格权限 */
export const UpdateTablePermission = async (className, arg2) => {
    const schema = new Parse.Schema(className)
    const clp = new Parse.CLP(arg2)
    clp.setPublicCountAccess(true)
    clp.setPublicGetAccess(true)
    clp.setPublicFindAccess(true)
    clp.setPublicDeleteAccess(true)
    clp.setPublicUpdateAccess(true)
    clp.setPublicAddFieldAccess(true)
    clp.setPublicCreateAccess(true)
    schema.setCLP(clp)
}

/* 获取所有schema列表（包含系统schema） */
export const loadAllSchema = async () => {
    return await Parse.Schema.all().catch(err => { handleParseError(err) })
}

/* 获取所有schema */
export const loadSchemas = async (query) => {
    return await GetSchemaList(query)
}

/* 新建schema */
export const createSchema = async (className) => {
    const table = new Parse.Schema(className)
    return await Capture(table.save()).then(success => {
        InsertSchema(className)
    })
}

/* 新增字段 */
export const addField = async (className, fieldType, fieldName, fieldOption) => {
    const table = new Parse.Schema(className)
    table.addField(fieldName, fieldType, fieldOption)
    return await Capture(table.update()).then(success => {
        UpdateSchema(className, fieldType, fieldName, fieldOption)
    })
}

/* 修改字段 */
export const updateField = async (className, fieldType, fieldName, fieldOption) => {
    const table = new Parse.Schema(className)
    table.deleteField(fieldName)
    await table.update()
    const table2 = new Parse.Schema(className)
    table2.addField(fieldName, fieldType, fieldOption)
    return await Capture(table2.update()).then(success => {
        UpdateSchema(className, fieldType, fieldName, fieldOption)
    })
}

/* 删除字段 */
export const removeField = async (className, fieldName) => {
    const table = new Parse.Schema(className)
    table.deleteField(fieldName)
    return await Capture(table.update()).then(success => {
        RemoveTableField(className, fieldName)
    })
}

/* 删除schema */
export const removeSchema = async (className) => {
    const table = new Parse.Schema(className)
    await table.purge()
    return await Capture(table.delete()).then(success => {
        RemoveTable(className)
    })
}

const GetSchemaList = async (query, where = { company: sessionStorage.getItem('companyId') }) => {
    const Schema = new Parse.Query('Schema');
    Schema.contains('name', query.name)
    Object.keys(where).forEach(key => {
        if (where[key]) Schema.equalTo(key, where[key])
    })
    Schema.descending("createdAt")
    return (await Schema.find().catch(err => { handleParseError(err) }))?.map(item => item.toJSON())
}


const InsertSchema = async (className) => {
    const Schema = Parse.Object.extend("Schema")
    const schema = new Schema()
    schema.set('name', className);
    schema.set('fields', {});
    if (sessionStorage.getItem('companyId')) {
        schema.set('company', {
            __type: 'Pointer',
            className: 'Company',
            objectId: sessionStorage.getItem('companyId')
        })
    }
    return await Capture(schema.save()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: (success.get('name') || success.get('objectId')) + '添加成功',
        });
        defaultFields.forEach(item => {
            setDefaultFields({ className, ...item })
        })
    })
}

/* 设置默认字段 */
const setDefaultFields = async ({ className, type, fieldName, fieldOption }) => {
    await UpdateSchema(className, type, fieldName, fieldOption)
}

const UpdateSchema = async (className, type, fieldName, fieldOption) => {
    let Schema = new Parse.Query('Schema');
    Schema.equalTo('name', className);
    const schema = await Schema.first();
    let fields = schema.get('fields') || {}
    fields[fieldName] = {
        type,
        ...fieldOption
    }
    schema.set('fields', fields)
    return await Capture(schema.save()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: (success.get('name') || success.get('objectId')) + '更新成功',
        });
    })
}

const RemoveTableField = async (className, fieldName) => {
    let Schema = new Parse.Query('Schema');
    Schema.equalTo('name', className);
    const schema = await Schema.first();
    let fields = schema.get('fields')
    delete fields[fieldName]
    schema.set('fields', fields)
    return await Capture(schema.save()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: '字段' + fieldName + '删除成功',
        });
    })
}

const RemoveTable = async (className) => {
    let Schema = new Parse.Query('Schema');
    Schema.equalTo('name', className);
    const schema = await Schema.first()
    return await Capture(schema.destroy()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: (success.get('name') || success.get('objectId')) + '删除成功',
        });
    })
}