import Parse from 'parse'
const company = 'Bgdt4Nyht5'
import { FindList } from '@/service/service.config';
const strContent = (str) => {
  str = str.toJSON();
  const imgs = str.content.match(/<img[^>]+?src\s*=\s*["']([^"']+)/i) || []
  str.content = str.content.replace(/<img[^>]+>/gi, '')
  str.cover = imgs.length ? ((imgs[0].match(/[^<img>]+?src\s*=\s*["']([^"']+)/gi))[0].replace('src="', '')) : undefined
  return str
}

/* 获取热门推荐旅游攻略 5条 */
export const getHotStrategy = async () => {
  const query = new Parse.Query("TravelStrategy")
  query.equalTo('company', company)
  query.descending('watchNum')
  query.limit(5)
  query.includeAll();
  return (await query.find()).map(item => {
    return strContent(item)
  })
}

/* 获取旅游攻略列表 */
export const getStrategyList = async (params) => {
  const { pageSize, pageNum, sortValue } = params
  const query = new Parse.Query("TravelStrategy")
  query.equalTo('company', company)
  query.limit(pageSize)
  query.skip(pageSize * (pageNum - 1))
  query.descending(sortValue)
  query.includeAll();
  return new FindList((await query.find()).map(item => {
    return strContent(item)
  }), await query.count())
}

/* 查询攻略详情 */
export const queryById = async (id) => {
  const query = new Parse.Query("TravelStrategy")
  query.equalTo('objectId', id)
  query.includeAll();
  const result = await query.first()
  const timer = setTimeout(() => {
    increaseWatchNum(result)
    clearTimeout(timer)
  }, 3000)
  return result.toJSON()
}

/* 查询攻略详情 */
export const queryNoteById = async (id) => {
  const query = new Parse.Query("TravelNotes")
  query.equalTo('objectId', id)
  query.includeAll();
  const result = await query.first()
  const timer = setTimeout(() => {
    increaseWatchNum(result)
    clearTimeout(timer)
  }, 3000)
  return result.toJSON()
}

/* 增加浏览量 */
export const increaseWatchNum = (obj) => {
  obj.set('watchNum', (obj.get('watchNum') || 0) + 1)
  obj.save()
}

/* 发布攻略 */
export const addStrategy = async (params) => {
  const { name, content } = params
  const userId = JSON.parse(sessionStorage.getItem('userInfo')).objectId
  const Strategy = Parse.Object.extend('TravelStrategy')
  const strategy = new Strategy()
  strategy.set('user', {
    __type: "Pointer",
    className: "_User",
    objectId: userId
  })
  strategy.set('company', {
    __type: "Pointer",
    className: "Company",
    objectId: company
  })
  strategy.set('name', name);
  strategy.set('content', content);
  const result = await strategy.save();
  return result
}

/* 发布手记 */
export const addNote = async (params) => {
  const { name, content } = params
  const userId = JSON.parse(sessionStorage.getItem('userInfo')).objectId
  const Note = Parse.Object.extend('TravelNotes')
  const note = new Note()
  note.set('user', {
    __type: "Pointer",
    className: "_User",
    objectId: userId
  })
  note.set('company', {
    __type: "Pointer",
    className: "Company",
    objectId: company
  })
  note.set('name', name);
  note.set('content', content);
  const result = await note.save();
  return result
}

/* 查询手记列表 */
export const getNoteList = async (params) => {
  const { pageSize, pageNum, sortValue } = params
  const query = new Parse.Query("TravelNotes")
  query.equalTo('company', company)
  query.limit(pageSize)
  query.skip(pageSize * (pageNum - 1))
  query.descending(sortValue)
  query.includeAll();
  return new FindList((await query.find()).map(item => {
    return strContent(item)
  }), await query.count())
}

/* 查询手记评论数量 */
export const getCommentNum = async (id) => {
  const query = new Parse.Query("TravelComment")
  query.equalTo('travelNote', id)
  return await query.count()
}

/* 查询手记点赞数量 */
export const getStarNum = async (id) => {
  const query = new Parse.Query("TravelStar")
  query.equalTo('travelNote', id)
  return await query.count()
}

/* 查询是否点赞过手记 */
export const getIsStar = async (id) => {
  const query = new Parse.Query("TravelStar")
  query.equalTo('travelNote', id)
  query.equalTo('user', JSON.parse(sessionStorage.getItem('userInfo')).objectId)
  return (await query.count()) ? true : false
}

/* 点赞手记 */
export const updateStar = async (id) => {
  const TravelStar = Parse.Object.extend("TravelStar")
  const travelStar = new TravelStar()
  travelStar.set('user', {
    __type: "Pointer",
    className: "_User",
    objectId: JSON.parse(sessionStorage.getItem('userInfo')).objectId
  })
  travelStar.set('company', {
    __type: "Pointer",
    className: "Company",
    objectId: company
  })
  travelStar.set('travelNote', {
    __type: "Pointer",
    className: "TravelNotes",
    objectId: id
  })
  return (await travelStar.save())
}

/* 取消点赞 */
export const removeStar = async (id) => {
  const query = new Parse.Query("TravelStar")
  query.equalTo('travelNote', id)
  query.equalTo('user', JSON.parse(sessionStorage.getItem('userInfo')).objectId)
  const obj = await query.first()
  return (await obj.destroy())
}
