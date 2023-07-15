import Parse, { Schema } from 'parse'
Parse.masterKey = "shumian100329";
import { Capture, FindList, handleParseError } from '@/service/service.config'
import { UpdateTablePermission } from './schema.service';

/* 查询所有数据 */
export const findAll = async (className) => {
    const table = new Parse.Query(className);
    table.includeAll()
    table.limit(10000)
    table.descending('createdAt')
    return (await table.find().catch(err => { handleParseError(err) }))?.map(item => item.toJSON())
}

/* 查询列表 */
export const findList = async (query) => {
    const { className, pageSize, pageNum, name } = query;
    if (!className) return
    const table = new Parse.Query(className)
    table.includeAll()
    table.contains('name', name)
    table.limit(pageSize || 200)
    table.skip((pageSize || 200) * (pageNum ? (pageNum - 1) : 0))
    table.descending('createdAt')
    return new FindList((await table.find().catch(err => { handleParseError(err) }))?.map(item => item.toJSON()), await table.count().catch(err => { handleParseError(err) }))
}

/* 查询字段 */
export const findSchema = async (query) => {
    const table = new Parse.Query('Schema');
    table.equalTo('name', query.className)
    table.includeAll()
    return await table.first().catch(err => { handleParseError(err) })
}

/* 新增一行 */
export const InsertRow = async ({ className, fields, params }) => {
    const Table = Parse.Object.extend(className)
    const table = new Table()
    Object.keys(params).forEach(key => {
        if (fields[key].type == 'Pointer') {
            table.set(key, {
                __type: fields[key].type,
                className: fields[key].targetClass,
                objectId: params[key]
            })
        } else {
            table.set(key, params[key])
        }
    })

    const acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(true)
    table.setACL(acl)
    return await Capture(table.save()).then(success => {
        /*  UpdateTablePermission(className, success) */
    })
}


/* 修改一行 */
export const UpdateById = async ({ className, fields, params }) => {
    const Table = new Parse.Query(className)
    Table.equalTo('objectId', params.objectId);
    const table = await Table.first()
    Object.keys(params).forEach(key => {
        if (key !== 'objectId') {
            if (fields[key].type == 'Pointer') {
                table.set(key, {
                    __type: fields[key].type,
                    className: fields[key].targetClass,
                    objectId: params[key]
                })
            } else {
                table.set(key, params[key])
            }
        }
    })
    return await Capture(table.save())
}

/* 删除一行 */
export const removeById = async ({ className, objectId }) => {
    const Table = new Parse.Query(className);
    Table.equalTo('objectId', objectId)
    const table = await Table.first();
    return await Capture(table.destroy())
}