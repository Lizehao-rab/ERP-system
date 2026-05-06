/**
 * 回合制引擎服务 - 季度经营回合管理和流程控制
 * 核心功能：进入回合→自主决策→提交决策→系统自动结算→回合结束
 * 单机环境，支持自由推进和重置
 */

var async = require('async');
var moment = require('moment');

var QuarterEngine = function (options) {
    'use strict';
    this.event = options.event;
    this.models = options.models;
};

/**
 * 初始化新回合 - 创建businessQuarter记录，记录开局财务快照
 */
QuarterEngine.prototype.initializeNewQuarter = function (quarterNumber, dbName, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');
    var EmployeeService = require('./employee')(this.models);

    // 回合基本设置
    var quarterCode = 'Q-' + new Date().getFullYear() + '-' + quarterNumber;
    var startDate = new Date();
    var endDate = moment(startDate).add(3, 'months').toDate();

    // 并行收集开局财务快照
    var snapshotTasks = {
        currentCash: function (callback) {
            // 从上一回合的结算数据或初始化数据获取
            // 这里假设有一个全局财务对象
            callback(null, 0);  // 初始现金
        },
        totalAssets: function (callback) {
            callback(null, 0);
        },
        totalLiabilities: function (callback) {
            callback(null, 0);
        },
        totalEquity: function (callback) {
            callback(null, 0);
        },
        activeEmployees: function (callback) {
            var options = { dbName: dbName };
            EmployeeService.getActiveEmployeeCount(options, callback);
        }
    };

    async.parallel(snapshotTasks, function (err, snapshot) {
        if (err) {
            return callback({
                success: false,
                message: '初始化回合失败: ' + err.message
            });
        }

        var newQuarter = new BusinessQuarter({
            quarterNumber: quarterNumber,
            quarterCode: quarterCode,
            dbName: dbName,
            status: 'planning',
            startDate: startDate,
            endDate: endDate,
            openingSnapshot: {
                cash: snapshot.currentCash || 0,
                totalAssets: snapshot.totalAssets || 0,
                totalLiabilities: snapshot.totalLiabilities || 0,
                totalEquity: snapshot.totalEquity || 0
            },
            createdBy: 'system'
        });

        newQuarter.save(function (err, doc) {
            if (err) {
                return callback({
                    success: false,
                    message: '保存回合数据失败: ' + err.message
                });
            }

            callback({
                success: true,
                quarter: doc,
                message: '第' + quarterNumber + '回合已初始化'
            });
        });
    });
};

/**
 * 获取当前回合信息和仪表板
 */
QuarterEngine.prototype.getCurrentQuarterDashboard = function (dbName, quarterNumber, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');

    BusinessQuarter.findOne({
        dbName: dbName,
        quarterNumber: quarterNumber
    }, function (err, quarter) {
        if (err) {
            return callback({
                success: false,
                message: '获取回合信息失败: ' + err.message
            });
        }

        if (!quarter) {
            return callback({
                success: false,
                message: '回合不存在'
            });
        }

        // 构建仪表板数据
        var dashboard = {
            success: true,
            quarter: {
                quarterNumber: quarter.quarterNumber,
                quarterCode: quarter.quarterCode,
                status: quarter.status,
                startDate: quarter.startDate,
                endDate: quarter.endDate,
                daysRemaining: moment(quarter.endDate).diff(moment(), 'days')
            },
            financialSnapshot: quarter.openingSnapshot,
            decisions: quarter.decisions,
            settlement: quarter.settlement,
            performanceScore: quarter.performanceScore,
            appliedEvents: quarter.appliedEvents,
            message: '回合数据已获取'
        };

        callback(dashboard);
    });
};

/**
 * 记录用户决策 - 采购、生产、招人、贷款、接单决策
 */
QuarterEngine.prototype.recordDecision = function (quarterNumber, dbName, decisionData, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');

    BusinessQuarter.findOne({
        dbName: dbName,
        quarterNumber: quarterNumber,
        status: 'planning'
    }, function (err, quarter) {
        if (err) {
            return callback({
                success: false,
                message: '查询回合失败: ' + err.message
            });
        }

        if (!quarter) {
            return callback({
                success: false,
                message: '回合不存在或已锁定'
            });
        }

        // 更新决策数据
        if (decisionData.purchasing) {
            quarter.decisions.purchasing = decisionData.purchasing;
        }
        if (decisionData.production) {
            quarter.decisions.production = decisionData.production;
        }
        if (decisionData.sales) {
            quarter.decisions.sales = decisionData.sales;
        }
        if (decisionData.hr) {
            quarter.decisions.hr = decisionData.hr;
        }
        if (decisionData.loans) {
            quarter.decisions.loans = decisionData.loans;
        }

        quarter.save(function (err, doc) {
            if (err) {
                return callback({
                    success: false,
                    message: '保存决策失败: ' + err.message
                });
            }

            callback({
                success: true,
                quarter: doc,
                message: '决策已记录'
            });
        });
    });
};

