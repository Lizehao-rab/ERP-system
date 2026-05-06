var express = require('express');
var router = express.Router();
var InventoryDashboardHandler = require('../handlers/inventoryDashboard');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (event, models) {
    'use strict';

    var inventoryDashboardHandler = new InventoryDashboardHandler(event, models);

    /**
     * GET /inventoryDashboard/materials?cycleNumber=1
     * @description 获取所有原材料库存
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Array} 原材料库存列表 { materialId, materialName, quantity, unitPrice, totalValue }
     */
    router.get('/materials', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.getMaterialInventory(req, res);
    });

    /**
     * GET /inventoryDashboard/products?cycleNumber=1
     * @description 获取所有产成品库存
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Array} 产成品库存列表 { productId, productName, quantity, unitPrice, totalValue }
     */
    router.get('/products', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.getProductInventory(req, res);
    });

    /**
     * GET /inventoryDashboard/snapshot?cycleNumber=1&currentCash=50000
     * @description 获取完整库存快照（包含持有成本）
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @param {number} currentCash - 当前现金（用于计算仓储费用）
     * @returns {Object} 库存快照 { materials, products, totalInventoryValue, storageCostDetails, remainingCash }
     */
    router.get('/snapshot', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.getInventorySnapshot(req, res);
    });

    /**
     * GET /inventoryDashboard/costs?cycleNumber=1
     * @description 获取库存成本明细（仓储费用）
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Object} 成本明细 { storageRate, storageCost, breakdown }
     */
    router.get('/costs', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.getStorageCostBreakdown(req, res);
    });

    /**
     * GET /inventoryDashboard/totalValue?cycleNumber=1
     * @description 获取库存总价值（原材料+产成品）
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Object} { totalValue, materials, products }
     */
    router.get('/totalValue', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.getTotalInventoryValue(req, res);
    });

    /**
     * POST /inventoryDashboard/consumeMaterials
     * @description 消耗原材料用于生产
     * @param {string} materialId - 原材料ID
     * @param {number} quantity - 消耗数量
     * @param {number} cycleNumber - 周期号
     * @returns {Object} { success, message, remainingQuantity }
     */
    router.post('/consumeMaterials', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.consumeMaterials(req, res);
    });

    /**
     * POST /inventoryDashboard/addProducts
     * @description 生产完成入库产成品
     * @param {string} productId - 产成品ID
     * @param {string} productName - 产成品名称
     * @param {number} quantity - 生产数量
     * @param {number} unitPrice - 单价
     * @param {number} cycleNumber - 周期号
     * @returns {Object} { success, message, totalQuantity }
     */
    router.post('/addProducts', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.addProducts(req, res);
    });

    /**
     * POST /inventoryDashboard/consumeForDelivery
     * @description 订单完成后扣减产成品库存
     * @param {string} productId - 产成品ID
     * @param {number} quantity - 交付数量
     * @returns {Object} { success, message, remainingQuantity }
     */
    router.post('/consumeForDelivery', authStackMiddleware, function (req, res) {
        inventoryDashboardHandler.consumeProductsForDelivery(req, res);
    });

    return router;
};
