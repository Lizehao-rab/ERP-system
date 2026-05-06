# Phase 2: 人力资源模块简化总结

## 概述
将EasyERP的人力资源系统从复杂的多功能ERP模块简化为"学创杯个人单机回合制经营模拟系统"所需的简单HR管理系统。

## 用户需求分析
**保留核心能力（3项）：**
1. 人力编制总量管理 - 实时查看在册员工数
2. 招人/裁员操作 - 即时生效，无需审批流程  
3. 固定月度成本自动计算 - 每回合自动扣除薪资支出

**关键业务规则：**
- 招聘和裁员操作**即时生效**（无工作流审批）
- 人力数量受厂房/产能约束（上限）
- 每经营回合自动扣除固定人力刚性成本，计入财务支出
- 人力数量直接影响生产产能上限

---

## Phase 2 实现详情

### 1. 数据模型简化 (models/employee.js)

**删除字段** (~90行)：
- 复杂个人信息：婚姻状态、身份证、地址、社交媒体、照片
- HR流程字段：合同类型、合同日期、假期管理、考勤记录、工作周期
- 复杂薪资字段：工资等级、津贴、福利、税务、复杂补偿计算
- 外部关联：工作职位引用、薪资结构类型、工作流状态

**保留字段** (15个)：
| 字段 | 类型 | 说明 |
|------|------|------|
| name.first | String | 名字 |
| name.last | String | 姓氏 |
| workEmail | String | 工作邮箱 |
| workPhones | Object | 工作电话 |
| department | ObjectId | 部门引用 |
| baseSalary | Number | 基础月薪 |
| hireDate | Date | 录用日期 |
| fireDate | Date | 离职日期 |
| isEmployee | Boolean | 是否员工身份 |
| isActive | Boolean | 是否在职 |
| totalCompensation | Number | 总补偿 |

**新增虚拟属性**：
```javascript
annualCost = baseSalary * 12  // 年度成本
isActiveEmployee = isEmployee && isActive && (!fireDate || fireDate > now)  // 业务活跃状态
```

### 2. 业务逻辑层增强 (services/employee.js)

**新增方法（5个）**：

#### 2.1 hire() - 招人操作
```javascript
this.hire = function(options, callback) {
  // 创建新员工记录
  // 自动设置：isEmployee=true, hireDate=now, isActive=true
  // 返回新创建的员工对象
}
```
**调用示例**：
```javascript
EmployeeService.hire({
  dbName: 'admin',
  name: { first: '张', last: '三' },
  workEmail: 'zhangsan@example.com',
  department: ObjectId('...'),
  baseSalary: 5000
}, callback)
```

#### 2.2 fire() - 裁员操作
```javascript
this.fire = function(_id, options, callback) {
  // 将员工标记为离职
  // 自动设置：isEmployee=false, isActive=false, fireDate=now
  // 返回更新后的员工对象
}
```

#### 2.3 getActiveEmployeeCount() - 在册员工统计
```javascript
this.getActiveEmployeeCount = function(options, callback) {
  // 统计满足条件的员工数：isEmployee=true AND isActive=true AND (fireDate为null或大于当前时间)
  // 返回：数字类型的计数
}
```
**用途**：实时人力编制管理、产能计算基数

#### 2.4 getTotalMonthlyCost() - 月度成本计算
```javascript
this.getTotalMonthlyCost = function(options, callback) {
  // 聚合查询：SUM(baseSalary) for active employees
  // 返回：总月度成本（数字）
}
```
**用途**：每回合财务自动扣款、成本预测

#### 2.5 getActiveEmployeesWithCost() - 员工明细及成本
```javascript
this.getActiveEmployeesWithCost = function(options, callback) {
  // 返回在册员工列表，包含：
  // - _id, 名字, 部门, 基础薪资, 年度成本, 录用日期, 状态
  // 按录用日期倒序排列
}
```
**用途**：人力成本分析、管理报表

