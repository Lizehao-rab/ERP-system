# EasyERP 菜单项完整对应表 (mname ↔ href)

## 菜单项完整列表 (按模块组织)

### 一级菜单 (主菜单)

```
Dashboard      → href: Dashboard
CRM            → href: CRM
Sales          → href: Sales
Purchases      → href: Purchases
Inventory      → href: Inventory
Accounting     → href: Accounting
HR             → href: HR
Manufacturing  → href: Manufacturing
Projects       → href: Projects
Reports        → href: Reports
Integrations   → href: integrations
Settings       → href: Settings
```

---

## 二级菜单 (子菜单)

### CRM System (CRM → 仪表板)
```
Persons                    → Persons
Companies                  → Companies
Leads                      → Leads
Opportunities              → Opportunities
Tasks                      → Tasks
DealTasks                  → DealTasks
```

### Sales Management (Sales → 销售管理)
```
Orders                     → Orders
Quotations                 → Quotations
Invoices                   → Invoices
Payment Terms              → Payment Terms
```

### Purchase Management (Purchases → 采购管理)
```
Purchase Orders            → purchaseOrders
Purchase Invoices          → purchaseInvoices
Payments                   → Payments (supplierPayments)
```

### Inventory Management (Inventory → 库存管理)
```
Products                   → Products
Goods Out Notes            → goodsOutNotes
Goods In Notes             → goodsInNotes
```

### Accounting (Accounting → 财务管理)
```
Journal                    → journal
Chart Of Accounts          → ChartOfAccount
Journal Entries            → journalEntry
Cash Flow                  → cashFlow
Balance Sheet              → balanceSheet
Profit And Loss            → profitAndLoss
Trial Balance              → trialBalance
Close Month                → closeMonth
Cash Book                  → cashBook
Cash Transfer              → cashTransfer
Manual Entry               → manualEntry
```

### HR System (HR → 人力资源)
```
Employees                  → Employees
Applications               → Applications
Job Positions              → JobPositions
Departments                → Departments
Birthdays                  → Birthdays
Vacations                  → Vacation
Attendance                 → Attendance
HR Dashboard               → HrDashboard
```

### Manufacturing (Manufacturing → 生产制造)
```
Work Centers               → workCenters
Routing                    → routing
Bill Of Materials          → billOfMaterials
Goods-out Notes            → goodsOutNotes (same as Inventory)
Stock Correction           → stockCorrections
Stock Returns              → stockReturns
Transfers                  → transfer
```

### Projects (Projects → 项目管理)
```
Project Dashboard          → projectsDashboard
Jobs                       → Jobs
Work Tracks                → wTrack
```

### Reports (Reports → 数据报表)
```
Invoice Aging              → invoiceAging
Sales Reports              → salesReports
Inventory Reports          → inventoryReport
Salary Report              → salaryReport
```

### Integrations (Integrations → 集成)
```
(Single page menu)         → integrations
```

### Settings (Settings → 系统设置)
```
General                    → (dashboard/overview)
Organization Profile       → organizationSettings
Products Configurations    → productSettings
Employees Details          → settingsEmployee
Access Profiles            → Profiles
System Users               → Users
Workflows                  → Workflows
Dashboards                 → dashboards
```

---

## 特殊页面 (不在主菜单中，但有路由)

```
My Profile                 → myProfile
Settings Overview          → settingsOverview
Import File History        → importHistory
Leads Workflow             → LeadsWorkflow
Attendance Management      → Attendance (see HR)
Monthly Hours              → monthHours
Bonus Types                → bonusType
Capacity                   → Capacity
Jobs Dashboard             → jobsDashboard
Payroll Expenses           → PayrollExpenses
Payroll Payments           → PayrollPayments
Revenue Statistics         → Revenue
Efficiency/Hours           → Efficiency
Tax Settings               → taxSettings
Tax Report                 → taxReport
Stock Transactions         → stockTransactions
Stock Inventory            → stockInventory
Warehouse Movements        → warehouseMovements
Warehouse                  → warehouse
Contract Jobs              → contractJobs
Days Off / Vacation        → Vacation (see HR)
Expense Invoice            → ExpensesInvoice
Expense Payments           → ExpensesPayments
Dividend Invoice           → DividendInvoice
Dividend Payments          → DividendPayments
Resolve Conflicts          → resolveConflicts
Write-off                  → WriteOff
Follower List              → followers
Week Scheduler             → weeklyScheduler
Scheduled Pay              → scheduledPay
```

---

## 完整 CSV 格式 (用于数据导入)

