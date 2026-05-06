/**
 * 绩效评估服务 - 个人综合评分系统（百分制）
 * 多维度评分：财务健康（35%）、运营效率（35%）、成本控制（30%）
 * 每回合自动打分、展示扣分明细、累计总分
 */

var async = require('async');

var PerformanceEvaluation = function (options) {
    'use strict';
    this.event = options.event;
    this.models = options.models;
};

/**
 * 计算单个回合的绩效评分
 */
PerformanceEvaluation.prototype.calculateQuarterlyScore = function (quarterNumber, dbName, settlement, callback) {
    var self = this;
    var PerformanceScore = this.models.get(dbName, 'performanceScore');

    // 并行计算三个主要维度
    var scoringTasks = {
        financialHealth: function (callback) {
            self._calculateFinancialHealth(settlement, callback);
        },
        operationalEfficiency: function (callback) {
            self._calculateOperationalEfficiency(quarterNumber, dbName, settlement, callback);
        },
        costControl: function (callback) {
            self._calculateCostControl(settlement, callback);
        },
        previousScore: function (callback) {
            // 查询上一回合的评分
            PerformanceScore.findOne({
                dbName: dbName,
                quarterNumber: quarterNumber - 1,
                status: 'calculated'
            }).sort({ scoringDate: -1 }).exec(callback);
        }
    };

    async.parallel(scoringTasks, function (err, results) {
        if (err) {
            return callback({
                success: false,
                message: '计算评分失败: ' + err.message
            });
        }

        // 汇总评分
        var overallScore = 
            results.financialHealth.score * 0.35 +
            results.operationalEfficiency.score * 0.35 +
            results.costControl.score * 0.30;

        overallScore = Math.round(overallScore);

        // 计算环比变化
        var previousQuarterScore = results.previousScore ? results.previousScore.overallScore : 0;
        var quarterOverQuarterChange = overallScore - previousQuarterScore;
        var trendIndicator = quarterOverQuarterChange > 5 ? 'improving' : 
                            (quarterOverQuarterChange < -5 ? 'declining' : 'stable');

        // 创建评分记录
        var scoreRecord = new PerformanceScore({
            dbName: dbName,
            quarterNumber: quarterNumber,
            scoringDate: new Date(),
            financialHealth: results.financialHealth,
            operationalEfficiency: results.operationalEfficiency,
            costControl: results.costControl,
            overallScore: overallScore,
            deductionDetails: [
                ...results.financialHealth.deductions,
                ...results.operationalEfficiency.deductions,
                ...results.costControl.deductions
            ],
            totalDeduction: 300 - (
                results.financialHealth.score +
                results.operationalEfficiency.score +
                results.costControl.score
            ),
            quarterComparison: {
                previousQuarterScore: previousQuarterScore,
                quarterOverQuarterChange: quarterOverQuarterChange,
                trendIndicator: trendIndicator
            },
            status: 'calculated'
        });

        // 获取累计统计
        PerformanceScore.find({
            dbName: dbName,
            status: 'calculated',
            quarterNumber: { $lte: quarterNumber }
        }, function (err, allScores) {
            var totalQuarters = allScores ? allScores.length : 0;
            var totalScore = 0;
            var highestScore = 0;
            var lowestScore = 100;
            var bestCategory = '';
            var worstCategory = '';

            if (allScores && allScores.length > 0) {
                allScores.forEach(function (score) {
                    totalScore += score.overallScore;
                    if (score.overallScore > highestScore) highestScore = score.overallScore;
                    if (score.overallScore < lowestScore) lowestScore = score.overallScore;
                });
            }

            var averageScore = totalQuarters > 0 ? Math.round(totalScore / totalQuarters) : 0;

            // 确定最强和最弱的维度
            var categoryScores = {
                'financialHealth': results.financialHealth.score,
                'operationalEfficiency': results.operationalEfficiency.score,
                'costControl': results.costControl.score
            };

            bestCategory = Object.keys(categoryScores).reduce((a, b) => 
                categoryScores[a] > categoryScores[b] ? a : b
            );
            worstCategory = Object.keys(categoryScores).reduce((a, b) => 
                categoryScores[a] < categoryScores[b] ? a : b
            );

            scoreRecord.cumulativeStatistics = {
                totalQuartersCompleted: totalQuarters,
                averageScore: averageScore,
                highestScore: highestScore,
                lowestScore: lowestScore,
                bestPerformanceCategory: bestCategory,
                weakestPerformanceCategory: worstCategory
            };

            scoreRecord.calculatedAt = new Date();

            scoreRecord.save(function (err, doc) {
                if (err) {
                    return callback({
                        success: false,
                        message: '保存评分失败: ' + err.message
                    });
                }

                callback({
                    success: true,
                    score: doc,
                    cumulative: scoreRecord.cumulativeStatistics
                });
            });
        });
    });
};

