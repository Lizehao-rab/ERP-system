var express = require('express');
var router = express.Router();
var PurchasingDashboardHandler = require('../handlers/purchasingDashboard');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (event, models) {
    'use strict';

    var purchasingDashboardHandler = new PurchasingDashboardHandler(event, models);

    /**
     * POST /purchasingDashboard/createPurchase
     * @description 创建采购订单 - 直接扣现金、自动入库
     * @param {string} materialId - 原材料ID
     * @param {string} materialName - 原材料名称
     * @param {number} unitPrice - 基础单价
     * @param {number} quantity - 采购数量 (≤ 500)
     * @param {number} cycleNumber - 周期号
     * @param {number} currentCash - 当前现金
     * @returns {Object} { success, purchaseOrder, materialInventory, remainingCash, priceFluctuation }
     */
    router.post('/createPurchase', authStackMiddleware, function (req, res) {
        purchasingDashboardHandler.createPurchase(req, res);
    });

    /**
     * GET /purchasingDashboard/orders?cycleNumber=1
     * @description 获取周期采购订单列表
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Array} 采购订单列表
     */
    router.get('/orders', authStackMiddleware, function (req, res) {
        purchasingDashboardHandler.getPurchaseOrders(req, res);
    });

    /**
     * GET /purchasingDashboard/summary?cycleNumber=1
     * @description 获取周期采购摘要统计
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Object} { totalQuantity, totalCost, orderCount, avgUnitPrice }
     */
    router.get('/summary', authStackMiddleware, function (req, res) {
        purchasingDashboardHandler.getCyclePurchaseSummary(req, res);
    });

    /**
     * GET /purchasingDashboard/materials
     * @description 获取所有材料及当前价格浮动范围
     * @returns {Array} 材料目录，包含价格浮动范围
     */
    router.get('/materials', authStackMiddleware, function (req, res) {
        purchasingDashboardHandler.getMaterialCatalog(req, res);
    });

    /**
     * GET /purchasingDashboard/pricingInfo?materialId=001&basePrice=100
     * @description 获取材料价格信息（价格浮动范围）
     * @param {string} materialId - 材料ID
     * @param {number} basePrice - 基础价格
     * @returns {Object} { basePrice, minPrice, maxPrice, priceRange }
     */
    router.get('/pricingInfo', authStackMiddleware, function (req, res) {
        purchasingDashboardHandler.getMaterialPricingInfo(req, res);
    });

    /**
     * POST /purchasingDashboard/cancelOrder
     * @description 取消采购订单（仅限pending状态）
     * @param {string} purchaseOrderId - 采购订单ID
     * @returns {Object} { success, message, order }
     */
    router.post('/cancelOrder', authStackMiddleware, function (req, res) {
        purchasingDashboardHandler.cancelPurchaseOrder(req, res);
    });

    return router;
};
