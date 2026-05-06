# EasyERP 简化HR模块 - API文档

## 基础信息

**基础URL**: `http://your-server:3000/employees`

**身份验证**: 所有请求需要有效的会话cookie（accessStackMiddleware）

**响应格式**: JSON

**时间格式**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

---

## API 端点

### 1. 招聘新员工

**请求**
```
POST /employees/hire
```

**身份验证**: 需要
**内容类型**: application/json

**请求体**
```json
{
  "name": {
    "first": "李",
    "last": "四"
  },
  "baseSalary": 6000,
  "workEmail": "lisi@company.com",
  "workPhones": {
    "mobile": "13800138000"
  },
  "department": "507f1f77bcf86cd799439011"
}
```

**必需字段**:
- `name.first` (string) - 员工名字
- `baseSalary` (number) - 月基础薪资

**可选字段**:
- `workEmail` (string) - 工作邮箱
- `workPhones.mobile` (string) - 手机号
- `department` (ObjectId) - 部门ID

**响应成功 (201 Created)**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": {
    "first": "李",
    "last": "四"
  },
  "workEmail": "lisi@company.com",
  "baseSalary": 6000,
  "hireDate": "2024-01-15T10:30:00.000Z",
  "isEmployee": true,
  "isActive": true,
  "department": "507f1f77bcf86cd799439011"
}
```

**响应错误 (400 Bad Request)**
```json
{
  "error": "必须提供员工名字和基础薪资"
}
```

**业务规则**:
- 招聘操作**即时生效**
- 自动设置 `isEmployee=true`, `hireDate=现在`, `isActive=true`
- 无需工作流审批

**示例** (cURL)
```bash
curl -X POST http://localhost:3000/employees/hire \
  -H "Content-Type: application/json" \
  -d '{
    "name": {"first":"李","last":"四"},
    "baseSalary": 6000,
    "workEmail": "lisi@company.com"
  }'
```

---

### 2. 裁员操作

**请求**
```
PUT /employees/{id}/fire
```

**身份验证**: 需要

**URL 参数**:
- `id` (string, required) - 员工ID (ObjectId)

**请求体**: 无

**响应成功 (200 OK)**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": {
    "first": "李",
    "last": "四"
  },
  "baseSalary": 6000,
  "hireDate": "2024-01-15T10:30:00.000Z",
  "fireDate": "2024-02-20T14:22:00.000Z",
  "isEmployee": false,
  "isActive": false
}
```

**响应错误 (400 Bad Request)**
```json
{
  "error": "必须提供员工ID"
}
```

**业务规则**:
- 裁员操作**即时生效**
- 自动设置 `isEmployee=false`, `isActive=false`, `fireDate=现在`
- 离职员工不再计入在册员工统计
- 无需工作流审批

**示例** (cURL)
```bash
curl -X PUT http://localhost:3000/employees/507f1f77bcf86cd799439012/fire \
  -H "Content-Type: application/json"
```

---

### 3. 获取在册员工总数

**请求**
```
GET /employees/cost/active-count
```

**身份验证**: 需要

**查询参数**: 无

**响应成功 (200 OK)**
```json
{
  "count": 15,
  "message": "在册员工总数"
}
```

**业务规则**:
- 统计满足以下条件的员工:
  - `isEmployee = true`
  - `isActive = true`  
  - `fireDate = null` 或 `fireDate > 现在`
- 不包含已离职员工
- 不包含候选人/应聘者

**用途**:
- 实时人力编制管理
- 生产产能计算基数
- HR报表

**示例** (cURL)
```bash
curl http://localhost:3000/employees/cost/active-count
```

**示例** (JavaScript/Node.js)
```javascript
const response = await fetch('/employees/cost/active-count');
const data = await response.json();
console.log(`当前在册员工数: ${data.count}`);
```

---

### 4. 获取月度人力成本

**请求**
```
GET /employees/cost/monthly
```

