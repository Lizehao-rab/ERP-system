'use strict';

var mongoose = require('mongoose');
var async = require('async');
var moment = require('../public/js/libs/moment/moment');

var ProductionPlanning = function (options) {
    options = options || {};
    this.event = options.event;
    this.models = options.models;
};

/**
 * 计算工作中心产能上限
 * 产能 = 基础产能 × 在岗人数 × 利用率
 */
ProductionPlanning.prototype.calculateCapacityLimit = function (workCenterId, activeEmployeeCount, callback) {
    // 模拟工作中心数据 - 实际应从数据库查询
    var workCenters = {
        'wc-assembly': { basCapacity: 100, maxEmployees: 10 },
        'wc-testing': { basCapacity: 50, maxEmployees: 5 },
        'wc-packing': { basCapacity: 200, maxEmployees: 15 }
    };

    var wc = workCenters[workCenterId] || { basCapacity: 50, maxEmployees: 5 };
    var effectiveEmployees = Math.min(activeEmployeeCount, wc.maxEmployees);
    var utilizationRate = 0.85; // 85% 利用率
    var quarterlyCapacity = Math.floor(wc.basCapacity * effectiveEmployees * utilizationRate * 3); // 3个月/季

    callback({
        success: true,
        workCenterId: workCenterId,
        baseCapacity: wc.basCapacity,
        activeEmployees: effectiveEmployees,
        utilizationRate: (utilizationRate * 100).toFixed(0) + '%',
        quarterlyCapacity: quarterlyCapacity,
        message: '季度产能上限: ' + quarterlyCapacity + ' 个单位 (基础' + wc.basCapacity + 
                 ' × ' + effectiveEmployees + '人 × 85%利用率 × 3月)'
    });
};

/**
 * 获取当前周期已计划产量
 */
ProductionPlanning.prototype.getCyclePlannedQuantity = function (cycleNumber, callback) {
    var ProductionPlan = this.models.productionPlan;
    ProductionPlan.aggregate([
        { $match: { cycleNumber: cycleNumber, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: null,
                totalPlanned: { $sum: '$quantityPlanned' },
                totalCompleted: { $sum: '$quantityCompleted' },
                planCount: { $sum: 1 }
            }
        }
    ], function (err, result) {
        if (err) {
            return callback({
                success: false,
                message: '查询生产计划失败: ' + err.message
            });
        }

        var summary = result[0] || {
            _id: null,
            totalPlanned: 0,
            totalCompleted: 0,
            planCount: 0
        };

        callback({
            success: true,
            cycleNumber: cycleNumber,
            totalPlanned: summary.totalPlanned,
            totalCompleted: summary.totalCompleted,
            planCount: summary.planCount,
            remainingCapacity: Math.max(0, 1000 - summary.totalPlanned) // 假设季度限制1000
        });
    });
};

/**
 * 下达生产计划
 * @param options {productId, productName, quantityPlanned, bomId, workCenterId, cycleNumber, dueDate, createdBy}
 */
ProductionPlanning.prototype.issuProductionPlan = function (options, callback) {
    var self = this;
    var ProductionPlan = this.models.productionPlan;
    var cycleNumber = options.cycleNumber;
    var quantityPlanned = parseInt(options.quantityPlanned);

    // 验证生产数量
    if (!quantityPlanned || quantityPlanned < 1) {
        return callback({
            success: false,
            message: '生产数量必须大于0'
        });
    }

    // 检查产能
    self.getCyclePlannedQuantity(cycleNumber, function (capacityResult) {
        if (!capacityResult.success) {
            return callback(capacityResult);
        }

        if (capacityResult.totalPlanned + quantityPlanned > 1000) {
            return callback({
                success: false,
                message: '生产计划超过季度产能上限。已计划: ' + capacityResult.totalPlanned + 
                        ', 请求: ' + quantityPlanned + ', 剩余可用: ' + capacityResult.remainingCapacity
            });
        }

        // 创建生产计划
        var planStartDate = moment().toDate();
        var planDueDate = options.dueDate ? moment(options.dueDate).toDate() : moment().add(1, 'day').toDate();

        var productionPlan = new ProductionPlan({
            cycleNumber: cycleNumber,
            planCode: 'PL-C' + cycleNumber + '-' + Date.now().toString().slice(-6),
            productId: options.productId,
            productName: options.productName,
            quantityPlanned: quantityPlanned,
            bomId: options.bomId,
            workCenterId: options.workCenterId,
            workCenterName: options.workCenterName,
            productionCycleDays: options.productionCycleDays || 1,
            planStartDate: planStartDate,
            planDueDate: planDueDate,
            status: 'planned',
            createdBy: options.createdBy,
            bomItems: options.bomItems || []
        });

        productionPlan.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '生产计划保存失败: ' + err.message
                });
            }

            callback({
                success: true,
                productionPlan: saved,
                message: '生产计划已下达: ' + saved.planCode + '，计划产量: ' + quantityPlanned + 
                        '，完工期限: ' + moment(planDueDate).format('YYYY-MM-DD')
            });
        });
    });
};

