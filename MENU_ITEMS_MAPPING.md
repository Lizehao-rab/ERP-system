# EasyERP 完整菜单项映射表

## 数据结构说明
- **mname**: 菜单显示名称（英文）
- **href**: 路由名称/URL 路径
- **type**: 菜单类型 (parent=父菜单, child=子菜单)
- **中文名称**: 根据 LeftMenuTemplate.html 翻译表

---

## 一级菜单项（顶级菜单）

### 1. Dashboard 仪表板
| mname | href | type | 中文 |
|-------|------|------|------|
| Dashboard | Dashboard | parent | 仪表板 |

---

### 2. CRM CRM系统
| mname | href | type | 中文 |
|-------|------|------|------|
| CRM | CRM | parent | CRM系统 |

#### CRM 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Persons | Persons | child | 联系人 |
| Companies | Companies | child | 公司 |
| Leads | Leads | child | 潜在客户 |
| Opportunities | Opportunities | child | 商机 |
| Tasks | Tasks | child | 任务 |
| DealTasks | DealTasks | child | 交易任务 |

---

### 3. Sales 销售管理
| mname | href | type | 中文 |
|-------|------|------|------|
| Sales | Sales | parent | 销售管理 |

#### Sales 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Orders | Orders | child | 销售订单 |
| Quotations | Quotations | child | 报价单 |
| Invoices | Invoices | child | 发票 |
| Payment Terms | Payment Terms | child | 付款条款 |

---

### 4. Purchases 采购管理
| mname | href | type | 中文 |
|-------|------|------|------|
| Purchases | Purchases | parent | 采购管理 |

#### Purchases 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Purchase Orders | Purchase Orders | child | 采购订单 |
| Purchase Invoices | Purchase Invoices | child | 采购发票 |
| Payments | Payments | child | 付款 |

---

### 5. Inventory 库存管理
| mname | href | type | 中文 |
|-------|------|------|------|
| Inventory | Inventory | parent | 库存管理 |

#### Inventory 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Products | Products | child | 产品 |
| Goods Out Notes | Goods Out Notes | child | 出库单 |
| Goods In Notes | Goods In Notes | child | 入库单 |

---

### 6. Accounting 财务管理
| mname | href | type | 中文 |
|-------|------|------|------|
| Accounting | Accounting | parent | 财务管理 |

#### Accounting 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Journal | Journal | child | 日记账 |
| Chart Of Accounts | Chart Of Accounts | child | 科目表 |
| Chart of Accounts | ChartOfAccount | child | 科目表 |
| Journal Entries | Journal Entries | child | 日记账 |
| Cash Flow | Cash Flow | child | 现金流 |
| Balance Sheet | Balance Sheet | child | 资产负债表 |
| Profit And Loss | Profit And Loss | child | 损益表 |
| Trial Balance | Trial Balance | child | 试算表 |
| Close Month | Close Month | child | 结账 |
| Cash Book | Cash Book | child | 现金账簿 |
| Cash Transfer | Cash Transfer | child | 现金转账 |
| Manual Entry | Manual Entry | child | 手工录入 |

---

### 7. HR 人力资源
| mname | href | type | 中文 |
|-------|------|------|------|
| HR | HR | parent | 人力资源 |

#### HR 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Employees | Employees | child | 员工 |
| Applications | Applications | child | 应聘申请 |
| Job Positions | Job Positions | child | 职位 |
| Departments | Departments | child | 部门 |
| Birthdays | Birthdays | child | 生日 |
| Vacations | Vacations | child | 假勤 |
| Attendance | Attendance | child | 考勤 |
| HR Dashboard | HR Dashboard | child | 人力资源概览 |

---

### 8. Manufacturing 生产制造
| mname | href | type | 中文 |
|-------|------|------|------|
| Manufacturing | Manufacturing | parent | 生产制造 |

#### Manufacturing 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Work Centers | Work Centers | child | 工作中心 |
| Routing | Routing | child | 工艺路线 |
| Bill Of Materials | Bill Of Materials | child | 物料清单 |
| Goods-out Notes | Goods-out Notes | child | 出库单 |
| Stock Correction | Stock Correction | child | 库存调整 |
| Stock Returns | Stock Returns | child | 库存退货 |
| Transfers | Transfers | child | 库存调拨 |

