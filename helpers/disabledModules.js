/**
 * 禁用模块中间件 - 用于禁用特定功能的API访问
 * 单机经营模拟系统中不需要的功能
 */

var RESPONSES = require('../constants/responses');

// 禁用的模块列表
var DISABLED_MODULES = {
    // CRM - 线索、商机、客户跟进相关
    'leads': true,
    'opportunity': true,
    'dealTasks': true,
    
    // 销售模块 - 手动订单创建、客户创建已禁用，改用虚拟市场订单池
    'orders': true,
    'order': true,
    'customers': true,
    'customer': true,
    'invoices': true,
    'quotations': true,
    
    // 采购模块 - 手动采购已禁用，改用采购池模拟
    'purchaseOrders': true,
    'purchaseInvoices': true,
    'supplier': true,
    
    // 库存仓储模块 - 手动库存操作已禁用，改用库存管理简化版
    'warehouse': true,
    'goodsOutNotes': true,
    'goodsInNotes': true,
    
    // 生产制造模块 - 复杂工艺调整、车间调度已禁用，改用生产计划简化版
    'manufacturingOrders': true,
    'workCentre': true,
    'routing': true,
    'billOfMaterials': true,
    
    // 外部集成
    'integrations': true,
    'syncLogs': true,
    
    // 项目与任务管理
    'project': true,
    'projectsDashboard': true,
    'tasks': true,
    
    // 复杂税务、手工会计凭证
    'manualEntry': true,
    'journalEntries': true,
    'taxSettings': true,
    
    // 招聘、入职、合同、假勤、考勤
    'jobs': true,
    'application': true,
    'vacation': true,
    'weeklyScheduler': true,
    'wTrack': true,
    
    // 多队伍/权限隔离（单用户模式）
    'saas': true,
    'webhooks': true
};

/**
 * 创建禁用中间件
 * @param {String} moduleName - 模块名称
 * @returns {Function} Express中间件函数
 */
module.exports.createDisabledModuleMiddleware = function(moduleName) {
    return function(req, res, next) {
        if (DISABLED_MODULES[moduleName]) {
            return res.status(403).json({
                error: '此功能在单机经营模拟系统中已禁用'
            });
        }
        next();
    };
};

/**
 * 获取禁用模块检查函数
 */
module.exports.isModuleDisabled = function(moduleName) {
    return DISABLED_MODULES[moduleName] === true;
};

/**
 * 获取禁用响应
 */
module.exports.getDisabledResponse = function() {
    return {
        error: '此功能在单机经营模拟系统中已禁用',
        statusCode: 403
    };
};