/**
 * 获取周期生产计划列表
 */
ProductionPlanning.prototype.getCycleProductionPlans = function (cycleNumber, status, callback) {
    if (typeof status === 'function') {
        callback = status;
        status = null;
    }

    var ProductionPlan = this.models.productionPlan;
    var query = { cycleNumber: cycleNumber };
    
    if (status) {
        query.status = status;
    }

    ProductionPlan.find(query)
        .sort({ planStartDate: -1 })
        .exec(function (err, plans) {
            if (err) {
                return callback({
                    success: false,
                    message: '查询生产计划失败: ' + err.message
                });
            }

            callback({
                success: true,
                plans: plans,
                count: plans.length
            });
        });
};

/**
 * 获取生产计划详情
 */
ProductionPlanning.prototype.getProductionPlanDetail = function (planId, callback) {
    var ProductionPlan = this.models.productionPlan;
    ProductionPlan.findById(planId, function (err, plan) {
        if (err || !plan) {
            return callback({
                success: false,
                message: '生产计划不存在'
            });
        }

        callback({
            success: true,
            plan: plan
        });
    });
};

/**
 * 更新生产进度
 * @param planId, quantityProduced
 */
ProductionPlanning.prototype.updateProductionProgress = function (planId, quantityProduced, callback) {
    var ProductionPlan = this.models.productionPlan;
    ProductionPlan.findById(planId, function (err, plan) {
        if (err || !plan) {
            return callback({
                success: false,
                message: '生产计划不存在'
            });
        }

        if (quantityProduced > plan.quantityPlanned) {
            return callback({
                success: false,
                message: '生产完成数不能超过计划数'
            });
        }

        plan.quantityProduced = quantityProduced;
        
        // 判断状态
        if (quantityProduced === 0) {
            plan.status = 'planned';
        } else if (quantityProduced < plan.quantityPlanned) {
            plan.status = 'inprogress';
        } else if (quantityProduced === plan.quantityPlanned) {
            plan.status = 'completed';
            plan.actualCompletionDate = new Date();
        }

        plan.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '更新生产进度失败: ' + err.message
                });
            }

            callback({
                success: true,
                plan: saved,
                message: '生产进度已更新: ' + quantityProduced + '/' + plan.quantityPlanned
            });
        });
    });
};

/**
 * 获取生产计划摘要统计
 */
ProductionPlanning.prototype.getCycleProdutionSummary = function (cycleNumber, callback) {
    var ProductionPlan = this.models.productionPlan;
    ProductionPlan.aggregate([
        { $match: { cycleNumber: cycleNumber } },
        {
            $facet: {
                byStatus: [
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            totalPlanned: { $sum: '$quantityPlanned' },
                            totalProduced: { $sum: '$quantityProduced' }
                        }
                    }
                ],
                overall: [
                    {
                        $group: {
                            _id: null,
                            planCount: { $sum: 1 },
                            totalPlanned: { $sum: '$quantityPlanned' },
                            totalProduced: { $sum: '$quantityProduced' },
                            totalCompleted: { $sum: '$quantityCompleted' },
                            avgCompletionRate: { $avg: { $divide: ['$quantityProduced', '$quantityPlanned'] } }
                        }
                    }
                ]
            }
        }
    ], function (err, result) {
        if (err) {
            return callback({
                success: false,
                message: '统计生产摘要失败: ' + err.message
            });
        }

        var summary = {
            byStatus: result[0].byStatus,
            overall: result[0].overall[0] || {
                planCount: 0,
                totalPlanned: 0,
                totalProduced: 0,
                totalCompleted: 0
            }
        };

        callback({
            success: true,
            cycleNumber: cycleNumber,
            summary: summary
        });
    });
};

module.exports = ProductionPlanning;
