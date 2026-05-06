'use strict';

var mongoose = require('mongoose');
var purchaseOrderSchema = mongoose.Schemas.purchaseOrder;
var materialInventorySchema = mongoose.Schemas.materialInventory;
var moment = require('../public/js/libs/moment/moment');

var PurchasingSimulation = function (options) {
    options = options || {};
    this.event = options.event;
    this.models = options.models;
};

/**
 * 模拟市场原材料价格浮动 ±5-10%
 */
PurchasingSimulation.prototype.getMaterialPriceFluctuation = function (basePrice) {
    var fluctuationPercent = (Math.random() * 0.10) - 0.05; // -5% to +5%
    return Math.round(basePrice * (1 + fluctuationPercent) * 100) / 100;
};

/**
 * 获取本周期采购数量上限（基于库存容量）
 */
PurchasingSimulation.prototype.getCyclePurchaseLimit = function () {
    return 500; // 固定上限：500个单位/周期
};

/**
 * 创建采购订单 - 直接扣现金、自动入库
 * @param options { materialId, materialName, unitPrice, quantity, cycleNumber, cash, createdBy }
 * @returns {Object} { success, purchaseOrder, materialInventory, remainingCash, message }
 */
PurchasingSimulation.prototype.createPurchaseOrder = function (options, callback) {
    var self = this;
    var materialId = options.materialId;
    var materialName = options.materialName;
    var baseUnitPrice = options.unitPrice || 100;
    var quantity = options.quantity;
    var cycleNumber = options.cycleNumber;
    var currentCash = options.cash || 0;
    var createdBy = options.createdBy;

    // 验证采购数量
    if (!quantity || quantity < 1) {
        return callback({
            success: false,
            message: '采购数量必须大于0'
        });
    }

    var purchaseLimit = self.getCyclePurchaseLimit();
    if (quantity > purchaseLimit) {
        return callback({
            success: false,
            message: '采购数量超过本周期上限：' + purchaseLimit,
            limit: purchaseLimit
        });
    }

    // 计算价格浮动
    var fluctuatedPrice = self.getMaterialPriceFluctuation(baseUnitPrice);
    var totalAmount = Math.round(quantity * fluctuatedPrice * 100) / 100;

    // 验证现金余额
    if (currentCash < totalAmount) {
        return callback({
            success: false,
            message: '现金不足。需要: ¥' + totalAmount + ', 可用: ¥' + currentCash,
            requiredCash: totalAmount,
            availableCash: currentCash
        });
    }

    // 创建采购订单
    var PurchaseOrderModel = this.models.purchaseOrder;
    var purchaseOrder = new PurchaseOrderModel({
        cycleNumber: cycleNumber,
        materialId: materialId,
        materialName: materialName,
        quantityOrdered: quantity,
        quantityReceived: quantity, // 自动接收
        unitPrice: fluctuatedPrice,
        totalAmount: totalAmount,
        status: 'received',
        paymentStatus: 'paid',
        expectedDeliveryDate: moment().add(2, 'days').toDate(),
        actualDeliveryDate: moment().toDate(),
        isFullyReceived: true,
        createdBy: createdBy,
        notes: '周期' + cycleNumber + '采购订单，价格浮动: ' + 
            ((fluctuatedPrice / baseUnitPrice - 1) * 100).toFixed(2) + '%'
    });

    purchaseOrder.save(function (err, savedOrder) {
        if (err) {
            return callback({
                success: false,
                message: '采购订单保存失败: ' + err.message
            });
        }

        // 更新或创建原材料库存
        var MaterialInventoryModel = self.models.materialInventory;
        MaterialInventoryModel.findOne({
            materialId: materialId,
            cycleNumber: cycleNumber
        }, function (err, existingInventory) {
            if (err) {
                return callback({
                    success: false,
                    message: '查询库存失败: ' + err.message
                });
            }

            var inventory = existingInventory || new MaterialInventoryModel({
                materialId: materialId,
                materialName: materialName,
                cycleNumber: cycleNumber,
                unitPrice: fluctuatedPrice,
                minStockLevel: 50,
                maxStockLevel: 500
            });

            inventory.quantity = (inventory.quantity || 0) + quantity;
            inventory.unitPrice = fluctuatedPrice;
            inventory.lastPurchaseOrderId = savedOrder._id;
            inventory.createdBy = createdBy;

            inventory.save(function (err, savedInventory) {
                if (err) {
                    return callback({
                        success: false,
                        message: '库存更新失败: ' + err.message
                    });
                }

                var remainingCash = currentCash - totalAmount;

                callback({
                    success: true,
                    purchaseOrder: savedOrder,
                    materialInventory: savedInventory,
                    remainingCash: remainingCash,
                    message: '采购成功！扣除现金¥' + totalAmount + '，原料已入库' + quantity + '个单位',
                    priceFluctuation: ((fluctuatedPrice / baseUnitPrice - 1) * 100).toFixed(2) + '%'
                });
            });
        });
    });
};

