var mongoose = require('mongoose');
var async = require('async');

var ProductionDashboard = function (event, models) {
    'use strict';

    var ProductionPlanning = require('../services/productionPlanning');
    var ProductionExecution = require('../services/productionExecution');

    return {
        /**
         * POST /productionDashboard/issuePlan
         * 下达生产计划
         */
        issuePlan: function (req, res) {
            var userId = req.user._id;
            var body = req.body;

            var planningService = new ProductionPlanning({
                event: event,
                models: models
            });

            planningService.issuProductionPlan({
                productId: body.productId,
                productName: body.productName,
                quantityPlanned: parseInt(body.quantityPlanned),
                bomId: body.bomId,
                workCenterId: body.workCenterId,
                workCenterName: body.workCenterName,
                productionCycleDays: parseInt(body.productionCycleDays) || 1,
                cycleNumber: parseInt(body.cycleNumber),
                dueDate: body.dueDate,
                bomItems: body.bomItems || [],
                createdBy: userId
            }, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /productionDashboard/plans?cycleNumber=1&status=inprogress
         * 获取生产计划列表
         */
        getPlans: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;
            var status = req.query.status;

            var planningService = new ProductionPlanning({
                event: event,
                models: models
            });

            planningService.getCycleProductionPlans(cycleNumber, status, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /productionDashboard/plan/:planId
         * 获取生产计划详情
         */
        getPlanDetail: function (req, res) {
            var planId = req.params.planId;

            var planningService = new ProductionPlanning({
                event: event,
                models: models
            });

            planningService.getProductionPlanDetail(planId, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /productionDashboard/capacity?workCenterId=wc-assembly&activeEmployees=8
         * 获取工作中心产能上限
         */
        getCapacity: function (req, res) {
            var workCenterId = req.query.workCenterId;
            var activeEmployees = parseInt(req.query.activeEmployees) || 1;

            var planningService = new ProductionPlanning({
                event: event,
                models: models
            });

            planningService.calculateCapacityLimit(workCenterId, activeEmployees, function (result) {
                res.json(result);
            });
        },

        /**
         * POST /productionDashboard/completeProduction
         * 生产完成 - 消耗BOM并入库
         */
        completeProduction: function (req, res) {
            var body = req.body;
            var planId = body.planId;
            var quantityToComplete = parseInt(body.quantityToComplete);

            var executionService = new ProductionExecution({
                event: event,
                models: models
            });

            executionService.completeProduction(planId, quantityToComplete, {}, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * POST /productionDashboard/checkDelay
         * 检查并应用生产延期罚款
         */
        checkDelay: function (req, res) {
            var planId = req.body.planId;

            var executionService = new ProductionExecution({
                event: event,
                models: models
            });

            executionService.checkAndApplyDelayPenalty(planId, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /productionDashboard/summary?cycleNumber=1
         * 获取生产摘要统计
         */
        getSummary: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var planningService = new ProductionPlanning({
                event: event,
                models: models
            });

            planningService.getCycleProdutionSummary(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        },

        /**
         * GET /productionDashboard/stats?cycleNumber=1
         * 获取生产完成率统计
         */
        getStats: function (req, res) {
            var cycleNumber = parseInt(req.query.cycleNumber) || 1;

            var executionService = new ProductionExecution({
                event: event,
                models: models
            });

            executionService.getProductionCompletionStats(cycleNumber, function (result) {
                res.status(result.success ? 200 : 400).json(result);
            });
        }
    };
};

module.exports = ProductionDashboard;
