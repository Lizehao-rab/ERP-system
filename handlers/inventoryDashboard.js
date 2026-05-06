var mongoose = require('mongoose');
var async = require('async');

var InventoryDashboard = function (event, models) {
    'use strict';

    var InventoryManagement = require('../services/inventoryManagement');

    return {
        /**
         * GET /inventoryDashboard/materials?cycleNumber=1
         * 获取所有原材料库存
         */
        getMaterialInventory: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.getMaterialInventory(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /inventoryDashboard/products?cycleNumber=1
         * 获取所有产成品库存
         */
        getProductInventory: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.getProductInventory(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /inventoryDashboard/snapshot?cycleNumber=1
         * 获取完整库存快照（包含持有成本）
         */
        getInventorySnapshot: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;
            var currentCash = parseFloat(req.query.currentCash) || 0;

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.getInventorySnapshot(cycleNumber, currentCash, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /inventoryDashboard/costs?cycleNumber=1
         * 获取库存成本明细
         */
        getStorageCostBreakdown: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.getStorageCostBreakdown(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * POST /inventoryDashboard/consumeMaterials
         * 消耗原材料用于生产
         */
        consumeMaterials: function (req, res) {
            var materialId = req.body.materialId;
            var quantity = parseInt(req.body.quantity);
            var cycleNumber = parseInt(req.body.cycleNumber);

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.consumeMaterials(materialId, quantity, cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * POST /inventoryDashboard/addProducts
         * 生产完成入库产成品
         */
        addProducts: function (req, res) {
            var userId = req.user._id;
            var productId = req.body.productId;
            var productName = req.body.productName;
            var quantity = parseInt(req.body.quantity);
            var unitPrice = parseFloat(req.body.unitPrice);
            var cycleNumber = parseInt(req.body.cycleNumber);

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.addProducts(
                productId,
                productName,
                quantity,
                unitPrice,
                cycleNumber,
                userId,
                function (result) {
                    res.status(result.success ? 200 : 400).json(result);
                }
            );
        },

        /**
         * POST /inventoryDashboard/consumeForDelivery
         * 订单完成后扣减产成品库存
         */
        consumeProductsForDelivery: function (req, res) {
            var productId = req.body.productId;
            var quantity = parseInt(req.body.quantity);

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.consumeProductsForDelivery(productId, quantity, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /inventoryDashboard/totalValue?cycleNumber=1
         * 获取库存总价值（原材料+产成品）
         */
        getTotalInventoryValue: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var inventoryService = new InventoryManagement({
                event: event,
                models: models
            });

            inventoryService.getTotalInventoryValue(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        }
    };
};

module.exports = InventoryDashboard;
