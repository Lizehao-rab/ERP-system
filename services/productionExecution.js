'use strict';

var mongoose = require('mongoose');
var async = require('async');
var moment = require('../public/js/libs/moment/moment');

var ProductionExecution = function (options) {
    options = options || {};
    this.event = options.event;
    this.models = options.models;
};

/**
 * 生产完成 - 消耗BOM材料并入库
 * 集成库存管理：自动按BOM从原材料库存扣减
 */
ProductionExecution.prototype.completeProduction = function (planId, quantityToComplete, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    var self = this;
    var ProductionPlan = this.models.productionPlan;

    ProductionPlan.findById(planId, function (err, plan) {
        if (err || !plan) {
            return callback({
                success: false,
                message: '生产计划不存在'
            });
        }

        if (quantityToComplete > plan.quantityPlanned - plan.quantityCompleted) {
            return callback({
                success: false,
                message: '完成数超过剩余计划数'
            });
        }

        // 步骤1: 按BOM消耗材料
        if (plan.bomItems && plan.bomItems.length > 0) {
            self._consumeBomMaterials(plan, quantityToComplete, function (consumeResult) {
                if (!consumeResult.success) {
                    return callback(consumeResult);
                }

                // 步骤2: 更新生产计划
                plan.quantityCompleted += quantityToComplete;
                plan.quantityProduced += quantityToComplete;
                plan.status = plan.quantityCompleted === plan.quantityPlanned ? 'completed' : 'inprogress';
                
                if (plan.status === 'completed') {
                    plan.actualCompletionDate = new Date();
                }

                plan.save(function (err, saved) {
                    if (err) {
                        return callback({
                            success: false,
                            message: '更新生产计划失败: ' + err.message
                        });
                    }

                    // 步骤3: 入库产成品
                    self._addProductToInventory(plan, quantityToComplete, function (inventoryResult) {
                        if (!inventoryResult.success) {
                            return callback(inventoryResult);
                        }

                        callback({
                            success: true,
                            productionPlan: saved,
                            consumedMaterials: consumeResult,
                            producedInventory: inventoryResult,
                            message: '生产完成并入库: ' + quantityToComplete + '个单位'
                        });
                    });
                });
            });
        } else {
            // 无BOM，直接入库
            plan.quantityCompleted += quantityToComplete;
            plan.quantityProduced += quantityToComplete;
            plan.status = 'completed';
            plan.actualCompletionDate = new Date();

            plan.save(function (err, saved) {
                if (err) {
                    return callback({
                        success: false,
                        message: '更新生产计划失败: ' + err.message
                    });
                }

                callback({
                    success: true,
                    productionPlan: saved,
                    message: '生产完成并入库: ' + quantityToComplete + '个单位'
                });
            });
        }
    });
};

/**
 * 内部方法: 按BOM消耗材料
 */
ProductionExecution.prototype._consumeBomMaterials = function (plan, quantityToComplete, callback) {
    var InventoryManagement = require('./inventoryManagement');
    var inventoryService = new InventoryManagement({
        models: this.models
    });

    var consumedMaterials = [];
    var totalBomMatters = plan.bomItems.length;
    var completedCount = 0;

    plan.bomItems.forEach(function (bomItem) {
        var quantityToConsume = quantityToComplete * (bomItem.quantityPerUnit || 1);
        
        inventoryService.consumeMaterials(
            bomItem.materialId,
            quantityToConsume,
            plan.cycleNumber,
            function (result) {
                completedCount++;

                if (result.success) {
                    consumedMaterials.push({
                        materialId: bomItem.materialId,
                        materialName: bomItem.materialName,
                        quantityConsumed: quantityToConsume,
                        result: result
                    });
                }

                if (completedCount === totalBomMatters) {
                    callback({
                        success: true,
                        consumedMaterials: consumedMaterials,
                        message: '已按BOM消耗' + consumedMaterials.length + '种原材料'
                    });
                }
            }
        );
    });
};

/**
 * 内部方法: 产成品入库
 */
ProductionExecution.prototype._addProductToInventory = function (plan, quantity, callback) {
    var InventoryManagement = require('./inventoryManagement');
    var inventoryService = new InventoryManagement({
        models: this.models
    });

    // 简化：使用计划中的productId作为产成品
    inventoryService.addProducts(
        plan.productId,
        plan.productName,
        quantity,
        100, // 假设产成品单价100
        plan.cycleNumber,
        null,
        function (result) {
            callback(result);
        }
    );
};

/**
 * 检查并应用生产延期罚款
 * 当生产计划未按期完成时，应用罚款和扣分
 */
