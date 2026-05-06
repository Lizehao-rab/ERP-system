'use strict';

var mongoose = require('mongoose');
var materialInventorySchema = mongoose.Schemas.materialInventory;
var productInventorySchema = mongoose.Schemas.productInventory;
var async = require('async');

var InventoryManagement = function (options) {
    options = options || {};
    this.event = options.event;
    this.models = options.models;
};

/**
 * 获取所有原材料库存
 */
InventoryManagement.prototype.getMaterialInventory = function (cycleNumber, callback) {
    var MaterialInventoryModel = this.models.materialInventory;
    MaterialInventoryModel.find({
        cycleNumber: cycleNumber
    })
    .sort({ updatedAt: -1 })
    .exec(function (err, inventories) {
        if (err) {
            return callback({
                success: false,
                message: '查询原材料库存失败: ' + err.message
            });
        }

        callback({
            success: true,
            materials: inventories,
            count: inventories.length
        });
    });
};

/**
 * 获取所有产成品库存
 */
InventoryManagement.prototype.getProductInventory = function (cycleNumber, callback) {
    var ProductInventoryModel = this.models.productInventory;
    ProductInventoryModel.find({
        $or: [
            { cycleProduced: cycleNumber },
            { cycleConsumed: { $lt: cycleNumber }, quantity: { $gt: 0 } }
        ]
    })
    .sort({ updatedAt: -1 })
    .exec(function (err, inventories) {
        if (err) {
            return callback({
                success: false,
                message: '查询产成品库存失败: ' + err.message
            });
        }

        callback({
            success: true,
            products: inventories,
            count: inventories.length
        });
    });
};

/**
 * 获取库存总价值（原材料+产成品）
 */
InventoryManagement.prototype.getTotalInventoryValue = function (cycleNumber, callback) {
    var MaterialInventoryModel = this.models.materialInventory;
    var ProductInventoryModel = this.models.productInventory;

    async.parallel({
        materials: function (cb) {
            MaterialInventoryModel.aggregate([
                { $match: { cycleNumber: cycleNumber } },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: '$totalValue' },
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ], cb);
        },
        products: function (cb) {
            ProductInventoryModel.aggregate([
                {
                    $match: {
                        $or: [
                            { cycleProduced: cycleNumber },
                            { quantity: { $gt: 0 } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: '$totalValue' },
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ], cb);
        }
    }, function (err, results) {
        if (err) {
            return callback({
                success: false,
                message: '计算库存总价值失败: ' + err.message
            });
        }

        var materialData = results.materials[0] || { totalValue: 0, totalQuantity: 0 };
        var productData = results.products[0] || { totalValue: 0, totalQuantity: 0 };
        var totalValue = materialData.totalValue + productData.totalValue;

        callback({
            success: true,
            materials: materialData,
            products: productData,
            totalValue: totalValue,
            totalQuantity: materialData.totalQuantity + productData.totalQuantity
        });
    });
};

/**
 * 计算仓储持有成本 (库存价值 * 月持有率 1-2%) 并从账户扣除
 * @returns { success, storageCost, totalInventoryValue, remainingCash }
 */
InventoryManagement.prototype.calculateAndChargeStorageCost = function (cycleNumber, currentCash, callback) {
    var self = this;
    var STORAGE_RATE = 0.015; // 1.5% 月持有率

    self.getTotalInventoryValue(cycleNumber, function (result) {
        if (!result.success) {
            return callback({
                success: false,
                message: '计算库存价值失败: ' + result.message
            });
        }

        var totalInventoryValue = result.totalValue;
        var storageCost = Math.round(totalInventoryValue * STORAGE_RATE * 100) / 100;

        if (currentCash < storageCost) {
            return callback({
                success: false,
                message: '现金不足以支付仓储费用。需要: ¥' + storageCost + ', 可用: ¥' + currentCash,
                requiredCost: storageCost,
                availableCash: currentCash,
                totalInventoryValue: totalInventoryValue
            });
        }

        var remainingCash = currentCash - storageCost;

        callback({
            success: true,
            storageCost: storageCost,
            storageRate: (STORAGE_RATE * 100).toFixed(2) + '%',
            totalInventoryValue: totalInventoryValue,
            remainingCash: remainingCash,
            message: '本周期仓储费用: ¥' + storageCost + 
                    '（库存价值¥' + totalInventoryValue + ' × ' + (STORAGE_RATE * 100).toFixed(2) + '%）'
        });
    });
};

/**
 * 消耗原材料用于生产
 */
InventoryManagement.prototype.consumeMaterials = function (materialId, quantity, cycleNumber, callback) {
    var MaterialInventoryModel = this.models.materialInventory;
    MaterialInventoryModel.findOne({
        materialId: materialId,
        cycleNumber: cycleNumber
    }, function (err, inventory) {
        if (err || !inventory) {
            return callback({
                success: false,
                message: '原材料库存不存在'
            });
        }

        if (inventory.quantity < quantity) {
            return callback({
                success: false,
                message: '原材料库存不足。需要: ' + quantity + ', 可用: ' + inventory.quantity
            });
        }

        inventory.quantity -= quantity;
        inventory.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '消耗原材料失败: ' + err.message
                });
            }

            callback({
                success: true,
                message: '已消耗原材料 ' + quantity + ' 个单位',
                remainingQuantity: saved.quantity,
                inventory: saved
            });
        });
    });
};

