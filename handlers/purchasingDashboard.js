var mongoose = require('mongoose');
var async = require('async');

var PurchasingDashboard = function (event, models) {
    'use strict';

    var PurchasingSimulation = require('../services/purchasingSimulation');

    return {
        /**
         * POST /purchasingDashboard/createPurchase
         * 创建采购订单 - 直接扣现金、自动入库
         */
        createPurchase: function (req, res) {
            var userId = req.user._id;
            var materialId = req.body.materialId;
            var materialName = req.body.materialName;
            var unitPrice = req.body.unitPrice;
            var quantity = parseInt(req.body.quantity);
            var cycleNumber = parseInt(req.body.cycleNumber);
            var currentCash = req.body.currentCash || 0;

            var purchasingService = new PurchasingSimulation({
                event: event,
                models: models
            });

            purchasingService.createPurchaseOrder({
                materialId: materialId,
                materialName: materialName,
                unitPrice: unitPrice,
                quantity: quantity,
                cycleNumber: cycleNumber,
                cash: currentCash,
                createdBy: userId
            }, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /purchasingDashboard/orders?cycleNumber=1
         * 获取周期采购订单列表
         */
        getPurchaseOrders: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var purchasingService = new PurchasingSimulation({
                event: event,
                models: models
            });

            purchasingService.getCyclePurchaseOrders(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /purchasingDashboard/summary?cycleNumber=1
         * 获取周期采购摘要统计
         */
        getCyclePurchaseSummary: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var purchasingService = new PurchasingSimulation({
                event: event,
                models: models
            });

            purchasingService.getCyclePurchaseSummary(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /purchasingDashboard/materials
         * 获取所有材料及当前价格浮动范围
         */
        getMaterialCatalog: function (req, res) {
            // 模拟材料目录 - 实际应从数据库获取
            var materials = [
                { materialId: '001', materialName: '原材料A', basePrice: 100, storageLocation: 'Warehouse-A' },
                { materialId: '002', materialName: '原材料B', basePrice: 150, storageLocation: 'Warehouse-A' },
                { materialId: '003', materialName: '原材料C', basePrice: 200, storageLocation: 'Warehouse-B' }
            ];

            var purchasingService = new PurchasingSimulation({
                event: event,
                models: models
            });

            var enrichedMaterials = [];
            var completed = 0;

            materials.forEach(function (material) {
                purchasingService.getMaterialPricingInfo(
                    material.materialId,
                    material.basePrice,
                    function (result) {
                        enrichedMaterials.push(Object.assign({}, material, result));
                        completed++;

                        if (completed === materials.length) {
                            res.json({
                                success: true,
                                materials: enrichedMaterials,
                                purchaseLimit: purchasingService.getCyclePurchaseLimit(),
                                message: '材料目录已加载，显示本周期价格浮动范围'
                            });
                        }
                    }
                );
            });
        },

        /**
         * POST /purchasingDashboard/cancelOrder
         * 取消采购订单（如果状态为pending）
         */
        cancelPurchaseOrder: function (req, res) {
            var purchaseOrderId = req.body.purchaseOrderId;

            var purchasingService = new PurchasingSimulation({
                event: event,
                models: models
            });

            purchasingService.cancelPurchaseOrder(purchaseOrderId, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /purchasingDashboard/pricingInfo?materialId=001&basePrice=100
         * 获取材料价格信息（价格浮动范围）
         */
        getMaterialPricingInfo: function (req, res) {
            var materialId = req.query.materialId;
            var basePrice = parseFloat(req.query.basePrice);

            var purchasingService = new PurchasingSimulation({
                event: event,
                models: models
            });

            purchasingService.getMaterialPricingInfo(materialId, basePrice, function (result) {
                res.json(result);
            });
        }
    };
};

module.exports = PurchasingDashboard;