**实现细节**：
- 所有方法使用MongoDB聚合管道（$match, $group, $lookup, $project）
- 支持标准callback(err, result)模式
- 完整的错误处理

### 3. HTTP处理器 (handlers/employee.js)

**新增处理函数（5个）**：

#### 3.1 hireEmployee()
```javascript
POST /employees/hire
Body: {
  name: { first: "...", last: "..." },
  baseSalary: 5000,
  workEmail: "...",
  department: ObjectId("...")
}
Response: 201 Created - 员工对象
```

#### 3.2 fireEmployee()
```javascript
PUT /employees/:id/fire
Response: 200 OK - 更新后的员工对象
```

#### 3.3 getActiveEmployeeCount()
```javascript
GET /employees/cost/active-count
Response: 200 OK - { count: 15, message: "在册员工总数" }
```

#### 3.4 getTotalMonthlyCost()
```javascript
GET /employees/cost/monthly
Response: 200 OK - { monthlyCost: 75000, annualCost: 900000, message: "人力成本信息" }
```

#### 3.5 getActiveEmployeesWithCost()
```javascript
GET /employees/cost/with-employees
Response: 200 OK - {
  employees: [
    { _id: "...", fullName: "...", department: "...", baseSalary: 5000, annualCost: 60000, hireDate: "...", isActive: true },
    ...
  ],
  count: 15,
  message: "在册员工及其成本信息"
}
```

### 4. 路由映射 (routes/employee.js)

**新增路由定义**：
```javascript
router.post('/hire', accessStackMiddleware, handler.hireEmployee);
router.put('/:id/fire', accessStackMiddleware, handler.fireEmployee);
router.get('/cost/active-count', accessStackMiddleware, handler.getActiveEmployeeCount);
router.get('/cost/monthly', accessStackMiddleware, handler.getTotalMonthlyCost);
router.get('/cost/with-employees', accessStackMiddleware, handler.getActiveEmployeesWithCost);
```

---

## 架构设计图

```
前端UI (Employee Templates)
        ↓
HTTP API (Routes)
        ↓
Handlers (业务流程)
    ├→ hireEmployee
    ├→ fireEmployee
    ├→ getActiveEmployeeCount
    ├→ getTotalMonthlyCost
    └→ getActiveEmployeesWithCost
        ↓
Services (业务逻辑)
    ├→ hire()              [数据写入]
    ├→ fire()              [数据更新]
    ├→ getActiveEmployeeCount()    [数据查询]
    ├→ getTotalMonthlyCost()       [数据聚合]
    └→ getActiveEmployeesWithCost() [数据聚合]
        ↓
MongoDB
    Collection: Employees
    主要操作：
    - 创建新记录 (hire)
    - 更新离职状态 (fire)
    - 聚合统计 (成本、计数)
```

---

## 集成需求

### 4.1 财务系统集成
**目标**：每经营回合自动扣除人力成本

**集成点**：
- 调用 `EmployeeService.getTotalMonthlyCost()`
- 在财务处理器中自动生成"人力费用"会计凭证
- 每回合周期开始时自动扣款

**建议实现**：
```javascript
// 在回合处理逻辑中添加
EmployeeService.getTotalMonthlyCost({dbName: dbName}, function(err, cost) {
  if (cost > 0) {
    // 生成财务凭证：贷方收入，借方人力费用
    FinanceService.createExpenseEntry({
      dbName: dbName,
      category: 'Personnel',
      amount: cost,
      cycleId: currentCycle,
      description: '人力成本支出'
    }, callback);
  }
});
```

### 4.2 产能系统集成
**目标**：基于员工数量计算生产产能上限

**集成点**：
- 调用 `EmployeeService.getActiveEmployeeCount()`
- 与厂房容纳能力相乘计算产能
- 约束生产计划