/**
 * 计算财务健康评分 (0-100)
 * 包括：现金流、负债率、净利润
 */
PerformanceEvaluation.prototype._calculateFinancialHealth = function (settlement, callback) {
    var deductions = [];
    var totalScore = 100;

    // 1. 现金流评分
    var closingCash = settlement.closingCash || 0;
    var minimumCash = 100000;  // 最低现金要求
    var cashFlowScore = 100;

    if (closingCash < minimumCash * 0.5) {
        var deduction1 = 30;
        totalScore -= deduction1;
        cashFlowScore -= deduction1;
        deductions.push({
            category: 'financialHealth',
            item: 'cashFlow',
            deduction: deduction1,
            reason: '现金流严重不足'
        });
    } else if (closingCash < minimumCash) {
        var deduction2 = 15;
        totalScore -= deduction2;
        cashFlowScore -= deduction2;
        deductions.push({
            category: 'financialHealth',
            item: 'cashFlow',
            deduction: deduction2,
            reason: '现金流不足'
        });
    }

    // 2. 净利润评分
    var netProfit = settlement.netProfit || 0;
    var revenue = settlement.salesRevenue || 0;
    var profitMarginScore = 100;

    if (netProfit < 0) {
        var deduction3 = 50;
        totalScore -= deduction3;
        profitMarginScore -= deduction3;
        deductions.push({
            category: 'financialHealth',
            item: 'profitMargin',
            deduction: deduction3,
            reason: '本回合亏损'
        });
    } else if (revenue > 0) {
        var margin = netProfit / revenue;
        if (margin < 0.05) {
            var deduction4 = 20;
            totalScore -= deduction4;
            profitMarginScore -= deduction4;
            deductions.push({
                category: 'financialHealth',
                item: 'profitMargin',
                deduction: deduction4,
                reason: '利润率过低'
            });
        }
    }

    totalScore = Math.max(0, Math.min(100, totalScore));

    callback(null, {
        score: totalScore,
        cashFlow: {
            score: cashFlowScore,
            currentCash: closingCash,
            minimumCash: minimumCash
        },
        profitMargin: {
            score: profitMarginScore,
            revenue: revenue,
            netProfit: netProfit
        },
        deductions: deductions
    });
};

/**
 * 计算运营效率评分 (0-100)
 * 包括：产能利用率、订单履约率、按时交付率、库存周转率
 */
PerformanceEvaluation.prototype._calculateOperationalEfficiency = function (quarterNumber, dbName, settlement, callback) {
    var self = this;
    var deductions = [];
    var totalScore = 100;

    // 简化版本：基于结算数据中的关键指标
    // 在完整系统中，应该从各服务中获取详细数据

    // 1. 订单履约率 - 基于销售收入推断
    var expectedRevenue = 200000;  // 预期收入基准
    var fulfillmentRate = settlement.salesRevenue > 0 ? 
        (settlement.salesRevenue / expectedRevenue) * 100 : 0;
    fulfillmentRate = Math.min(100, fulfillmentRate);
    var fulfillmentScore = 100;

    if (fulfillmentRate < 50) {
        var deduction1 = 40;
        totalScore -= deduction1;
        fulfillmentScore -= deduction1;
        deductions.push({
            category: 'operationalEfficiency',
            item: 'orderFulfillmentRate',
            deduction: deduction1,
            reason: '订单履约率严重不足'
        });
    } else if (fulfillmentRate < 80) {
        var deduction2 = 20;
        totalScore -= deduction2;
        fulfillmentScore -= deduction2;
        deductions.push({
            category: 'operationalEfficiency',
            item: 'orderFulfillmentRate',
            deduction: deduction2,
            reason: '订单履约率偏低'
        });
    }

    // 2. 生产延期罚款 - 如果罚款过高，说明交付延迟
    var productionPenalty = settlement.productionPenalty || 0;
    var penaltyScore = 100;

    if (productionPenalty > 50000) {
        var deduction3 = 35;
        totalScore -= deduction3;
        penaltyScore -= deduction3;
        deductions.push({
            category: 'operationalEfficiency',
            item: 'onTimeDeliveryRate',
            deduction: deduction3,
            reason: '生产延期罚款过高'
        });
    } else if (productionPenalty > 20000) {
        var deduction4 = 15;
        totalScore -= deduction4;
        penaltyScore -= deduction4;
        deductions.push({
            category: 'operationalEfficiency',
            item: 'onTimeDeliveryRate',
            deduction: deduction4,
            reason: '存在生产延期'
        });
    }

    totalScore = Math.max(0, Math.min(100, totalScore));

    callback(null, {
        score: totalScore,
        orderFulfillmentRate: {
            score: fulfillmentScore,
            fulfillmentRate: Math.round(fulfillmentRate)
        },
        onTimeDeliveryRate: {
            score: penaltyScore,
            penaltyAmount: productionPenalty
        },
        deductions: deductions
    });
};

