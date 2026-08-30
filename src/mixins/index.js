import { useRouter, useRoute } from "vue-router";
import Parse from "@/service/parse-client";
import { useStore } from "vuex";
import { ref } from "vue";
export function Mixins() {
  const router = useRouter();
  const route = useRoute();
  const store = useStore();
  const historyPage = ref(
    JSON.parse(sessionStorage.getItem("historyPage")) || []
  );

  /**
 * 查询当前会话在指定业务路由上的按钮权限；岗位配置使用 routePermissions 为每个页面分别存储权限，
 * 旧版统一 permissions 记录仍作为兼容回退。没有岗位、未分配权限或路由缺失时返回空数组。
   * @param {string | undefined} id 目标 Route 的 objectId；省略时使用当前路由元数据中的 id。
   * @returns {Promise<string[]>} 当前用户可用于前端体验优化的权限标识数组。
   */
  const queryPermission = async (id) => {
    const currentUser = Parse.User.current();
    const role = currentUser?.get("role");
    const roleId = role?.id || role?.objectId;
    const routeId = id || route.meta?.id;
    if (!roleId || !routeId) return [];

    const query = new Parse.Query("AllotPermission");
    query.containedIn("routes", [
      {
        __type: "Pointer",
        className: "Route",
        objectId: routeId,
      },
    ]);
    query.equalTo("role", roleId);
    const records = await query.find();
    const managedRecords = records.filter((record) => record.get("positionManaged") === true);
    const sources = managedRecords.length ? managedRecords : records;
    return [
      ...new Set(
        sources.flatMap((record) => {
          const routePermissions = record.get("routePermissions");
          return Array.isArray(routePermissions?.[routeId])
            ? routePermissions[routeId]
            : record.get("permissions") || [];
        })
      ),
    ];
  };

  //删除历史数据中的其中一项
  const removeHistoryRoute = (index) => {
    if (historyPage.value.length > 1)
      historyPage.value.splice(index, 1),
        sessionStorage.setItem(
          "historyPage",
          JSON.stringify(historyPage.value)
        );
  };

  //查询历史页面中是否存在
  const hasRoute = (rid) => {
    return historyPage.value.some((item) => {
      return item.pageKey === rid;
    });
  };

  /**
   * 导航到业务页面并同步页签历史；返回 Vue Router 导航 Promise，调用方可等待独立页面完成切换。
   * @param {string} path 目标页面路径，可包含经过编码的查询字符串。
   * @param {string | undefined} pageKey 页签唯一键；缺省时不新增或更新页签。
   * @param {string | undefined} pageName 页签显示名称；与 pageKey 同时提供时写入历史。
   * @returns {Promise<import("vue-router").NavigationFailure | void>} 路由导航结果；导航失败由调用方决定是否提示用户。
   */
  const toPage = (path, pageKey, pageName) => {
    // 直接传入字符串让 Vue Router 解析 query/hash；使用 { path } 会把带 ? 的编辑器地址规范化为无查询参数路径。
    const navigation = router.push(path);
    if (pageKey) sessionStorage.setItem("pageKey", pageKey);
    if (pageName) sessionStorage.setItem("pageName", pageName);
    if (!hasRoute(pageKey))
      historyPage.value.push({ path, pageKey, pageName }),
        sessionStorage.setItem(
          "historyPage",
          JSON.stringify(historyPage.value)
        );
    document.getElementById(pageKey)?.scrollIntoView(true);
    return navigation;
  };

  //获取筛选字段
  /**
   * 
   * @param {*} fields 
   * @returns 
   */
  const getFilterField = (fields) => {
    return Object.keys(fields).filter((field) => {
      return fields[field].isFilter && fields[field].editComponent;
    });
  };

  return {
    toPage,
    queryPermission,
    historyPage,
    removeHistoryRoute,
    getFilterField,
  };
}
