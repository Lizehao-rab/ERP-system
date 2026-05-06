var mongoose = require('mongoose');
var async = require('async');

var FinancialDashboard = function (event, models) {
    'use strict';

    var FinancialSettlementService = require('../services/financialSettlement')(models);
    var EmployeeService = require('../services/employee')(models);
    var InventoryManagement = require('../services/inventoryManagement');
    var PurchasingSimulation = require('../services/purchasingSimulation');
    var ProductionExecution = require('../services/productionExecution');
    var RESPONSES = require('../constants/responses');
    var CONSTANTS = require('../constants/mainConstants.js');

    var access = require('../helpers/access')(models, event);
    var logger = require('../helpers/logger');

    /**
     * GET /financialDashboard/latest
     * Returns latest cycle summary for dashboard display
     */
    this.getLatestSummary = function (req, res, next) {
        var dbName = req.session.lastDb;
        var query = req.query;
        var options = {
            dbName: dbName
        };

        FinancialSettlementService.getLatestCycleSummary(options, function (err, summary) {
            if (err) {
                logger.error('Error getting latest cycle summary:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ data: summary || {} });
        });
    };

    /**
     * GET /financialDashboard/history
     * Returns historical cycle summaries with pagination
     */
    this.getHistory = function (req, res, next) {
        var dbName = req.session.lastDb;
        var query = req.query;
        var limit = parseInt(query.limit, 10) || 50;
        var skip = parseInt(query.skip, 10) || 0;

        var options = {
            dbName: dbName,
            limit: limit,
            skip: skip
        };

        FinancialSettlementService.getCycleSummaries(options, function (err, summaries) {
            if (err) {
                logger.error('Error getting cycle summaries:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ data: summaries || [] });
        });
    };

    /**
     * GET /financialDashboard/snapshot
     * Returns cumulative financial snapshot: total revenue, total costs, cumulative profit
     */
    this.getSnapshot = function (req, res, next) {
        var dbName = req.session.lastDb;

        var options = {
            dbName: dbName
        };

        FinancialSettlementService.getFinancialSnapshot(options, function (err, snapshot) {
            if (err) {
                logger.error('Error getting financial snapshot:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ data: snapshot || {} });
        });
    };

    /**
     * POST /financialDashboard/calculateCycle
     * System auto-calculates and saves cycle summary
     * Input: {revenue, materialCosts, personnelCosts, depreciationCosts, interestCosts, 
     *         penaltyCosts, randomEventCosts, totalAssets, totalLiabilities, cashFlow}
     */
    this.calculateCycle = function (req, res, next) {
        var dbName = req.session.lastDb;
        var body = req.body;
        var user = req.session.user;

        // Get current cycle number (count of existing cycles + 1)
        var FinancialSettlement = models.get(dbName, 'businessCycleSummary', mongoose.Schemas.businessCycleSummary);
        
        FinancialSettlement.countDocuments({}, function (err, count) {
            if (err) {
                logger.error('Error counting cycles:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            var cycleNumber = (count || 0) + 1;
            var options = {
                dbName: dbName,
                cycleNumber: cycleNumber,
                periodStart: body.periodStart,
                periodEnd: body.periodEnd,
                revenue: parseFloat(body.revenue) || 0,
                materialCosts: parseFloat(body.materialCosts) || 0,
                personnelCosts: parseFloat(body.personnelCosts) || 0,
                depreciationCosts: parseFloat(body.depreciationCosts) || 0,
                interestCosts: parseFloat(body.interestCosts) || 0,
                penaltyCosts: parseFloat(body.penaltyCosts) || 0,
                randomEventCosts: parseFloat(body.randomEventCosts) || 0,
                otherCosts: parseFloat(body.otherCosts) || 0,
                totalAssets: parseFloat(body.totalAssets) || 0,
                totalLiabilities: parseFloat(body.totalLiabilities) || 0,
                cashFlow: parseFloat(body.cashFlow) || 0,
                createdBy: user ? user.login : 'system'
            };

            FinancialSettlementService.calculateCycleSummary(options, function (err, summary) {
                if (err) {
                    logger.error('Error calculating cycle summary:', err);
                    return res.status(400).send(new RESPONSES.BadRequest(err));
                }

                res.status(200).send({ 
                    data: summary,
                    message: 'Cycle ' + cycleNumber + ' auto-settlement completed'
                });
            });
        });
    };

    /**
     * GET /financialDashboard/dashboardData
     * Combined endpoint: returns latest summary + employee costs for cycle planning
     */
    this.getDashboardData = function (req, res, next) {
        var dbName = req.session.lastDb;

        var tasks = {
            latestSummary: function (callback) {
                var options = { dbName: dbName };
                FinancialSettlementService.getLatestCycleSummary(options, callback);
            },
            snapshot: function (callback) {
                var options = { dbName: dbName };
                FinancialSettlementService.getFinancialSnapshot(options, callback);
            },
            employeesCost: function (callback) {
                var options = { dbName: dbName };
                EmployeeService.getTotalMonthlyCost(options, callback);
            },
            activeEmployeeCount: function (callback) {
                var options = { dbName: dbName };
                EmployeeService.getActiveEmployeeCount(options, callback);
            }
        };

        async.parallel(tasks, function (err, results) {
            if (err) {
                logger.error('Error getting dashboard data:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            var dashboardData = {
                latestCycle: results.latestSummary || {},
                cumulativeSnapshot: results.snapshot || {},
                employeeCosts: results.employeesCost || 0,
                activeEmployees: results.activeEmployeeCount || 0,
                systemStatus: {
                    lastUpdated: new Date(),
                    autoSettlementEnabled: true,
                    message: '已启用自动财务结算模式（Auto-settlement mode enabled）'
                }
            };

            res.status(200).send({ data: dashboardData });
        });
    };

    /**
     * POST /financialDashboard/completeCycle
     * 完整周期结束处理：整合采购、库存、销售、财务
     * 自动计算所有成本并完成财务结算
     * @param {number} cycleNumber - 周期号
     * @param {number} currentCash - 当前现金
     */
    this.completeCycle = function (req, res, next) {
        var dbName = req.session.lastDb;
        var body = req.body;
        var user = req.session.user;
        var cycleNumber = parseInt(body.cycleNumber) || 1;
        var currentCash = parseFloat(body.currentCash) || 0;

        var InventoryService = new InventoryManagement({
            event: event,
            models: models
        });

        var PurchasingService = new PurchasingSimulation({
            event: event,
            models: models
        });

        var ProductionService = new ProductionExecution({
            event: event,
            models: models
        });

        // 并行收集所有成本数据
        var tasks = {
            purchaseSummary: function (callback) {
                PurchasingService.getCyclePurchaseSummary(cycleNumber, callback);
            },
            inventoryCost: function (callback) {
                InventoryService.calculateAndChargeStorageCost(cycleNumber, currentCash, callback);
            },
            employeeCost: function (callback) {
                var options = { dbName: dbName };
                EmployeeService.getTotalMonthlyCost(options, callback);
            },
            activeEmployeeCount: function (callback) {
                var options = { dbName: dbName };
                EmployeeService.getActiveEmployeeCount(options, callback);
            },
            productionStats: function (callback) {
                ProductionService.getProductionCompletionStats(cycleNumber, callback);
            }
        };
        async.parallel(tasks, function (err, results) {
            if (err) {
                logger.error('Error collecting cycle costs:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            // 计算总成本
            var purchaseCost = (results.purchaseSummary && results.purchaseSummary.summary) ? 
                results.purchaseSummary.summary.totalCost || 0 : 0;
            var storageCost = (results.inventoryCost && results.inventoryCost.storageCost) ? 
                results.inventoryCost.storageCost : 0;
            var employeeCost = (results.employeeCost && results.employeeCost.success) ? 
                results.employeeCost.totalCost || 0 : 0;
            
            // 生产延期罚款
            var productionPenaltyFromStats = 0;
            if (results.productionStats && results.productionStats.success && results.productionStats.stats) {
                productionPenaltyFromStats = results.productionStats.stats.totalPenalty || 0;
            }

            // 销售收入从请求体获取（来自销售订单池已完成订单）
            var salesRevenue = parseFloat(body.salesRevenue) || 0;

            // 其他成本
            var depreciationCosts = parseFloat(body.depreciationCosts) || 0;
            var interestCosts = parseFloat(body.interestCosts) || 0;
            var penaltyCosts = parseFloat(body.penaltyCosts) || 0 + productionPenaltyFromStats;
            var randomEventCosts = parseFloat(body.randomEventCosts) || 0;

            // 汇总所有成本
            var totalCosts = purchaseCost + storageCost + employeeCost + 
                depreciationCosts + interestCosts + penaltyCosts + randomEventCosts;

            var netProfit = salesRevenue - totalCosts;
            var finalCash = currentCash - (storageCost + purchaseCost) + salesRevenue;

            // 调用财务结算
            var FinancialSettlement = models.get(dbName, 'businessCycleSummary', mongoose.Schemas.businessCycleSummary);
            
            var options = {
                dbName: dbName,
                cycleNumber: cycleNumber,
                periodStart: body.periodStart || new Date(),
                periodEnd: body.periodEnd || new Date(),
                revenue: salesRevenue,
                materialCosts: purchaseCost,
                personnelCosts: employeeCost,
                depreciationCosts: depreciationCosts,
                interestCosts: interestCosts,
                productionCosts: productionPenaltyFromStats,
                penaltyCosts: penaltyCosts,
                randomEventCosts: randomEventCosts,
                otherCosts: storageCost, // 库存持有成本作为其他成本
                totalAssets: parseFloat(body.totalAssets) || finalCash,
                totalLiabilities: parseFloat(body.totalLiabilities) || 0,
                cashFlow: finalCash,
                createdBy: user ? user.login : 'system'
            };

            FinancialSettlementService.calculateCycleSummary(options, function (err, summary) {
                if (err) {
                    logger.error('Error calculating cycle summary:', err);
                    return res.status(400).send(new RESPONSES.BadRequest(err));
                }

                // 返回完整周期结束报告
                res.status(200).send({
                    data: {
                        cycle: summary,
                        costBreakdown: {
                            purchaseCost: purchaseCost,
                            storageCost: storageCost,
                            employeeCost: employeeCost,
                            depreciationCosts: depreciationCosts,
                            interestCosts: interestCosts,
                            penaltyCosts: penaltyCosts,
                            randomEventCosts: randomEventCosts,
                            totalCosts: totalCosts
                        },
                        summary: {
                            cycleNumber: cycleNumber,
                            salesRevenue: salesRevenue,
                            netProfit: netProfit,
                            remainingCash: finalCash,
                            activeEmployees: results.activeEmployeeCount || 0,
                            message: '周期' + cycleNumber + '结算完成'
                        }
                    }
                });
            });
        });
    };

    return this;
};

module.exports = FinancialDashboard;

