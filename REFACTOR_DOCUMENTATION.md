# EasyERP 系统改造为学创杯个人单机回合制经营模拟系统

## 改造时间
2026年5月1日

## 改造目标
将EasyERP系统改造为【学创杯个人单机回合制经营模拟系统】，第一阶段实施模块清理与禁用。

## 改造原则
1. **只做功能隐藏、菜单下架、接口禁用，不删除底层代码**
2. **保留原有系统架构不变**（前端模板→路由→处理器→服务→MongoDB）
3. **多层防护**：菜单隐藏 + 前端路由禁用 + 后端接口禁用
4. **用户体验**：提示错误信息指导用户

---

## 改造内容详解

### 1. 禁用的模块清单

#### CRM - 线索、商机、客户跟进相关
- **leads** (潜在客户)
- **opportunity** (商机)
- **dealTasks** (交易任务)

#### 外部系统集成、Webhooks
- **integrations** (集成)
- **syncLogs** (同步日志)
- **webhooks** (Webhooks)

#### 项目与任务管理
- **project** (项目管理)
- **projectsDashboard** (项目概览)
- **tasks** (任务)

#### 复杂税务管理、会计凭证
- **taxSettings** (税务设置)
- **journalEntries** (日记账条目)

#### 招聘申请、入职审批、员工合同、休假、考勤
- **jobs** (工程包/招聘)
- **application** (应聘申请)
- **vacation** (假勤/休假)
- **weeklyScheduler** (周期表)
- **wTrack** (工时记录)

#### 多队伍/权限隔离（单用户模式）
- **saas** (SaaS相关)

---

## 实施改造的文件与方法

### 方法1：菜单处理器修改 (handlers/modules.js)
**目的**: 隐藏菜单项，用户看不到禁用功能的菜单入口

**修改内容**:
- 添加 `DISABLED_MODULES` 对象定义所有禁用的模块href
- 在 `getAllModulesByProfile` 回调中过滤菜单：
  - 移除主菜单中的禁用模块
  - 从子菜单中移除禁用项
  - 如果菜单下没有子菜单了则整个移除

```javascript
var DISABLED_MODULES = {
    'leads': true,
    'opportunity': true,
    // ... 其他禁用模块
};

// 在返回结果前过滤
var filteredModules = modules.map(function(parentModule) {
    if (DISABLED_MODULES[parentModule.href]) return null;
    if (parentModule.subModules) {
        parentModule.subModules = parentModule.subModules.filter(
            function(sub) { return !DISABLED_MODULES[sub.href]; }
        );
    }
    return parentModule;
}).filter(function(m) { return m !== null && (!m.subModules || m.subModules.length > 0); });
```

### 方法2：前端路由禁用 (public/js/router.js)
**目的**: 即使用户直接输入URL，也无法访问禁用功能

**修改内容**:
- 添加 `DISABLED_MODULES` 对象定义所有禁用的模块
- 添加 `isModuleDisabled()` 函数检查模块是否被禁用
- 添加 `showDisabledModuleMessage()` 函数显示错误提示
- 在主要路由处理函数开始处检查模块是否被禁用：
  - `goToList()` - 通用列表路由
  - `getList()` - 通用获取列表路由
  - `dashBoardVacation()` - 假勤仪表板
  - `goToIntegrations()` - 集成
  - `goToProjectDashboard()` - 项目概览

如果模块被禁用：
```javascript
if (isModuleDisabled(contentType)) {
    showDisabledModuleMessage();
    Backbone.history.navigate('#easyErp/Dashboard', {replace: true});
    return;
}
```

### 方法3：后端路由与处理器保护 (routes/index.js + helpers/disabledModules.js)
**目的**: 防止API直接被调用访问禁用功能

**修改内容**:
- 创建 `helpers/disabledModules.js` 中间件：
  - `createDisabledModuleMiddleware(moduleName)` 返回Express中间件
  - 中间件检查模块是否被禁用，是则返回 403 Forbidden
  
- 在 `routes/index.js` 中引入中间件并应用到相关路由：
  ```javascript
  var disabledModules = require('../helpers/disabledModules');
  
  // 为禁用的路由添加中间件
  app.use('/leads', disabledModules.createDisabledModuleMiddleware('leads'), leadsRouter);
  app.use('/integrations', disabledModules.createDisabledModuleMiddleware('integrations'), integrationRouter);
  // ... 其他禁用路由
  ```

---

## 技术细节

### 禁用模块列表映射

