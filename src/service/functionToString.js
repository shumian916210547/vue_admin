
export const getAPI = ({ className, fields }) => {
    const ignoreField = ['objectId', 'createdAt', 'updatedAt']
    /* 获取所需要接收的参数 */
    const getParams = (params) => {
        let str = ''
        for (const item of params) {
            if (!ignoreField.includes(item.formState.fieldName)) {
                str += item.formState.fieldName + '=' + item.optionState.defaultValue + ','
            }
        }
        return str.slice(0, -1)
    }

    /* 获取所需要插入的参数 */
    const getWriteField = (params, way) => {
        let str = ''
        const template = (key, value) => `table.set(${key},${value});\n    `
        for (const item of params) {
            if (!ignoreField.includes(item.formState.fieldName)) {
                if (way == 'insert') {
                    if (item.formState.fieldType == 'Pointer') {
                        str += template(`'${item.formState.fieldName}'`, `{
              __type: '${item.formState.fieldType}',
              className: '${item.optionState.targetClass}',
              objectId: ${item.formState.fieldName}
            }`)
                    } else {
                        str += template(`'${item.formState.fieldName}'`, item.formState.fieldName)
                    }
                }
                if (way == 'update') {
                    if (item.formState.fieldType == 'Pointer') {
                        str += template(`'${item.formState.fieldName}'`, `{
              __type: '${item.formState.fieldType}',
              className: '${item.optionState.targetClass}',
              objectId:query.${item.formState.fieldName} ? query.${item.formState.fieldName} : table.get('${item.formState.fieldName}').objectId
            }`)
                    } else {
                        str += template(`'${item.formState.fieldName}'`, `query.${item.formState.fieldName} ? query.${item.formState.fieldName} : table.get('${item.formState.fieldName}')`)
                    }
                }
            }
        }
        return str.replace(/\s+$/, '')
    }

    return `\n
  /* ${className} */
  /* 建议文件名: ${className}.js */

  /* 获取分页数据数据 */
  const find${className}List = async (query) => {
    const { pageSize, pageNum } = query;
    const table = new Parse.Query('${className}');
    table.includeAll();
    table.limit(pageSize || 200);
    table.skip((pageSize || 200) * (pageNum ? (pageNum - 1) : 0));
    table.descending('createdAt');
    return {
      data:(await table.find()).map(item => item.toJSON()),
      total:await table.count()
    };
  }

  /* 查询详情 */
  const find${className}ById = async (query) => {
    const table = new Parse.Query('${className}');
    table.equalTo('objectId', query.id);
    table.includeAll();
    return (await table.first()).toJSON();
  }

  /* 删除指定id */
  const remove${className}ById = async (query) => {
    const table = new Parse.Query('${className}');
    table.equalTo('objectId', query.id);
    const result = await table.first();
    return await result.destroy();
  }

  /* 新增 */
  const insert${className} = async ({${getParams(fields)}})=>{
    const Table = Parse.Object.extend(${className});
    const table = new Table();
    ${getWriteField(fields, 'insert')}
    return (await table.save()).toJSON();
  }

  /* 修改 */
  const update${className}ById = async(query)=>{
    const Table = new Parse.Query('${className}');
    Table.equalTo('objectId', query.objectId);
    Table.includeAll();
    const table = await table.first();
    ${getWriteField(fields, 'update')}
    return (await table.save()).toJSON();
  }

  module.exports = {
    find${className}List, find${className}ById, remove${className}ById, insert${className}, update${className}ById
  }
  `
}