**身份验证**: 需要

**查询参数**: 无

**响应成功 (200 OK)**
```json
{
  "monthlyCost": 75000,
  "annualCost": 900000,
  "message": "人力成本信息"
}
```

**数据说明**:
- `monthlyCost` (number) - 当月固定人力成本 = 所有在册员工基础薪资之和
- `annualCost` (number) - 年度预估成本 = monthlyCost × 12

**业务规则**:
- 只计算在册员工 (isEmployee=true, isActive=true, 未离职)
- 基础薪资 (`baseSalary`) 为成本单位
- 每回合应自动扣除此成本到财务系统

**用途**:
- 每回合财务自动扣款
- 成本预测和分析
- 利润计算

**示例** (cURL)
```bash
curl http://localhost:3000/employees/cost/monthly
```

**示例** (JavaScript/Node.js)
```javascript
const response = await fetch('/employees/cost/monthly');
const data = await response.json();
console.log(`本月人力成本: ¥${data.monthlyCost}`);
console.log(`年度预估: ¥${data.annualCost}`);
```

---

### 5. 获取在册员工明细及成本

**请求**
```
GET /employees/cost/with-employees
```

**身份验证**: 需要

**查询参数**: 无

**响应成功 (200 OK)**
```json
{
  "employees": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "李 四",
      "department": "销售部",
      "baseSalary": 6000,
      "annualCost": 72000,
      "hireDate": "2024-01-15T10:30:00.000Z",
      "isActive": true
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "王 五",
      "department": "技术部",
      "baseSalary": 8000,
      "annualCost": 96000,
      "hireDate": "2024-01-10T09:00:00.000Z",
      "isActive": true
    }
  ],
  "count": 2,
  "message": "在册员工及其成本信息"
}
```

**字段说明**:
- `_id` (ObjectId) - 员工唯一标识
- `fullName` (string) - 完整名字
- `department` (string) - 部门名称
- `baseSalary` (number) - 月基础薪资
- `annualCost` (number) - 年度成本预估
- `hireDate` (date) - 录用日期
- `isActive` (boolean) - 是否在职

**排序**: 按录用日期倒序 (最新入职在前)

**用途**:
- 人力成本分析和明细
- 管理报表展示
- 部门人力成本对比

**示例** (cURL)
```bash
curl http://localhost:3000/employees/cost/with-employees
```

**示例** (JavaScript/Node.js)
```javascript
const response = await fetch('/employees/cost/with-employees');
const data = await response.json();

data.employees.forEach(emp => {
  console.log(`${emp.fullName}: ¥${emp.baseSalary}/月`);
});

console.log(`总人数: ${data.count}`);
console.log(`总月成本: ¥${data.employees.reduce((sum, e) => sum + e.baseSalary, 0)}`);
```

---

## 错误处理

### 常见错误响应

**400 Bad Request** - 请求参数不正确
```json
{
  "error": "必须提供员工名字和基础薪资"
}
```

**401 Unauthorized** - 未认证或会话过期
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - 权限不足
```json
{
  "error": "Forbidden"
}
```

**404 Not Found** - 员工不存在
```json
{
  "error": "Employee not found"
}
```

**500 Internal Server Error** - 服务器错误
```json
{
  "error": "Internal server error"
}
```

### 错误处理最佳实践
```javascript
fetch('/employees/cost/monthly')
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        // 重定向到登录
        window.location.href = '/login';
      } else if (response.status === 403) {
        alert('您没有权限访问此资源');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .catch(err => console.error('请求失败:', err));
```

---

## 数据模型