/**
 * 计算成本控制评分 (0-100)
 * 包括：采购成本控制、人力成本控制、固定成本控制、库存成本
 */
PerformanceEvaluation.prototype._calculateCostControl = function (settlement, callback) {
    var deductions = [];
    var totalScore = 100;

    // 1. 采购成本与收入比
    var purchaseCost = settlement.purchaseCost || 0;
    var salesRevenue = settlement.salesRevenue || 0;
    var purchaseRatio = salesRevenue > 0 ? (purchaseCost / salesRevenue) * 100 : 100;
    var purchaseScore = 100;

    if (purchaseRatio > 60) {
        var deduction1 = 30;
        totalScore -= deduction1;
        purchaseScore -= deduction1;
        deductions.push({
            category: 'costControl',
            item: 'procurementControl',
            deduction: deduction1,
            reason: '采购成本占比过高'
        });
    } else if (purchaseRatio > 45) {
        var deduction2 = 15;
        totalScore -= deduction2;
        purchaseScore -= deduction2;
        deductions.push({
            category: 'costControl',
            item: 'procurementControl',
            deduction: deduction2,
            reason: '采购成本可优化'
        });
    }

    // 2. 人力成本控制
    var personnelCost = settlement.personnelCost || 0;
    var personnelRatio = salesRevenue > 0 ? (personnelCost / salesRevenue) * 100 : 100;
    var laborScore = 100;

    if (personnelRatio > 30) {
        var deduction3 = 25;
        totalScore -= deduction3;
        laborScore -= deduction3;
        deductions.push({
            category: 'costControl',
            item: 'laborCostControl',
            deduction: deduction3,
            reason: '人力成本占比过高'
        });
    } else if (personnelRatio > 20) {
        var deduction4 = 10;
        totalScore -= deduction4;
        laborScore -= deduction4;
        deductions.push({
            category: 'costControl',
            item: 'laborCostControl',
            deduction: deduction4,
            reason: '人力成本需优化'
        });
    }

    // 3. 固定成本控制
    var fixedCost = (settlement.rentalExpense || 0) + 
                   (settlement.depreciationExpense || 0) + 
                   (settlement.managementExpense || 0);
    var fixedCostRatio = salesRevenue > 0 ? (fixedCost / salesRevenue) * 100 : 100;
    var fixedScore = 100;

    if (fixedCostRatio > 40) {
        var deduction5 = 20;
        totalScore -= deduction5;
        fixedScore -= deduction5;
        deductions.push({
            category: 'costControl',
            item: 'fixedCostControl',
            deduction: deduction5,
            reason: '固定成本占比过高'
        });
    }

    // 4. 库存成本
    var storageCost = settlement.storageCost || 0;
    var storageScore = 100;

    if (storageCost > 30000) {
        var deduction6 = 15;
        totalScore -= deduction6;
        storageScore -= deduction6;
        deductions.push({
            category: 'costControl',
            item: 'storageCostControl',
            deduction: deduction6,
            reason: '库存持有成本过高'
        });
    }

    totalScore = Math.max(0, Math.min(100, totalScore));

    callback(null, {
        score: totalScore,
        procurementControl: {
            score: purchaseScore,
            purchaseRatio: Math.round(purchaseRatio)
        },
        laborCostControl: {
            score: laborScore,
            laborRatio: Math.round(personnelRatio)
        },
        fixedCostControl: {
            score: fixedScore,
            fixedCostRatio: Math.round(fixedCostRatio)
        },
        storageCostControl: {
            score: storageScore,
            storageCost: storageCost
        },
        deductions: deductions
    });
};

/**
 * 获取历史评分和趋势
 */
PerformanceEvaluation.prototype.getScoreHistory = function (dbName, limit, callback) {
    var self = this;
    var PerformanceScore = this.models.get(dbName, 'performanceScore');

    limit = limit || 10;

    PerformanceScore.find({
        dbName: dbName,
        status: 'calculated'
    }).sort({ quarterNumber: -1 })
     .limit(limit)
     .exec(function (err, scores) {
        if (err) {
            return callback({
                success: false,
                message: '查询历史评分失败: ' + err.message
            });
        }

        callback({
            success: true,
            scores: scores.reverse(),  // 正序排列
            message: '历史评分已获取'
        });
    });
};

module.exports = function (options) {
    return new PerformanceEvaluation(options);
};
