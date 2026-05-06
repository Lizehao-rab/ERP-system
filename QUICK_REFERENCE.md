# EasyERP 菜单项快速参考 - 完整查询表

## 📋 菜单项总览

**总计**: 12 个主菜单 + 47 个子菜单 = **59 个菜单项**

---

## 🎯 快速查询表

### 按 mname 查询 href

| 菜单名称 (mname) | href 值 | 类型 | 父菜单 | 中文 |
|---|---|---|---|---|
| Dashboard | Dashboard | parent | - | 仪表板 |
| CRM | CRM | parent | - | CRM系统 |
| Sales | Sales | parent | - | 销售管理 |
| Purchases | Purchases | parent | - | 采购管理 |
| Inventory | Inventory | parent | - | 库存管理 |
| Accounting | Accounting | parent | - | 财务管理 |
| HR | HR | parent | - | 人力资源 |
| Manufacturing | Manufacturing | parent | - | 生产制造 |
| Projects | Projects | parent | - | 项目管理 |
| Reports | Reports | parent | - | 数据报表 |
| Integrations | integrations | parent | - | 集成 |
| Settings | Settings | parent | - | 系统设置 |
| Persons | Persons | child | CRM | 联系人 |
| Companies | Companies | child | CRM | 公司 |
| Leads | Leads | child | CRM | 潜在客户 |
| Opportunities | Opportunities | child | CRM | 商机 |
| Tasks | Tasks | child | CRM | 任务 |
| DealTasks | DealTasks | child | CRM | 交易任务 |
| Orders | Orders | child | Sales | 销售订单 |
| Quotations | Quotations | child | Sales | 报价单 |
| Invoices | Invoices | child | Sales | 发票 |
| Payment Terms | paymentTerms | child | Sales | 付款条款 |
| Purchase Orders | purchaseOrders | child | Purchases | 采购订单 |
| Purchase Invoices | purchaseInvoices | child | Purchases | 采购发票 |
| Payments (Supplier) | supplierPayments | child | Purchases | 供应商支付 |
| Products | Products | child | Inventory | 产品 |
| Goods Out Notes | goodsOutNotes | child | Inventory | 出库单 |
| Goods In Notes | goodsInNotes | child | Inventory | 入库单 |
| Journal | journal | child | Accounting | 日记账 |
| Chart Of Accounts | ChartOfAccount | child | Accounting | 科目表 |
| Journal Entries | journalEntry | child | Accounting | 日记账 |
| Cash Flow | cashFlow | child | Accounting | 现金流 |
| Balance Sheet | balanceSheet | child | Accounting | 资产负债表 |
| Profit And Loss | profitAndLoss | child | Accounting | 损益表 |
| Trial Balance | trialBalance | child | Accounting | 试算表 |
| Close Month | closeMonth | child | Accounting | 结账 |
| Cash Book | cashBook | child | Accounting | 现金账簿 |
| Cash Transfer | cashTransfer | child | Accounting | 现金转账 |
| Manual Entry | manualEntry | child | Accounting | 手工录入 |
| Employees | Employees | child | HR | 员工 |
| Applications | Applications | child | HR | 应聘申请 |
| Job Positions | JobPositions | child | HR | 职位 |
| Departments | Departments | child | HR | 部门 |
| Birthdays | Birthdays | child | HR | 生日 |
| Vacations | Vacation | child | HR | 假勤 |
| Attendance | Attendance | child | HR | 考勤 |
| HR Dashboard | HrDashboard | child | HR | 人力资源概览 |
| Work Centers | workCenters | child | Manufacturing | 工作中心 |
| Routing | routing | child | Manufacturing | 工艺路线 |
| Bill Of Materials | billOfMaterials | child | Manufacturing | 物料清单 |
| Stock Correction | stockCorrections | child | Manufacturing | 库存调整 |
| Stock Returns | stockReturns | child | Manufacturing | 库存退货 |
| Transfers | transfer | child | Manufacturing | 库存调拨 |
| Project Dashboard | projectsDashboard | child | Projects | 项目概览 |
| Jobs | Jobs | child | Projects | 工程包 |
| Work Tracks | wTrack | child | Projects | 工时记录 |
| Invoice Aging | invoiceAging | child | Reports | 发票账龄 |
| Sales Reports | salesReports | child | Reports | 销售报表 |
| Inventory Reports | inventoryReport | child | Reports | 库存报表 |
| Salary Report | salaryReport | child | Reports | 工资报表 |
| Organization Profile | organizationSettings | child | Settings | 组织信息 |
| Products Configurations | productSettings | child | Settings | 产品配置 |
| Employees Details | settingsEmployee | child | Settings | 员工详情 |
| Access Profiles | Profiles | child | Settings | 访问权限 |
| System Users | Users | child | Settings | 系统用户 |
| Workflows | Workflows | child | Settings | 工作流 |
| Dashboards | dashboards | child | Settings | 仪表盘 |

