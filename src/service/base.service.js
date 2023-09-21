import Parse from 'parse'
import { Capture, FindList, handleParseError } from '@/service/service.config'
import { notification } from 'ant-design-vue';


/* 搜索数据的方法 */
const machMethod = (field) => {
    const method = {
        'Pointer': 'equalTo',
        'Array': 'containedIn',
        'String': 'contains',
        'Boolean': 'equalTo'
    }
    return method[field.type]
}


/* 查询所有数据 */
export const findAll = async (className, where = { company: sessionStorage.getItem('companyId') }) => {
    const table = new Parse.Query(className == '_User' ? Parse.User : className);
    Object.keys(where).forEach(key => {
        if (className != 'AntdIcon' && className != 'UserLogs' && className != '_Session' && className != 'Permission') {
            if (where[key]) table.equalTo(key, where[key])
        }
    })
    table.limit(10000)
    table.descending('createdAt')
    table.includeAll()
    return (await table.find().catch(err => { handleParseError(err) }))?.filter(
        item => { return item.id })?.map(
            item => { return item.toJSON() })
}

/* 查询列表 */
export const findList = async (query, where = {}) => {
    const { className, pageSize, pageNum, } = query;
    where = Object.assign({}, where, query.where)
    if (!className) return
    const table = new Parse.Query(className == '_User' ? Parse.User : className)
    table.includeAll()
    if (className != 'AntdIcon' && className != 'UserLogs' && className != '_Session') {
        table.equalTo('company', sessionStorage.getItem('companyId'))
    }
    Object.keys(where).forEach(key => {
        if (where[key]) table[machMethod(query.filterFilds[key])](key, where[key])
    })
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
    if (sessionStorage.getItem('companyId')) {
        table.set('company', {
            __type: 'Pointer',
            className: 'Company',
            objectId: sessionStorage.getItem('companyId')
        })
    }
    const acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(true)
    table.setACL(acl)
    return await Capture(table.save()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: (success.get('name') || success.get('objectId')) + '新增成功',
        });
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
    if (sessionStorage.getItem('companyId')) {
        table.set('company', {
            __type: 'Pointer',
            className: 'Company',
            objectId: sessionStorage.getItem('companyId')
        })
    }
    return await Capture(table.save()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: (success.get('name') || success.get('objectId')) + '修改成功',
        });
    })
}

/* 删除一行 */
export const removeById = async ({ className, objectId }) => {
    const Table = new Parse.Query(className);
    Table.equalTo('objectId', objectId)
    const table = await Table.first();
    return await Capture(table.destroy()).then(success => {
        notification.success({
            message: sessionStorage.getItem('pageName'),
            description: (success.get('name') || success.get('objectId')) + '删除成功',
        });
    })
}