### Employee 对象
```typescript
{
  _id: ObjectId,
  name: {
    first: string,
    last: string
  },
  workEmail?: string,
  workPhones?: {
    mobile?: string,
    work?: string
  },
  department?: ObjectId,
  baseSalary: number,           // 月基础薪资
  hireDate: Date,               // 录用日期
  fireDate?: Date,              // 离职日期
  isEmployee: boolean,          // 是否员工身份
  isActive: boolean,            // 是否在职
  totalCompensation?: number,   // 总补偿
  
  // 虚拟属性（非存储）
  annualCost: number,           // baseSalary * 12
  isActiveEmployee: boolean     // 是否真正在职
}
```

---

## 集成示例

### 场景1: 每个回合周期扣除人力成本

```javascript
// 在business cycle处理器中
async function processCycleCosts() {
  const response = await fetch('/employees/cost/monthly');
  const data = await response.json();
  
  // 生成财务凭证
  await fetch('/finance/create-expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'Personnel',
      amount: data.monthlyCost,
      cycleId: currentCycle,
      description: '人力成本支出'
    })
  });
}
```

### 场景2: 根据员工数计算产能

```javascript
// 在production capacity计算中
async function calculateProduction() {
  const response = await fetch('/employees/cost/active-count');
  const data = await response.json();
  
  const capacityPerEmployee = 100;  // 每个员工产能贡献
  const totalCapacity = data.count * capacityPerEmployee;
  
  // 应用产能上限到生产计划
  return Math.min(plannedProduction, totalCapacity);
}
```

### 场景3: 人力成本分析报表

```javascript
// 在报表生成中
async function generateHRReport() {
  const response = await fetch('/employees/cost/with-employees');
  const data = await response.json();
  
  const report = {
    totalEmployees: data.count,
    totalMonthlyCost: data.employees.reduce((sum, e) => sum + e.baseSalary, 0),
    employeeList: data.employees,
    departments: groupByDepartment(data.employees)
  };
  
  return report;
}
```

---

## 性能优化建议

### 数据库索引
```javascript
// 在 models/employee.js 中添加
employeeSchema.index({ isEmployee: 1, isActive: 1, fireDate: 1 });
employeeSchema.index({ department: 1, isEmployee: 1 });
```

### 缓存策略
```javascript
// 使用Redis缓存月度成本（TTL: 5分钟）
cache.get('monthlyCost', async () => {
  return await EmployeeService.getTotalMonthlyCost();
}, { ttl: 300 });
```

### 批量操作
```javascript
// 不推荐：一个一个调用
for (let empId of empIds) {
  await fetch(`/employees/${empId}/fire`, { method: 'PUT' });
}

// 推荐：考虑批量操作API（未来扩展）
await fetch('/employees/bulk-fire', {
  method: 'POST',
  body: JSON.stringify({ employeeIds: empIds })
});
```

---

## 注意事项

1. **实时性**：`getActiveEmployeeCount()` 和 `getTotalMonthlyCost()` 实时查询数据库，适合回合周期结束时调用
2. **事务一致性**：招聘和裁员操作都是即时生效，不需要工作流审批
3. **数据恢复**：一旦执行裁员操作，记录在 `fireDate` 字段，不会删除数据
4. **权限控制**：所有API都需要有效的管理员会话（通过 `accessStackMiddleware`）
5. **审计日志**：建议在处理器中记录所有招聘/裁员操作到审计日志

---

## 常见问题

**Q: 如何查询历史员工（已离职）?**
A: 使用标准的 `/employees` GET 端点，过滤条件 `isActive=false`

**Q: 员工裁员后还能恢复吗?**
A: 可以，通过更新 `isEmployee=true, isActive=true` 恢复

**Q: 如何修改已有员工的薪资?**
A: 使用标准的 `/employees/:id` PATCH 端点更新 `baseSalary` 字段

**Q: 成本计算是否包括奖金和福利?**
A: 不包括，当前系统只计算 `baseSalary`（基础月薪），作为固定刚性成本

**Q: 如何集成到财务系统?**
A: 在回合周期处理中调用 `getTotalMonthlyCost()` 然后创建对应的财务凭证

---

最后更新: 2024年
API版本: 1.0.0
