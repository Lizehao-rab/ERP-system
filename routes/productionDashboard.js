var express = require('express');
var router = express.Router();
var ProductionDashboardHandler = require('../handlers/productionDashboard');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (event, models) {
    'use strict';

    var productionDashboardHandler = new ProductionDashboardHandler(event, models);

    /**
     * POST /productionDashboard/issuePlan
     * @description 下达生产计划
     * @param {string} productId - 产品ID
     * @param {string} productName - 产品名称
     * @param {number} quantityPlanned - 计划产量
     * @param {string} workCenterId - 工作中心ID
     * @param {number} cycleNumber - 周期号
     * @param {date} dueDate - 完工期限
     * @param {array} bomItems - BOM物料清单
     * @returns {Object} {success, productionPlan, message}
     */
    router.post('/issuePlan', authStackMiddleware, function (req, res) {
        productionDashboardHandler.issuePlan(req, res);
    });

    /**
     * GET /productionDashboard/plans?cycleNumber=1&status=inprogress
     * @description 获取生产计划列表
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @param {string} status - 状态过滤: planned|inprogress|completed|delayed|cancelled
     * @returns {Array} 生产计划列表
     */
    router.get('/plans', authStackMiddleware, function (req, res) {
        productionDashboardHandler.getPlans(req, res);
    });

    /**
     * GET /productionDashboard/plan/:planId
     * @description 获取生产计划详情
     * @param {string} planId - 生产计划ID
     * @returns {Object} 生产计划详细信息
     */
    router.get('/plan/:planId', authStackMiddleware, function (req, res) {
        productionDashboardHandler.getPlanDetail(req, res);
    });

    /**
     * GET /productionDashboard/capacity?workCenterId=wc-assembly&activeEmployees=8
     * @description 获取工作中心产能上限（基于在岗人数）
     * @param {string} workCenterId - 工作中心ID
     * @param {number} activeEmployees - 在岗人数
     * @returns {Object} {quarterlyCapacity, utilizationRate, message}
     */
    router.get('/capacity', authStackMiddleware, function (req, res) {
        productionDashboardHandler.getCapacity(req, res);
    });

    /**
     * POST /productionDashboard/completeProduction
     * @description 生产完成 - 自动按BOM消耗材料并入库
     * @param {string} planId - 生产计划ID
     * @param {number} quantityToComplete - 完成产量
     * @returns {Object} {success, productionPlan, consumedMaterials, producedInventory}
     */
    router.post('/completeProduction', authStackMiddleware, function (req, res) {
        productionDashboardHandler.completeProduction(req, res);
    });

    /**
     * POST /productionDashboard/checkDelay
     * @description 检查并应用生产延期罚款
     * @param {string} planId - 生产计划ID
     * @returns {Object} {isDelayed, daysLate, penalty}
     */
    router.post('/checkDelay', authStackMiddleware, function (req, res) {
        productionDashboardHandler.checkDelay(req, res);
    });

    /**
     * GET /productionDashboard/summary?cycleNumber=1
     * @description 获取生产摘要统计
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Object} {byStatus, overall}
     */
    router.get('/summary', authStackMiddleware, function (req, res) {
        productionDashboardHandler.getSummary(req, res);
    });

    /**
     * GET /productionDashboard/stats?cycleNumber=1
     * @description 获取生产完成率统计（按时交付率、延期情况、罚款总额）
     * @param {number} cycleNumber - 周期号（可选，默认1）
     * @returns {Object} {completionRate, onTimeRate, delayedCount, totalPenalty}
     */
    router.get('/stats', authStackMiddleware, function (req, res) {
        productionDashboardHandler.getStats(req, res);
    });

    return router;
};