| 功能名称 | href/模块名 | 路由路径 | 禁用理由 |
|---------|-----------|--------|--------|
| 潜在客户 | leads | /leads | CRM功能 |
| 商机 | opportunity | /opportunities | CRM功能 |
| 交易任务 | dealTasks | /dealTasks | CRM功能 |
| 集成 | integrations | /integration | 外部集成 |
| 同步日志 | syncLogs | /syncLogs | 外部集成 |
| Webhooks | webhooks | /webhooks | 外部集成 |
| 项目管理 | project | /projects | 项目管理 |
| 项目概览 | projectsDashboard | /projectsDashboard | 项目管理 |
| 任务 | tasks | /tasks | 项目管理 |
| 税务设置 | taxSettings | /taxSettings | 复杂税务 |
| 日记账条目 | journalEntries | /journalEntries | 手工会计凭证 |
| 工程包/招聘 | jobs | /jobs | 招聘申请 |
| 应聘申请 | application | /applications | 应聘申请 |
| 假勤/休假 | vacation | /vacation | 休假流程 |
| 周期表 | weeklyScheduler | /weeklyScheduler | 考勤相关 |
| 工时记录 | wTrack | /wTrack | 考勤相关 |

### 错误处理

**后端响应** (403 Forbidden):
```json
{
    "error": "此功能在单机经营模拟系统中已禁用"
}
```

**前端提示**:
弹出错误消息框，并自动重定向到Dashboard首页

---

## 改造影响范围

### 不受影响的功能
- ✅ 仪表板 (Dashboard)
- ✅ 销售管理 (销售订单、报价单、发票等)
- ✅ 采购管理 (采购订单、采购发票等)
- ✅ 库存管理 (库存、出入库等)
- ✅ 财务管理 (除税务设置、日记账条目外)
- ✅ 员工管理 (基础员工信息)
- ✅ 系统设置 (大多数设置功能)
- ✅ 生产制造 (生产工艺、物料清单等)

### 受影响的功能
- ❌ CRM功能 (完全禁用)
- ❌ 外部集成 (完全禁用)
- ❌ 项目管理 (完全禁用)
- ❌ 某些HR功能 (招聘、假勤、考勤等)
- ❌ 高级税务功能 (完全禁用)

---

## 测试清单

- [ ] 菜单中看不到禁用模块的入口
- [ ] 直接访问禁用功能的URL显示错误提示
- [ ] API调用禁用功能的端点返回403错误
- [ ] 用户重定向到Dashboard
- [ ] 已启用功能的菜单和路由正常工作
- [ ] 系统不会因为禁用模块而出现错误

---

## 后续步骤

1. **第二阶段**: 单用户单机模式优化
   - 移除多队伍、竞赛相关逻辑
   - 简化权限系统
   - 单一用户数据隔离

2. **第三阶段**: 回合制经营规则实现
   - 添加回合计时机制
   - 实现经营决策流程
   - 财务报表自动生成

3. **第四阶段**: 业务流程优化
   - 简化流程，适应教学场景
   - 添加教程和指引
   - 数据导出报告

---

## 回滚计划

如果需要恢复禁用的功能：

1. **菜单恢复**: 修改 `handlers/modules.js`，删除或注释掉 `DISABLED_MODULES` 过滤
2. **前端恢复**: 修改 `public/js/router.js`，移除禁用检查
3. **后端恢复**: 修改 `routes/index.js`，移除中间件调用

---

## 相关文件清单

### 已修改文件
- `handlers/modules.js` - 菜单处理器，过滤禁用模块
- `public/js/router.js` - 前端路由，禁用路由访问
- `routes/index.js` - 后端路由配置，添加禁用中间件

### 新建文件
- `helpers/disabledModules.js` - 禁用模块中间件工具

### 无需修改（保持原样）
- 所有业务逻辑处理器 (handlers/)
- 所有服务文件 (services/)
- 所有前端视图 (public/js/views/)
- 所有模板文件 (public/templates/)
- 所有模型文件 (models/)
- 数据库集合定义

---

## 系统架构
```
┌─────────────────────────────────────────────────────┐
│             用户界面 (Browsers)                      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│             前端路由 (public/js/router.js)          │ ← 禁用检查层1
├────────────────────────────────────────────────────┤
│       前端菜单 (public/templates/menu/)             │ ← 隐藏层
├────────────────────────────────────────────────────┤
│          后端路由 (routes/index.js)                 │
│         + 禁用中间件 (helpers/disabledModules.js)  │ ← 禁用检查层2
├────────────────────────────────────────────────────┤
│   处理器 (handlers/) → 服务 (services/)            │
├────────────────────────────────────────────────────┤
│        数据库 (MongoDB - models/)                   │
└────────────────────────────────────────────────────┘
```

---

## 注意事项

1. **前端缓存**: 用户可能需要清除浏览器缓存以看到最新的菜单
2. **移动客户端**: 如有移动应用，需要同时修改
3. **权限体系**: 当前改造不影响现有权限系统，禁用是全局的
4. **数据保留**: 禁用的功能的历史数据不会被删除，只是无法新增或修改
5. **统计分析**: 禁用功能不会在统计分析中出现

---

## 文档版本
- **版本**: 1.0
- **日期**: 2026-05-01
- **改造阶段**: 1 (模块清理与禁用)
