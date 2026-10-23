# Vue Admin 开发约定

本文件适用于 `vue_admin`。它是 Shumian Vue Admin 的 Vue 3 管理端；如果作为独立仓库使用，本文件应随代码一同提交。

## 结构

```text
vue_admin/
├─ public/                       # 浏览器安全的运行时配置和静态资源
├─ scripts/                      # 安全检查
├─ src/
│  ├─ assets/scss/               # tokens.scss、global.scss、Layout.scss
│  ├─ components/                # 布局、动态表格、动态表单、上传、协同表格与 camera 播放器
│  ├─ config/                    # 表格配置
│  ├─ mixins/                    # 导航、权限、筛选辅助逻辑
│  ├─ router/                    # 静态路由、动态路由、守卫
│  ├─ service/                   # BFF 请求、Parse 兼容适配层、天气、在线成员与协同表格服务
│  ├─ store/                     # Vuex 状态
│  ├─ utils/                     # CSV、请求、数据字典与通用工具
│  └─ views/                     # system/ 平台配置；camera/ 视频组织、设备、成员、1–16分屏；collab/ 协同表格
├─ .env.example                  # 无机密的浏览器配置模板
├─ README.md                     # 功能、配置、结构和快速开始
└─ package.json
```

## 规则

- 使用 Vue 3 Composition API 与 `<script setup>`，2 空格缩进、双引号、分号和多行尾随逗号。
- **函数与参数注释为强制要求：** 每个函数、事件处理器、组合式函数、异步请求和 `defineExpose` 方法都要说明用途、参数名称/类型/可选性、返回值、异常或状态副作用；复杂对象、Schema 字段、权限常量与非直观变量也必须说明结构和业务含义。自解释的简单局部变量无需逐行重复注释，但不能省略函数和参数说明。
- 组件用 PascalCase；页面放在 `src/views`，可复用组件放在 `src/components`；导入 `src` 内模块使用 `@/` 别名。
- 静态路由写在 `router/staticRoute.js`，动态路由由 `router/dynamicRoute.js` 装配。`pageComponent` 必须对应真实的 `views` 或 `components` 文件。
- Schema 驱动页面优先复用 `CommonPage`、`CommonTable`、`CommonForm` 和 `Wrapper`，不要复制 CRUD 逻辑。
- 浏览器只可通过 `service/api-client.js` 与 `service/parse-client.js` 调用同源 `/api`。禁止直接访问 Parse Server，禁止在浏览器保存数据库 URI、Master Key、JWT 密钥或其他服务端机密。
- 不直接篡改认证上下文；使用 `Parse.User.logIn`、`restore`、`logOut` 适配接口。前端按钮权限不是安全边界，所有写操作仍由后端授权。
- 表单要有中文标签、占位和校验提示；异步操作展示加载/成功/失败状态；删除和 Schema 变更必须中文二次确认。删除调试 `console.log` 与未使用 import。
- 视觉令牌只定义在 `assets/scss/tokens.scss`，全局覆写在 `global.scss`，布局样式在 `Layout.scss`；局部样式用 scoped SCSS 和语义化 `block__element` 类名，新增页面需适配窄屏。
- CSV 导出继续使用 `utils/csv.js` 的公式注入转义。未经安全评审不恢复高风险富文本或 XLSX 依赖。
- 新增功能、目录或配置后同步更新 `README.md` 和工作区的 `docs/SYSTEM_USAGE.md`；绝不提交 `.env`、真实凭据、用户数据或构建产物。

## 验证

```powershell
npm run security:check
npm run build
npm run audit:prod
```
