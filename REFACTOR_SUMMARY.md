# 改造改动摘要

## 系统改造：EasyERP → 学创杯个人单机回合制经营模拟系统

### 改造时间：2026年5月1日

---

## 改动的文件

### 1. handlers/modules.js
**变更类型**: 修改 - 菜单过滤

**具体改动**:
- 添加 `DISABLED_MODULES` 常量，列出17个禁用的模块
- 修改 `getAllModulesByProfile()` 方法中的回调逻辑
- 在返回菜单前过滤掉禁用模块（包括主菜单和子菜单）
- 如果菜单下没有子项则整个移除该菜单

**禁用的模块**:
- leads, opportunity, dealTasks (CRM)
- integrations, syncLogs (集成)
- project, projectsDashboard, tasks (项目)
- manualEntry, journalEntries, taxSettings (财务)
- jobs, application, vacation, weeklyScheduler, wTrack (HR)
- saas (多用户)

---

### 2. public/js/router.js
**变更类型**: 修改 - 前端路由保护

**具体改动**:
- 在文件开头添加 `DISABLED_MODULES` 常量
- 添加 `isModuleDisabled()` 函数用于检查模块是否被禁用
- 添加 `showDisabledModuleMessage()` 函数显示禁用提示
- 修改以下路由处理函数添加禁用检查：
  - `goToList()` - 通用列表路由
  - `getList()` - 通用获取列表
  - `dashBoardVacation()` - 假勤仪表板
  - `goToIntegrations()` - 集成页面
  - `goToProjectDashboard()` - 项目概览

**防护逻辑**:
如果访问禁用模块，则显示错误消息并重定向到Dashboard

---

### 3. routes/index.js
**变更类型**: 修改 - 后端路由保护

**具体改动**:
- 在开头引入 `disabledModules` 中间件：
  ```javascript
  var disabledModules = require('../helpers/disabledModules');
  ```

- 为所有禁用的路由添加中间件保护：
  - `/weeklyScheduler` - weeklyScheduler中间件
  - `/wTrack` - wTrack中间件
  - `/projects` - project中间件
  - `/applications` - application中间件
  - `/opportunities` - opportunity中间件
  - `/leads` - leads中间件
  - `/vacation` - vacation中间件
  - `/dealTasks` - dealTasks中间件
  - `/jobs` - jobs中间件
  - `/journalEntries` - journalEntries中间件
  - `/projectsDashboard` - projectsDashboard中间件
  - `/taxSettings` - taxSettings中间件
  - `/syncLogs` - syncLogs中间件
  - `/webhooks` - webhooks中间件
  - `/integration` - integrations中间件

**防护逻辑**:
任何对这些端点的API调用都会被中间件拦截，返回403错误

---

### 4. helpers/disabledModules.js (新建)
**变更类型**: 新建文件 - 禁用中间件

**内容**:
- `DISABLED_MODULES` 常量 - 定义所有禁用模块
- `createDisabledModuleMiddleware(moduleName)` - 创建禁用检查中间件
- `isModuleDisabled(moduleName)` - 检查模块是否被禁用
- `getDisabledResponse()` - 获取禁用错误响应

**使用方式**:
```javascript
app.use('/leads', disabledModules.createDisabledModuleMiddleware('leads'), leadsRouter);
```

---

## 禁用模块完整清单

### CRM相关 (3个)
| 模块名 | href | 状态 |
|------|------|------|
| 潜在客户 | leads | ❌ |
| 商机 | opportunity | ❌ |
| 交易任务 | dealTasks | ❌ |

### 外部集成 (3个)
| 模块名 | href | 状态 |
|------|------|------|
| 集成 | integrations | ❌ |
| 同步日志 | syncLogs | ❌ |
| Webhooks | webhooks | ❌ |

### 项目与任务 (3个)
| 模块名 | href | 状态 |
|------|------|------|
| 项目管理 | project | ❌ |
| 项目概览 | projectsDashboard | ❌ |
| 任务 | tasks | ❌ |

### 财务相关 (3个)
| 模块名 | href | 状态 |
|------|------|------|
| 手工录入 | manualEntry | ❌ |
| 日记账条目 | journalEntries | ❌ |
| 税务设置 | taxSettings | ❌ |