---

### 9. Projects 项目管理
| mname | href | type | 中文 |
|-------|------|------|------|
| Projects | Projects | parent | 项目管理 |

#### Projects 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Project Dashboard | Project Dashboard | child | 项目概览 |
| Jobs | Jobs | child | 工程包 |
| Work Tracks | Work Tracks | child | 工时记录 |

---

### 10. Reports 数据报表
| mname | href | type | 中文 |
|-------|------|------|------|
| Reports | Reports | parent | 数据报表 |

#### Reports 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| Invoice Aging | Invoice Aging | child | 发票账龄 |

---

### 11. Integrations 集成
| mname | href | type | 中文 |
|-------|------|------|------|
| Integrations | integrations | parent | 集成 |

---

### 12. Settings 系统设置
| mname | href | type | 中文 |
|-------|------|------|------|
| Settings | Settings | parent | 系统设置 |

#### Settings 子菜单:
| mname | href | type | 中文 |
|-------|------|------|------|
| General | General | child | 综合 |
| Organization Profile | Organization Profile | child | 组织信息 |
| Products Configurations | Products Configurations | child | 产品配置 |
| Employees Details | Employees Details | child | 员工详情 |
| Access Profiles | Access Profiles | child | 访问权限 |
| System Users | System Users | child | 系统用户 |
| Workflows | Workflows | child | 工作流 |
| Dashboards | Dashboards | child | 仪表盘 |

---

## 特殊路由映射

### 单个页面路由（非菜单项）
| mname | href | 说明 |
|-------|------|------|
| myProfile | myProfile | 我的资料 |
| settingsEmployee | settingsEmployee | 员工设置 |
| settingsOverview | settingsOverview | 设置总览 |
| organizationSettings | organizationSettings | 组织设置 |
| Efficiency | Efficiency | 工作效率 |
| Revenue | Revenue | 收入统计 |
| Profiles | Profiles | 访问权限配置 |
| LeadsWorkflow | LeadsWorkflow | 线索工作流 |

---

## 数据来源与映射规则

### 来源文件
1. **LeftMenuTemplate.html** - 菜单翻译和模板结构
2. **public/js/constants.js** - 路由常量定义
3. **public/templates/** - 模板目录结构
4. **handlers/modules.js** - 菜单处理逻辑
5. **routes/modules.js** - API 响应示例

### 映射规则
- mname (显示名称) 来自翻译表或常量定义
- href (路由) 对应于前端模板目录名或后端路由定义
- 子菜单通过 parrent 字段关联到父菜单
- 翻译表中的键值对用于生成显示名称

---

## 完整 JSON 格式示例

```json
{
  "Dashboard": {
    "_id": 1,
    "mname": "Dashboard",
    "href": "Dashboard",
    "single": false,
    "link": true,
    "sequence": 1,
    "subModules": []
  },
  "CRM": {
    "_id": 19,
    "mname": "CRM",
    "href": "CRM",
    "single": false,
    "link": false,
    "sequence": 2,
    "subModules": [
      {
        "_id": 20,
        "mname": "Persons",
        "href": "Persons",
        "single": false,
        "link": true,
        "sequence": 1
      },
      {
        "_id": 21,
        "mname": "Leads",
        "href": "Leads",
        "single": false,
        "link": true,
        "sequence": 2
      },
      ...
    ]
  },
  ...
}
```

---

## 注意事项

1. **动态加载**: 实际的菜单项是从 MongoDB 的 modules 集合动态加载的
2. **权限控制**: 只有用户有权限访问的菜单项才会显示（通过 profile.profileAccess 控制）
3. **翻译**: 菜单显示名称在前端模板中通过 translateMenu() 函数进行翻译
4. **隐藏菜单**: 某些菜单项可能因 visible 属性为 false 而被隐藏
5. **前端路由**: 菜单 href 对应的前端路由定义在 public/js/router.js 中