---

### 按 href 查询 mname

| href | mname 值 | 类型 | 中文 |
|---|---|---|---|
| Dashboard | Dashboard | parent | 仪表板 |
| CRM | CRM | parent | CRM系统 |
| Sales | Sales | parent | 销售管理 |
| Purchases | Purchases | parent | 采购管理 |
| Inventory | Inventory | parent | 库存管理 |
| Accounting | Accounting | parent | 财务管理 |
| HR | HR | parent | 人力资源 |
| Manufacturing | Manufacturing | parent | 生产制造 |
| Projects | Projects | parent | 项目管理 |
| Reports | Reports | parent | 数据报表 |
| integrations | Integrations | parent | 集成 |
| Settings | Settings | parent | 系统设置 |
| Persons | Persons | child | 联系人 |
| Companies | Companies | child | 公司 |
| Leads | Leads | child | 潜在客户 |
| Opportunities | Opportunities | child | 商机 |
| Tasks | Tasks | child | 任务 |
| DealTasks | DealTasks | child | 交易任务 |
| Orders | Orders | child | 销售订单 |
| Quotations | Quotations | child | 报价单 |
| Invoices | Invoices | child | 发票 |
| paymentTerms | Payment Terms | child | 付款条款 |
| purchaseOrders | Purchase Orders | child | 采购订单 |
| purchaseInvoices | Purchase Invoices | child | 采购发票 |
| supplierPayments | Payments (Supplier) | child | 供应商支付 |
| Products | Products | child | 产品 |
| goodsOutNotes | Goods Out Notes | child | 出库单 |
| goodsInNotes | Goods In Notes | child | 入库单 |
| journal | Journal | child | 日记账 |
| ChartOfAccount | Chart Of Accounts | child | 科目表 |
| journalEntry | Journal Entries | child | 日记账 |
| cashFlow | Cash Flow | child | 现金流 |
| balanceSheet | Balance Sheet | child | 资产负债表 |
| profitAndLoss | Profit And Loss | child | 损益表 |
| trialBalance | Trial Balance | child | 试算表 |
| closeMonth | Close Month | child | 结账 |
| cashBook | Cash Book | child | 现金账簿 |
| cashTransfer | Cash Transfer | child | 现金转账 |
| manualEntry | Manual Entry | child | 手工录入 |
| Employees | Employees | child | 员工 |
| Applications | Applications | child | 应聘申请 |
| JobPositions | Job Positions | child | 职位 |
| Departments | Departments | child | 部门 |
| Birthdays | Birthdays | child | 生日 |
| Vacation | Vacations | child | 假勤 |
| Attendance | Attendance | child | 考勤 |
| HrDashboard | HR Dashboard | child | 人力资源概览 |
| workCenters | Work Centers | child | 工作中心 |
| routing | Routing | child | 工艺路线 |
| billOfMaterials | Bill Of Materials | child | 物料清单 |
| stockCorrections | Stock Correction | child | 库存调整 |
| stockReturns | Stock Returns | child | 库存退货 |
| transfer | Transfers | child | 库存调拨 |
| projectsDashboard | Project Dashboard | child | 项目概览 |
| Jobs | Jobs | child | 工程包 |
| wTrack | Work Tracks | child | 工时记录 |
| invoiceAging | Invoice Aging | child | 发票账龄 |
| salesReports | Sales Reports | child | 销售报表 |
| inventoryReport | Inventory Reports | child | 库存报表 |
| salaryReport | Salary Report | child | 工资报表 |
| organizationSettings | Organization Profile | child | 组织信息 |
| productSettings | Products Configurations | child | 产品配置 |
| settingsEmployee | Employees Details | child | 员工详情 |
| Profiles | Access Profiles | child | 访问权限 |
| Users | System Users | child | 系统用户 |
| Workflows | Workflows | child | 工作流 |
| dashboards | Dashboards | child | 仪表盘 |

---

## 🔗 特殊路由映射 (非菜单项)

这些页面有前端路由但不一定在主菜单中：