/**
 * 生产完成入库产成品
 */
InventoryManagement.prototype.addProducts = function (productId, productName, quantity, unitPrice, cycleNumber, createdBy, callback) {
    var ProductInventoryModel = this.models.productInventory;
    ProductInventoryModel.findOne({
        productId: productId,
        cycleProduced: cycleNumber
    }, function (err, existingProduct) {
        if (err) {
            return callback({
                success: false,
                message: '查询产成品失败: ' + err.message
            });
        }

        var product = existingProduct || new ProductInventoryModel({
            productId: productId,
            productName: productName,
            cycleProduced: cycleNumber,
            unitPrice: unitPrice,
            createdBy: createdBy
        });

        product.quantity = (product.quantity || 0) + quantity;
        product.unitPrice = unitPrice;

        product.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '产成品入库失败: ' + err.message
                });
            }

            callback({
                success: true,
                message: '产成品入库: ' + quantity + ' 个单位',
                totalQuantity: saved.quantity,
                inventory: saved
            });
        });
    });
};

/**
 * 订单完成后扣减产成品库存
 */
InventoryManagement.prototype.consumeProductsForDelivery = function (productId, quantity, callback) {
    var ProductInventoryModel = this.models.productInventory;
    ProductInventoryModel.findOne({
        productId: productId,
        quantity: { $gte: quantity }
    })
    .sort({ cycleProduced: -1 }) // 先进先出
    .exec(function (err, inventory) {
        if (err || !inventory) {
            return callback({
                success: false,
                message: '产成品库存不足或不存在'
            });
        }

        inventory.quantity -= quantity;
        inventory.cycleConsumed = inventory.cycleProduced; // 标记消耗周期
        inventory.save(function (err, saved) {
            if (err) {
                return callback({
                    success: false,
                    message: '产成品消耗失败: ' + err.message
                });
            }

            callback({
                success: true,
                message: '订单交付消耗产成品 ' + quantity + ' 个单位',
                remainingQuantity: saved.quantity,
                inventory: saved
            });
        });
    });
};

/**
 * 获取完整库存快照（包含价值、持有成本等）
 */
InventoryManagement.prototype.getInventorySnapshot = function (cycleNumber, currentCash, callback) {
    var self = this;

    async.parallel({
        materials: function (cb) {
            self.getMaterialInventory(cycleNumber, cb);
        },
        products: function (cb) {
            self.getProductInventory(cycleNumber, cb);
        },
        totalValue: function (cb) {
            self.getTotalInventoryValue(cycleNumber, cb);
        },
        storageCost: function (cb) {
            self.calculateAndChargeStorageCost(cycleNumber, currentCash, cb);
        }
    }, function (err, results) {
        if (err) {
            return callback({
                success: false,
                message: '获取库存快照失败'
            });
        }

        callback({
            success: true,
            cycleNumber: cycleNumber,
            materials: results.materials.materials || [],
            products: results.products.products || [],
            materialCount: results.materials.count || 0,
            productCount: results.products.count || 0,
            totalInventoryValue: results.totalValue.totalValue,
            storageCostDetails: {
                cost: results.storageCost.storageCost,
                rate: results.storageCost.storageRate,
                message: results.storageCost.message
            },
            remainingCash: results.storageCost.remainingCash || currentCash
        });
    });
};

/**
 * 获取库存成本明细（按周期）
 */
InventoryManagement.prototype.getStorageCostBreakdown = function (cycleNumber, callback) {
    var self = this;
    self.getTotalInventoryValue(cycleNumber, function (result) {
        if (!result.success) {
            return callback({
                success: false,
                message: result.message
            });
        }

        var STORAGE_RATE = 0.015;
        var storageCost = result.totalValue * STORAGE_RATE;

        callback({
            success: true,
            cycleNumber: cycleNumber,
            materialInventoryValue: result.materials.totalValue,
            productInventoryValue: result.products.totalValue,
            totalInventoryValue: result.totalValue,
            storageRate: (STORAGE_RATE * 100).toFixed(2) + '%',
            storageCost: Math.round(storageCost * 100) / 100,
            breakdown: {
                materialCount: result.materials.totalQuantity,
                productCount: result.products.totalQuantity
            }
        });
    });
};

module.exports = InventoryManagement;