**建议实现**：
```javascript
// 产能计算
var capacityPerEmployee = 100;  // 每个员工产能贡献
EmployeeService.getActiveEmployeeCount({dbName: dbName}, function(err, count) {
  var productionCapacity = count * capacityPerEmployee;  // 受员工数影响
  // 应用到生产计划系统
});
```

---

## 测试用例

### 测试场景1: 完整的招聘→裁员流程
```bash
# 1. 招聘员工
POST /employees/hire
{
  "name": { "first": "李", "last": "四" },
  "baseSalary": 6000,
  "workEmail": "lisi@company.com"
}
Response: 201 Created - { _id: "xxx", isEmployee: true, hireDate: "2024-01-01", ... }

# 2. 查询在册员工
GET /employees/cost/active-count
Response: { count: 1 }

# 3. 查询月度成本
GET /employees/cost/monthly
Response: { monthlyCost: 6000, annualCost: 72000 }

# 4. 裁员
PUT /employees/xxx/fire
Response: 200 - { _id: "xxx", isEmployee: false, fireDate: "2024-01-15", ... }

# 5. 验证裁员后
GET /employees/cost/active-count
Response: { count: 0 }

GET /employees/cost/monthly
Response: { monthlyCost: 0 }
```

---

## 代码更改日志

| 文件 | 操作 | 行数 | 说明 |
|------|------|------|------|
| models/employee.js | 修改 | ~100-195 | 简化schema，删除复杂字段 |
| models/employee.js | 修改 | ~145-155 | 添加annualCost和isActiveEmployee虚拟属性 |
| services/employee.js | 添加 | ~341-630 | 添加5个新方法（hire, fire, getActiveEmployeeCount, getTotalMonthlyCost, getActiveEmployeesWithCost） |
| handlers/employee.js | 添加 | ~2342-2448 | 添加5个新的HTTP处理函数 |
| routes/employee.js | 添加 | ~893-945 | 添加5条新路由定义 |

---

## 性能考虑

1. **数据库索引**建议：
```javascript
// 在models/employee.js中考虑添加
employeeSchema.index({ isEmployee: 1, isActive: 1, fireDate: 1 });
employeeSchema.index({ department: 1, isEmployee: 1 });
```

2. **聚合管道优化**：
- getTotalMonthlyCost() 使用 $group 在数据库层完成求和，避免应用层处理
- getActiveEmployeesWithCost() 使用 $sort 在数据库排序

3. **缓存建议**：
- 月度成本可按回合缓存（不频繁变化）
- 员工计数建议缓存5分钟（UI实时性需求）

---

## 未来扩展点

1. **员工分级**：添加员工级别字段，支持不同级别的薪资差异
2. **临时人员**：支持合同工/实习生（baseSalary=0，另行计费）
3. **成本分析**：按部门的成本分摊
4. **绩效奖励**：在固定成本基础上添加浮动成本

---

## 完成状态

✅ Phase 2 核心功能实现完成
- 数据模型简化
- 服务层方法完整
- HTTP API完整
- 路由定义完整

⏳ 待完成工作
- 前端UI模板简化（public/templates/Employees/）
- 财务系统集成（自动扣款逻辑）
- 产能系统集成（员工数→产能上限）
- 集成测试与文档

---

## 快速开始

### 开发环境验证
```bash
# 1. 启动服务器
npm start

# 2. 测试新增API
curl -X POST http://localhost:3000/employees/hire \
  -H "Content-Type: application/json" \
  -d '{
    "name": {"first":"Test","last":"User"},
    "baseSalary":5000
  }'

# 3. 查看成本
curl http://localhost:3000/employees/cost/monthly
```

### 数据库查询示例
```javascript
// MongoDB shell
db.Employees.find({ isEmployee: true, isActive: true })
db.Employees.aggregate([
  { $match: { isEmployee: true, isActive: true } },
  { $group: { _id: null, total: { $sum: "$baseSalary" } } }
])
```

---

最后更新：2024年
作者：EasyERP简化项目组