/**
 * 提交决策 - 锁定本回合决策，进入系统结算阶段
 */
QuarterEngine.prototype.submitDecision = function (quarterNumber, dbName, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');

    BusinessQuarter.findOne({
        dbName: dbName,
        quarterNumber: quarterNumber,
        status: 'planning'
    }, function (err, quarter) {
        if (err) {
            return callback({
                success: false,
                message: '查询回合失败: ' + err.message
            });
        }

        if (!quarter) {
            return callback({
                success: false,
                message: '回合不存在或状态错误'
            });
        }

        // 更新状态
        quarter.status = 'submitted';
        quarter.submittedAt = new Date();

        quarter.save(function (err, doc) {
            if (err) {
                return callback({
                    success: false,
                    message: '提交决策失败: ' + err.message
                });
            }

            callback({
                success: true,
                quarter: doc,
                message: '决策已提交，系统开始结算'
            });
        });
    });
};

/**
 * 自动结算回合 - 执行所有财务、成本、事件、评分计算
 * 这是核心结算流程，调用其他服务来完成完整的结算
 */
QuarterEngine.prototype.settleQuarter = function (quarterNumber, dbName, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');
    var LoanService = require('./loanService')(this.models);
    var EventSimulation = require('./eventSimulation')(this.models);
    var PerformanceEvaluation = require('./performanceEvaluation')(this.models);

    BusinessQuarter.findOne({
        dbName: dbName,
        quarterNumber: quarterNumber
    }, function (err, quarter) {
        if (err) {
            return callback({
                success: false,
                message: '查询回合失败: ' + err.message
            });
        }

        if (!quarter) {
            return callback({
                success: false,
                message: '回合不存在'
            });
        }

        // 并行执行结算流程
        var settlementTasks = {
            // 1. 处理贷款利息
            loanInterest: function (callback) {
                LoanService.accrueInterestForQuarter(quarterNumber, dbName, callback);
            },

            // 2. 触发随机事件
            randomEvents: function (callback) {
                EventSimulation.triggerQuarterlyEvents(quarterNumber, dbName, quarter.openingSnapshot, callback);
            },

            // 3. 计算固定成本
            fixedCosts: function (callback) {
                self._calculateFixedCosts(quarter, callback);
            },

            // 4. 收集经营数据汇总
            operationalSummary: function (callback) {
                self._collectOperationalData(quarter, dbName, callback);
            }
        };

        async.parallel(settlementTasks, function (err, settlementResults) {
            if (err) {
                return callback({
                    success: false,
                    message: '结算过程失败: ' + err.message
                });
            }

            // 汇总结算数据
            quarter.settlement = {
                salesRevenue: settlementResults.operationalSummary.salesRevenue || 0,
                orderFulfillmentRevenue: settlementResults.operationalSummary.fulfillmentRevenue || 0,
                rentalExpense: settlementResults.fixedCosts.rental || 0,
                depreciationExpense: settlementResults.fixedCosts.depreciation || 0,
                managementExpense: settlementResults.fixedCosts.management || 0,
                purchaseCost: settlementResults.operationalSummary.purchaseCost || 0,
                productionCost: settlementResults.operationalSummary.productionCost || 0,
                storageCost: settlementResults.operationalSummary.storageCost || 0,
                personnelCost: settlementResults.operationalSummary.personnelCost || 0,
                interestExpense: settlementResults.loanInterest.totalInterest || 0,
                randomEventImpact: settlementResults.randomEvents.totalImpact || 0
            };

            // 计算总成本和净利润
            quarter.settlement.totalCost = 
                (quarter.settlement.rentalExpense || 0) +
                (quarter.settlement.depreciationExpense || 0) +
                (quarter.settlement.managementExpense || 0) +
                (quarter.settlement.purchaseCost || 0) +
                (quarter.settlement.productionCost || 0) +
                (quarter.settlement.storageCost || 0) +
                (quarter.settlement.personnelCost || 0) +
                (quarter.settlement.interestExpense || 0) -
                (quarter.settlement.randomEventImpact || 0);

            quarter.settlement.netProfit = 
                (quarter.settlement.salesRevenue || 0) - (quarter.settlement.totalCost || 0);

            quarter.settlement.closingCash = 
                (quarter.openingSnapshot.cash || 0) + (quarter.settlement.netProfit || 0);

            // 记录应用的事件
            if (settlementResults.randomEvents.appliedEvents) {
                quarter.appliedEvents = settlementResults.randomEvents.appliedEvents;
            }

            // 计算绩效评分
            PerformanceEvaluation.calculateQuarterlyScore(
                quarterNumber,
                dbName,
                quarter.settlement,
                function (scoreResult) {
                    if (scoreResult.success) {
                        quarter.performanceScore = scoreResult.score;
                        quarter.cumulativeScore = scoreResult.cumulative;
                    }

                    // 更新状态为已完成
                    quarter.status = 'completed';
                    quarter.settledAt = new Date();

                    quarter.save(function (err, doc) {
                        if (err) {
                            return callback({
                                success: false,
                                message: '保存结算结果失败: ' + err.message
                            });
                        }

                        callback({
                            success: true,
                            quarter: doc,
                            message: '第' + quarterNumber + '回合结算完成',
                            summary: {
                                revenue: quarter.settlement.salesRevenue,
                                totalCost: quarter.settlement.totalCost,
                                netProfit: quarter.settlement.netProfit,
                                overallScore: quarter.performanceScore.overallScore
                            }
                        });
                    });
                }
            );
        });
    });
};

