# Shumian Vue Admin · Vue 3 低代码管理后台

[![Web CI](https://github.com/shumian916210547/vue_admin/actions/workflows/ci.yml/badge.svg)](https://github.com/shumian916210547/vue_admin/actions/workflows/ci.yml)

一个使用 **Vue 3 + Vue Router + Vuex + Ant Design Vue** 构建的低代码管理端。它通过 Schema、Module、Route 和权限元数据动态生成管理菜单、数据列表和编辑表单，并通过 Express BFF 安全访问后端数据。

> English: A Vue 3 low-code admin frontend for schema-driven CRUD, RBAC, multi-tenant organization scopes, customizable themes, and Ant Design Vue.

**搜索关键词：** Vue 3 Admin、Vue Admin Template、企业后台管理系统、低代码平台、Schema 驱动 CRUD、动态表单、动态路由、RBAC、多租户、组织树、Ant Design Vue、Parse Server、PostgreSQL。

## 核心功能

- 登录、受保护会话、退出登录与个人资料维护。
- 横向/纵向布局、亮/深色模式、Logo、页签、刷新和全屏偏好。
- 5 套主题预设（深海蓝、翡翠绿、暮光紫、暖阳橙、石墨灰）、10 项颜色自定义和可切换毛玻璃效果。
- 企业工作台：首页展示当前账号的登录日历（登录日期蓝色标点）、连续/近 30 日活跃、会话时长、快捷入口、天气和位置服务。
- Module/Route 驱动的动态菜单与页面加载。
- Schema 驱动的动态 CRUD：筛选、分页、查看、新增、编辑、删除、CSV 导出。
- 数据表建模：表、字段、关联、编辑组件、筛选/列表展示配置、页面路由生成与真实数据类运行状态检测。
- 统一界面规范：Ant Design Vue 组件统一使用小尺寸，表单控件提供中文占位提示，表格操作列固定在右侧且保持单行操作。
- 企业组织、成员与岗位：系统管理员分开维护组织树、成员和岗位；成员页采用组织树 + 成员表左右分栏，可切换直属/包含后代节点筛选；成员可关联多个组织、分配一个岗位，并配置多个组织数据范围。
- 在线成员管理：查看成员手机号、上线时间、在线时长和设备信息；支持强制下线与按分钟冻结账号。
- 岗位权限：岗位可配置可访问业务页面，以及页面内查询、新建、编辑、删除、强制下线和冻结等按钮权限；`v-auth`/`v-permission` 只负责显示优化，服务端会再次校验。
- 系统配置恢复：管理员登录时可幂等补齐模块管理、数据表管理、组织管理、成员管理和岗位管理入口，以及历史 Schema 中缺少的字段元数据，不覆盖已有自定义配置。
- 数据表组件配置：`ASelect`、`ATreeSelect`、上传、日期、Pointer 等。
- 企业级体验：统一操作/搜索工具栏、可见公共滚动条、表格横向滚动、图标居中，以及自定义颜色下的 WCAG 对比度安全回退。
- 位置服务：高德地图、工具条和比例尺；未配置 Key 时不会阻塞首页其他功能。
- 可选受控运维看板：仅在配置内部 Dashboard URL 时展示 iframe，默认关闭。
- BFF 适配层：前端不保存 Parse Master Key、数据库凭据或 JWT 密钥。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | Vue 3、Vue Router 4、Vuex 4、Vue CLI 5 |
| UI | Ant Design Vue 3、Sass |
| 网络 | Axios、同源 `/api` BFF |
| 地图 | 高德地图 JavaScript API |
| 后端契约 | Express BFF、Parse Server、PostgreSQL |

## 快速开始

### 环境要求

- Node.js 20+
- 已运行的 `admin_server`（默认 `http://localhost:3000`）
- 可选：高德地图 Web JS API Key；天气功能默认使用公开无密钥服务，可按企业网络策略更换。

```powershell
Copy-Item .env.example .env.local
npm ci
npm run serve
```

开发服务器默认打开在 `http://localhost:4200`，`/api` 会代理到 `http://localhost:3000`。浏览器只应知道 `VUE_APP_API_BASE=/api`；不要在 `.env.local` 或 `public/config.js` 写入数据库 URI、Parse Master Key、JWT 密钥等服务端机密。

```powershell
npm run build
node dist/app.js
```

`npm run build` 会生成生产产物，`node dist/app.js` 可运行内置的依赖无关静态服务器。

## 配置

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VUE_APP_API_BASE` | `/api` | 浏览器访问的 BFF 基础路径。 |
| `VUE_APP_API_PROXY_TARGET` | `http://localhost:3000` | 本地开发代理目标。 |
| `VUE_APP_DASHBOARD_URL` | 空 | 可选、独立保护的 Parse Dashboard 地址；正常部署应保持为空。 |
| `VUE_APP_MAP_KEY` | 空 | 高德地图 Web JS API Key。 |

部署后可通过 `public/config.js`（构建产物中的 `dist/config.js`）设置浏览器安全的 `apiBase`、`dashboardUrl`、`mapKey`、`weather.apiBase`、`weather.ipApi`、`weather.latitude`、`weather.longitude`、`weather.location`，无需重新构建前端。运行时配置不得包含数据库 URI、Parse Master Key、JWT 密钥或其他服务端机密。

## 前端结构

```text
vue_admin/
├─ public/                       # index、运行时 config.js、图标和静态服务器
├─ scripts/                      # 安全检查脚本
├─ src/
│  ├─ assets/scss/               # tokens、全局视觉规范、布局样式
│  ├─ components/                # Layout、CommonPage、CommonTable、CommonForm 等
│  ├─ config/                    # 表格配置
│  ├─ mixins/                    # 页面导航、权限、筛选辅助逻辑
│  ├─ router/                    # 静态路由、动态路由与登录守卫
│  ├─ service/                   # api-client、parse-client、仪表盘、天气和在线成员服务
│  ├─ store/                     # Vuex 系统状态
│  ├─ utils/                     # 主题、CSV、数据字典、通用工具
│  └─ views/                     # 登录、企业工作台、个人中心、模块和数据表页面
├─ .env.example                  # 浏览器安全配置模板
└─ package.json
```

## 质量检查

```powershell
npm run security:check
npm run build
npm run audit:prod
```

## 文档

- [系统使用文档](../docs/SYSTEM_USAGE.md)：登录、数据建模、模块、权限、上传、API 和运维。
- [工作区 README](../README.md)：前后端架构、完整目录和开源发布建议。
- [前端开发约定](AGENTS.md)：组件、样式、安全边界与质量门禁。

若将本前端作为独立仓库发布，请将上述通用文档一并纳入仓库，并在 GitHub/Gitee 设置 `vue3`、`vue-admin`、`low-code`、`rbac`、`ant-design-vue` 等 Topics。

## GitHub 项目主页建议

为方便 GitHub 搜索和技术选型时识别项目定位，建议在仓库 **About** 中使用：

> Vue 3 low-code admin frontend with schema-driven CRUD, RBAC, multi-tenant organization scopes, customizable themes, and Ant Design Vue.

建议设置以下 Topics（按仓库实际能力维护）：

`vue3`、`vue-admin`、`admin-dashboard`、`admin-template`、`low-code`、`schema-driven`、`dynamic-form`、`dynamic-crud`、`rbac`、`multi-tenant`、`organization-tree`、`ant-design-vue`、`parse-server`、`postgresql`、`enterprise-admin`。