/**
 * 获取周期采购订单列表
 */
PurchasingSimulation.prototype.getCyclePurchaseOrders = function (cycleNumber, callback) {
    var PurchaseOrderModel = this.models.purchaseOrder;
    PurchaseOrderModel.find({
        cycleNumber: cycleNumber
    })
    .sort({ orderDate: -1 })
    .exec(function (err, orders) {
        if (err) {
            return callback({
                success: false,
                message: '查询采购订单失败: ' + err.message
            });
        }

        callback({
            success: true,
            orders: orders,
            count: orders.length
        });
    });
};

/**
 * 获取周期采购摘要统计
 */
PurchasingSimulation.prototype.getCyclePurchaseSummary = function (cycleNumber, callback) {
    var PurchaseOrderModel = this.models.purchaseOrder;
    PurchaseOrderModel.aggregate([
        { $match: { cycleNumber: cycleNumber, status: 'received' } },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: '$quantityOrdered' },
                totalCost: { $sum: '$totalAmount' },
                orderCount: { $sum: 1 },
                avgUnitPrice: { $avg: '$unitPrice' }
            }
        }
    ], function (err, result) {
        if (err) {
            return callback({
                success: false,
                message: '统计采购摘要失败: ' + err.message
            });
        }

        var summary = result[0] || {
            _id: null,
            totalQuantity: 0,
            totalCost: 0,
            orderCount: 0,
            avgUnitPrice: 0
        };

        callback({
            success: true,
            summary: summary,
            cycleNumber: cycleNumber
        });
    });
};

/**
 * 取消采购订单（如果状态为pending）
 */
PurchasingSimulation.prototype.cancelPurchaseOrder = function (purchaseOrderId, callback) {
    var PurchaseOrderModel = this.models.purchaseOrder;
    PurchaseOrderModel.findById(purchaseOrderId, function (err, order) {
        if (err || !order) {
            return callback({
                success: false,
                message: '采购订单不存在'
            });
        }

        if (order.status !== 'pending') {
            return callback({
                success: false,
                message: '只能取消状态为pending的订单'
            });
        }

        order.status = 'cancelled';
        order.save(function (err) {
            if (err) {
                return callback({
                    success: false,
                    message: '取消订单失败: ' + err.message
                });
            }

            callback({
                success: true,
                message: '采购订单已取消',
                order: order
            });
        });
    });
};

/**
 * 获取材料价格范围（用于UI显示）
 */
PurchasingSimulation.prototype.getMaterialPricingInfo = function (materialId, basePrice, callback) {
    var minPrice = Math.round(basePrice * 0.95 * 100) / 100;
    var maxPrice = Math.round(basePrice * 1.05 * 100) / 100;

    callback({
        success: true,
        basePrice: basePrice,
        minPrice: minPrice,
        maxPrice: maxPrice,
        priceRange: (maxPrice - minPrice).toFixed(2),
        message: '本周期价格可能浮动范围: ¥' + minPrice + ' - ¥' + maxPrice
    });
};

module.exports = PurchasingSimulation;