/**
 * 计算每回合的固定成本
 * 包括：厂房租金、设备折旧、管理费用
 */
QuarterEngine.prototype._calculateFixedCosts = function (quarter, callback) {
    var fixedCosts = {
        rental: 50000,           // 季度厂房租金
        depreciation: 25000,     // 季度设备折旧
        management: 30000        // 季度管理费用
    };

    callback(null, fixedCosts);
};

/**
 * 收集回合的经营数据
 * 从各个服务获取采购、生产、销售、人力等成本和收入数据
 */
QuarterEngine.prototype._collectOperationalData = function (quarter, dbName, callback) {
    var self = this;

    // 这里需要从各个决策集合和相关服务中提取数据
    // 简化起见，这里返回基础结构，实际使用中应集成各服务
    var operationalData = {
        salesRevenue: 0,
        fulfillmentRevenue: 0,
        purchaseCost: 0,
        productionCost: 0,
        storageCost: 0,
        personnelCost: 0
    };

    // TODO: 从purchaseOrder、productionPlan、virtualMarketOrder等集合中聚合数据
    
    callback(null, operationalData);
};

/**
 * 完成回合后进入下一回合
 */
QuarterEngine.prototype.advanceToNextQuarter = function (currentQuarterNumber, dbName, callback) {
    var self = this;
    
    // 自动初始化下一个回合
    self.initializeNewQuarter(currentQuarterNumber + 1, dbName, function (result) {
        callback(result);
    });
};

/**
 * 重置并重来当前回合
 * 用于单机环境自由重置功能
 */
QuarterEngine.prototype.resetQuarter = function (quarterNumber, dbName, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');

    BusinessQuarter.findOne({
        dbName: dbName,
        quarterNumber: quarterNumber
    }, function (err, quarter) {
        if (err) {
            return callback({
                success: false,
                message: '查询回合失败: ' + err.message
            });
        }

        if (!quarter) {
            return callback({
                success: false,
                message: '回合不存在'
            });
        }

        // 重置到planning状态，清空决策和结算数据
        quarter.status = 'planning';
        quarter.decisions = {
            purchasing: { purchaseOrders: [], totalAmount: 0 },
            production: { productionPlans: [], totalPlanned: 0 },
            sales: { acceptedOrders: [], totalAccepted: 0 },
            hr: { hirings: 0, firings: 0 },
            loans: []
        };
        quarter.settlement = {};
        quarter.appliedEvents = [];
        quarter.performanceScore = {};
        quarter.submittedAt = null;
        quarter.settledAt = null;

        quarter.save(function (err, doc) {
            if (err) {
                return callback({
                    success: false,
                    message: '重置回合失败: ' + err.message
                });
            }

            callback({
                success: true,
                quarter: doc,
                message: '第' + quarterNumber + '回合已重置，可重新开局'
            });
        });
    });
};

/**
 * 获取历史回合列表
 */
QuarterEngine.prototype.getQuarterHistory = function (dbName, limit, callback) {
    var self = this;
    var BusinessQuarter = this.models.get(dbName, 'businessQuarter');

    limit = limit || 10;

    BusinessQuarter.find({ dbName: dbName })
        .sort({ quarterNumber: -1 })
        .limit(limit)
        .exec(function (err, quarters) {
            if (err) {
                return callback({
                    success: false,
                    message: '查询历史回合失败: ' + err.message
                });
            }

            callback({
                success: true,
                quarters: quarters,
                message: '历史回合已获取'
            });
        });
};

module.exports = function (options) {
    return new QuarterEngine(options);
};
