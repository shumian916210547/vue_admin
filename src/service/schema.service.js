import { Capture } from "@/service/service.config";
import Parse from "parse";

/* 更新所有表格权限 */
export const UpdateTablePermission = async (className,arg2) => {
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
    return await schema.update()
}

/* 获取所有schema列表（包含系统schema） */
export const loadAllSchema = async () => {
    return await Parse.Schema.all()
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

const GetSchemaList = async (query) => {
    const Schema = new Parse.Query('Schema');
    Schema.contains('name', query.name)
    Schema.descending("createdAt")
    return (await Schema.find()).map(item => item.toJSON())
}


const InsertSchema = async (className) => {
    const Schema = Parse.Object.extend("Schema")
    const schema = new Schema()
    schema.set('name', className);
    schema.set('fields', {});
    await schema.save()
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
    await schema.save()
}

const RemoveTableField = async (className, fieldName) => {
    let Schema = new Parse.Query('Schema');
    Schema.equalTo('name', className);
    const schema = await Schema.first();
    let fields = schema.get('fields')
    delete fields[fieldName]
    schema.set('fields', fields)
    await schema.save()
}

const RemoveTable = async (className) => {
    let Schema = new Parse.Query('Schema');
    Schema.equalTo('name', className);
    const schema = await Schema.first()
    await schema.destroy()
}