ProductionExecution.prototype.checkAndApplyDelayPenalty = function (planId, callback) {
    var ProductionPlan = this.models.productionPlan;
    var now = new Date();

    ProductionPlan.findById(planId, function (err, plan) {
        if (err || !plan) {
            return callback({
                success: false,
                message: '生产计划不存在'
            });
        }

        // 只检查未完成的计划
        if (plan.status === 'completed') {
            return callback({
                success: true,
                isDelayed: false,
                message: '生产计划已完成'
            });
        }

        // 检查是否逾期
        var isDelayed = now > moment(plan.planDueDate).toDate();

        if (!isDelayed) {
            return callback({
                success: true,
                isDelayed: false,
                daysRemaining: moment(plan.planDueDate).diff(moment(now), 'days'),
                message: '生产计划在期限内'
            });
        }

        // 计算罚款
        var daysLate = moment(now).diff(moment(plan.planDueDate), 'days');
        var penaltyAmount = plan.quantityPlanned * 10 * daysLate; // ¥10/个/天罚款
        var scoreDeduction = Math.min(50, 5 * daysLate); // 最多50分罚款

        plan.status = 'delayed';
        plan.contractPenalty = {
            isApplied: true,
            penaltyAmount: penaltyAmount,
            scoreDeduction: scoreDeduction,
            reason: '生产延期 ' + daysLate + ' 天'
        };

        plan.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '应用罚款失败: ' + err.message
                });
            }

            callback({
                success: true,
                isDelayed: true,
                daysLate: daysLate,
                plan: saved,
                penalty: {
                    amount: penaltyAmount,
                    scoreDeduction: scoreDeduction,
                    message: '生产延期罚款: ¥' + penaltyAmount + ', 扣分: ' + scoreDeduction
                }
            });
        });
    });
};

/**
 * 关联销售订单到生产计划
 * 用于跟踪生产是否支持销售履约
 */
ProductionExecution.prototype.linkSalesOrderToProduction = function (planId, virtualOrderId, orderCode, orderQuantity, orderDueDate, callback) {
    var ProductionPlan = this.models.productionPlan;
    ProductionPlan.findById(planId, function (err, plan) {
        if (err || !plan) {
            return callback({
                success: false,
                message: '生产计划不存在'
            });
        }

        // 检查生产能否满足销售
        var unallocatedCapacity = plan.quantityPlanned - plan.quantityCompleted;
        if (orderQuantity > unallocatedCapacity) {
            return callback({
                success: false,
                message: '生产计划剩余产能不足。需要: ' + orderQuantity + ', 可用: ' + unallocatedCapacity
            });
        }

        // 检查生产完工期限是否在销售订单交期前
        var isProdCompleteBefore = moment(plan.planDueDate).isBefore(moment(orderDueDate));
        if (!isProdCompleteBefore) {
            return callback({
                success: false,
                message: '生产完工期晚于销售订单交期，无法满足履约'
            });
        }

        // 添加关联
        if (!plan.linkedVirtualOrders) {
            plan.linkedVirtualOrders = [];
        }

        plan.linkedVirtualOrders.push({
            orderId: virtualOrderId,
            orderCode: orderCode,
            quantity: orderQuantity,
            dueDate: orderDueDate
        });

        plan.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '关联销售订单失败: ' + err.message
                });
            }

            callback({
                success: true,
                productionPlan: saved,
                message: '销售订单已关联到生产计划'
            });
        });
    });
};

/**
 * 获取生产计划完成率统计
 */
ProductionExecution.prototype.getProductionCompletionStats = function (cycleNumber, callback) {
    var ProductionPlan = this.models.productionPlan;
    ProductionPlan.aggregate([
        { $match: { cycleNumber: cycleNumber } },
        {
            $group: {
                _id: null,
                totalPlanned: { $sum: '$quantityPlanned' },
                totalProduced: { $sum: '$quantityProduced' },
                totalCompleted: { $sum: '$quantityCompleted' },
                onTimeCount: {
                    $sum: {
                        $cond: [
                            { $and: [
                                { $eq: ['$status', 'completed'] },
                                { $lte: ['$actualCompletionDate', '$planDueDate'] }
                            ]},
                            1,
                            0
                        ]
                    }
                },
                delayedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0]
                    }
                },
                totalPenalty: {
                    $sum: {
                        $cond: [{ $eq: ['$contractPenalty.isApplied', true] }, '$contractPenalty.penaltyAmount', 0]
                    }
                }
            }
        }
    ], function (err, result) {
        if (err) {
            return callback({
                success: false,
                message: '统计生产完成率失败: ' + err.message
            });
        }

        var stats = result[0] || {
            _id: null,
            totalPlanned: 0,
            totalProduced: 0,
            totalCompleted: 0,
            onTimeCount: 0,
            delayedCount: 0,
            totalPenalty: 0
        };

        var completionRate = stats.totalPlanned > 0 ? 
            Math.round((stats.totalCompleted / stats.totalPlanned) * 100) : 0;
        
        var onTimeRate = (stats.totalPlanned - stats.delayedCount) > 0 ?
            Math.round((stats.onTimeCount / (stats.totalPlanned - stats.delayedCount)) * 100) : 0;

        callback({
            success: true,
            cycleNumber: cycleNumber,
            stats: {
                totalPlanned: stats.totalPlanned,
                totalProduced: stats.totalProduced,
                totalCompleted: stats.totalCompleted,
                completionRate: completionRate + '%',
                onTimeCount: stats.onTimeCount,
                delayedCount: stats.delayedCount,
                onTimeRate: onTimeRate + '%',
                totalPenalty: stats.totalPenalty
            }
        });
    });
};

module.exports = ProductionExecution;