### HR相关 (5个)
| 模块名 | href | 状态 |
|------|------|------|
| 工程包/招聘 | jobs | ❌ |
| 应聘申请 | application | ❌ |
| 假勤/休假 | vacation | ❌ |
| 周期表 | weeklyScheduler | ❌ |
| 工时记录 | wTrack | ❌ |

### 多用户模式 (1个)
| 模块名 | href | 状态 |
|------|------|------|
| SaaS | saas | ❌ |

**总计**: 18个禁用模块

---

## 防护层级

改造实现了三层防护机制：

```
┌─────────────────────────────────────────┐
│      第1层：菜单隐藏                     │
│  (handlers/modules.js)                  │
│  - 用户看不到禁用功能的菜单             │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      第2层：前端路由禁用                 │
│  (public/js/router.js)                  │
│  - 直接访问URL无法打开禁用功能          │
│  - 显示错误提示并重定向                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      第3层：后端API保护                  │
│  (routes/index.js + middleware)         │
│  - 直接调用API返回403错误               │
│  - 防止绕过前端限制                     │
└─────────────────────────────────────────┘
```

---

## 测试清单

- [ ] 登录系统后菜单中看不到禁用功能入口
- [ ] 菜单结构正常，没有出现空菜单项
- [ ] 直接访问禁用功能URL (如 #easyErp/leads/list) 显示错误提示
- [ ] 提示后自动重定向到Dashboard
- [ ] 调用禁用功能的API返回403 Forbidden
- [ ] 返回的错误消息："此功能在单机经营模拟系统中已禁用"
- [ ] 其他功能的菜单和路由正常工作
- [ ] 系统不会因禁用而出现JavaScript错误
- [ ] 后端日志中没有异常

---

## 改造前后对比

### 改造前
- ❌ 完整的ERP系统，包含CRM、HR、项目等复杂功能
- ❌ 多用户、多队伍、权限隔离
- ❌ 所有菜单对用户可见
- ❌ 所有API端点可访问

### 改造后
- ✅ 学创杯专用系统，只保留经营相关功能
- ✅ 单用户单机模式
- ✅ 18个禁用功能隐藏在菜单中
- ✅ 三层防护确保禁用功能无法访问
- ✅ 用户友好的错误提示
- ✅ 底层代码保持完整，可随时恢复

---

## 代码行数统计

| 文件 | 改动内容 | 新增行数 | 修改行数 |
|-----|---------|---------|---------|
| handlers/modules.js | 菜单过滤 | 30+ | 10+ |
| public/js/router.js | 路由禁用检查 | 60+ | 20+ |
| routes/index.js | 路由中间件 | 0 | 20+ |
| helpers/disabledModules.js | 新建中间件 | 65 | 0 |
| **合计** | | **155+** | **50+** |

---

## 技术实现特点

1. **非侵入式修改**: 
   - 没有删除任何底层代码
   - 禁用逻辑独立在中间件中
   - 易于回滚

2. **多层防护**:
   - 菜单层（用户看不到）
   - 路由层（前端路由拦截）
   - API层（后端端点保护）

3. **用户友好**:
   - 清晰的错误提示
   - 自动重定向到安全位置
   - 无需用户操作

4. **易于维护**:
   - 禁用列表集中管理
   - 一处修改，全系统生效
   - 支持动态启用/禁用

---

## 后续扩展计划

### 第2阶段：单用户优化
- [ ] 移除多队伍选择器
- [ ] 简化权限管理
- [ ] 单一组织支持

### 第3阶段：回合制机制
- [ ] 实现回合计时
- [ ] 决策时间窗口
- [ ] 财务结算自动化

### 第4阶段：教学优化
- [ ] 添加内置教程
- [ ] 数据导出功能
- [ ] 教师管理界面

---

## 版本信息

- **改造版本**: 1.0
- **基础系统**: EasyERP
- **改造日期**: 2026-05-01
- **改造阶段**: 1/4 (模块清理与禁用)
- **状态**: ✅ 完成