| mname | href | 说明 |
|---|---|---|
| My Profile | myProfile | 当前用户的个人资料 |
| Settings Overview | settingsOverview | 设置总览页面 |
| Import History | importHistory | 文件导入历史 |
| Leads Workflow | LeadsWorkflow | 线索工作流管理 |
| Efficiency/Hours | Efficiency | 工作效率统计 |
| Revenue | Revenue | 收入统计分析 |
| Monthly Hours | monthHours | 月度工时统计 |
| Bonus Types | bonusType | 奖金类型设置 |
| Capacity | Capacity | 产能管理 |
| Jobs Dashboard | jobsDashboard | 工程包概览 |
| Payroll Expenses | PayrollExpenses | 工资支出 |
| Payroll Payments | PayrollPayments | 工资支付 |
| Tax Settings | taxSettings | 税务设置 |
| Tax Report | taxReport | 税务报表 |
| Stock Transactions | stockTransactions | 库存交易 |
| Stock Inventory | stockInventory | 库存盘点 |
| Warehouse Movements | warehouseMovements | 仓库移动 |
| Warehouse | warehouse | 仓库管理 |
| Contract Jobs | contractJobs | 合同工程 |
| Expense Invoice | ExpensesInvoice | 费用发票 |
| Expense Payments | ExpensesPayments | 费用支付 |
| Dividend Invoice | DividendInvoice | 股息发票 |
| Dividend Payments | DividendPayments | 股息支付 |
| Resolve Conflicts | resolveConflicts | 冲突解决 |
| Write-off | WriteOff | 资产报废 |
| Follower List | followers | 粉丝/追踪者列表 |
| Week Scheduler | weeklyScheduler | 周计划 |
| Scheduled Pay | scheduledPay | 定时工资 |

---

## 📊 按模块分类统计

| 模块 | 主菜单 | 子菜单数 | 总数 |
|---|---|---|---|
| CRM | 1 | 6 | 7 |
| Sales | 1 | 4 | 5 |
| Purchases | 1 | 3 | 4 |
| Inventory | 1 | 3 | 4 |
| Accounting | 1 | 11 | 12 |
| HR | 1 | 8 | 9 |
| Manufacturing | 1 | 6 | 7 |
| Projects | 1 | 3 | 4 |
| Reports | 1 | 4 | 5 |
| Integrations | 1 | 0 | 1 |
| Settings | 1 | 7 | 8 |
| Dashboard | 1 | 0 | 1 |
| **总计** | **12** | **47** | **59** |

---

## ⚠️ 重要注意事项

### 1. href 大小写敏感
```
✓ ChartOfAccount (正确)
✗ chartofaccount (错误)

✓ DealTasks (正确)
✗ dealTasks (错误)

✓ billOfMaterials (正确)
✗ billofmaterials (错误)
```

### 2. href 命名规则
- 小驼峰: `goodsOutNotes`, `projectsDashboard`, `settingsEmployee`
- 帕斯卡: `Persons`, `Companies`, `Leads`, `Opportunities`
- 全小写: `integrations`, `journal`, `transfer`

### 3. 特殊情况
- **Vacation 单/复数**: 
  - mname: `Vacations` (显示名称)
  - href: `Vacation` (路由)
  
- **Tasks 有多个含义**:
  - `Tasks` = CRM 任务
  - `DealTasks` = 交易任务
  
- **Payments 多个变体**:
  - `Payments` = 通用
  - `supplierPayments` = 供应商支付
  - `customerPayments` = 客户支付

### 4. 菜单权限
菜单项的可见性取决于:
- 用户的 Profile 配置
- 每个模块的 `visible` 字段
- `profileAccess.access.read` 权限

---

## 🔧 如何使用此数据

### 前端路由
```javascript
// public/js/router.js
routes: {
    'easyErp/:contentType/list(...)': 'goToList',
    // contentType 对应 href 值
}

// 导航示例
window.location.hash = '#easyErp/Leads/list';  // 使用 href
```

### 后端 API
```
GET /modules/  // 获取用户有权限的菜单
返回结构: 
{
    _id: 1,
    mname: "Leads",
    href: "Leads",
    subModules: [...]
}
```

### 数据库查询
```javascript
// 获取所有可见菜单
db.modules.find({visible: true}).sort({sequence: 1})

// 获取特定菜单
db.modules.findOne({href: "Leads"})
```

---

## 📝 文件清单

本次生成的完整菜单数据文件：

1. **MENU_ITEMS_MAPPING.md** - 表格化菜单映射
2. **MENU_COMPLETE_MAPPING.md** - 完整映射 + CSV 格式
3. **menu_complete_definition.json** - JSON 定义文件
4. **QUICK_REFERENCE.md** - 本快速参考表

---

## 🎓 用法示例

### 获取 href 根据 mname
```
如果 mname = "Leads"，则 href = "Leads"
如果 mname = "Work Tracks"，则 href = "wTrack"
如果 mname = "Vacations"，则 href = "Vacation"
```

### 获取 mname 根据 href
```
如果 href = "leadS"，则 mname = "Leads"
如果 href = "goodsOutNotes"，则 mname = "Goods Out Notes"
如果 href = "HR"，则 mname = "HR"
```

### 菜单路由跳转
```
前端: #easyErp/{href}/list
后端 API: /modules/
数据库: modules.findOne({href: "Leads"})
```