```csv
mname,href,parent_href,type,中文名称,模块分类
Dashboard,Dashboard,,parent,仪表板,Dashboard
CRM,CRM,,parent,CRM系统,CRM
Persons,Persons,CRM,child,联系人,CRM
Companies,Companies,CRM,child,公司,CRM
Leads,Leads,CRM,child,潜在客户,CRM
Opportunities,Opportunities,CRM,child,商机,CRM
Tasks,Tasks,CRM,child,任务,CRM
DealTasks,DealTasks,CRM,child,交易任务,CRM
Sales,Sales,,parent,销售管理,Sales
Orders,Orders,Sales,child,销售订单,Sales
Quotations,Quotations,Sales,child,报价单,Sales
Invoices,Invoices,Sales,child,发票,Sales
Payment Terms,Payment Terms,Sales,child,付款条款,Sales
Purchases,Purchases,,parent,采购管理,Purchases
Purchase Orders,purchaseOrders,Purchases,child,采购订单,Purchases
Purchase Invoices,purchaseInvoices,Purchases,child,采购发票,Purchases
Payments,supplierPayments,Purchases,child,付款,Purchases
Inventory,Inventory,,parent,库存管理,Inventory
Products,Products,Inventory,child,产品,Inventory
Goods Out Notes,goodsOutNotes,Inventory,child,出库单,Inventory
Goods In Notes,goodsInNotes,Inventory,child,入库单,Inventory
Accounting,Accounting,,parent,财务管理,Accounting
Journal,journal,Accounting,child,日记账,Accounting
Chart Of Accounts,ChartOfAccount,Accounting,child,科目表,Accounting
Journal Entries,journalEntry,Accounting,child,日记账,Accounting
Cash Flow,cashFlow,Accounting,child,现金流,Accounting
Balance Sheet,balanceSheet,Accounting,child,资产负债表,Accounting
Profit And Loss,profitAndLoss,Accounting,child,损益表,Accounting
Trial Balance,trialBalance,Accounting,child,试算表,Accounting
Close Month,closeMonth,Accounting,child,结账,Accounting
Cash Book,cashBook,Accounting,child,现金账簿,Accounting
Cash Transfer,cashTransfer,Accounting,child,现金转账,Accounting
Manual Entry,manualEntry,Accounting,child,手工录入,Accounting
HR,HR,,parent,人力资源,HR
Employees,Employees,HR,child,员工,HR
Applications,Applications,HR,child,应聘申请,HR
Job Positions,JobPositions,HR,child,职位,HR
Departments,Departments,HR,child,部门,HR
Birthdays,Birthdays,HR,child,生日,HR
Vacations,Vacation,HR,child,假勤,HR
Attendance,Attendance,HR,child,考勤,HR
HR Dashboard,HrDashboard,HR,child,人力资源概览,HR
Manufacturing,Manufacturing,,parent,生产制造,Manufacturing
Work Centers,workCenters,Manufacturing,child,工作中心,Manufacturing
Routing,routing,Manufacturing,child,工艺路线,Manufacturing
Bill Of Materials,billOfMaterials,Manufacturing,child,物料清单,Manufacturing
Stock Correction,stockCorrections,Manufacturing,child,库存调整,Manufacturing
Stock Returns,stockReturns,Manufacturing,child,库存退货,Manufacturing
Transfers,transfer,Manufacturing,child,库存调拨,Manufacturing
Projects,Projects,,parent,项目管理,Projects
Project Dashboard,projectsDashboard,Projects,child,项目概览,Projects
Jobs,Jobs,Projects,child,工程包,Projects
Work Tracks,wTrack,Projects,child,工时记录,Projects
Reports,Reports,,parent,数据报表,Reports
Invoice Aging,invoiceAging,Reports,child,发票账龄,Reports
Sales Reports,salesReports,Reports,child,销售报表,Reports
Inventory Reports,inventoryReport,Reports,child,库存报表,Reports
Salary Report,salaryReport,Reports,child,工资报表,Reports
Integrations,integrations,,parent,集成,Integrations
Settings,Settings,,parent,系统设置,Settings
Organization Profile,organizationSettings,Settings,child,组织信息,Settings
Products Configurations,productSettings,Settings,child,产品配置,Settings
Employees Details,settingsEmployee,Settings,child,员工详情,Settings
Access Profiles,Profiles,Settings,child,访问权限,Settings
System Users,Users,Settings,child,系统用户,Settings
Workflows,Workflows,Settings,child,工作流,Settings
Dashboards,dashboards,Settings,child,仪表盘,Settings
```

---

## 重要映射关系

### href 变体 (需要注意的特殊情况)

1. **Orders 与 order**
   - Orders → 订单列表视图
   - order → 单个订单对象

2. **Tasks (多个含义)**
   - Tasks → CRM 中的客户跟进任务
   - Tasks → Projects 中的项目任务
   - DealTasks → 交易相关的任务

3. **Goods Out/In Notes**
   - goodsOutNotes → 出库
   - goodsInNotes → 入库

4. **Accounting 中的账簿**
   - Journal → 日记账列表
   - journalEntry → 日记账条目

5. **Dashboard 单数/复数**
   - Dashboard → 主仪表板
   - dashboards → 自定义仪表板
   - projectsDashboard → 项目概览
   - HrDashboard → HR 概览
   - jobsDashboard → 工程包概览
   - payrollDashboard → 工资概览
   - vacationDashboard → 假勤概览
   - reportsDashboard → 报表概览

6. **Payment 路由**
   - Payments → 通用支付页面
   - supplierPayments → 供应商支付
   - customerPayments → 客户支付
   - purchasePayments → 采购支付
   - PayrollPayments → 工资支付

7. **Vacation vs Vacations**
   - Vacation → 单数形式（后端常用）
   - Vacations → 复数形式（菜单显示）

---

## 前端路由实现

在 `public/js/router.js` 中的对应路由定义：
```javascript
routes: {
    'easyErp/:contentType/list(...)': 'goToList',
    'easyErp/:contentType/form(/:modelId)': 'goToForm',
    'easyErp/:contentType/kanban(...)': 'goToKanban',
    'easyErp/Dashboard': 'goToDashboard',
    'easyErp/myProfile': 'goToUserPages',
    // ... 其他特殊路由
}
```

---

## 数据库集合查询示例

### 获取所有菜单项 (MongoDB)
```javascript
db.modules.find({visible: true}).sort({sequence: 1})
```

### 获取特定用户的菜单 (通过 Profile)
```javascript
// handlers/modules.js 中的聚合管道实现了这个逻辑
```

### 菜单项文档结构
```json
{
    "_id": 1,
    "mname": "Dashboard",
    "href": "Dashboard",
    "sequence": 1,
    "parrent": null,
    "single": false,
    "link": true,
    "visible": true
}
```

