/**
 * 绩效评分模型 - 个人综合评分系统（百分制）
 * 多维度评分：财务健康、运营效率、成本控制
 * 每回合自动打分、展示扣分明细、累计总分、保存历史
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PerformanceScore = new Schema({
    // 基本信息
    scoreCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function () {
            return 'SCORE-' + new Date().getFullYear() + '-' + Date.now();
        }
    },
    dbName: {
        type: String,
        required: true,
        index: true
    },

    // 评分周期
    quarterNumber: {
        type: Number,
        required: true,
        index: true
    },
    scoringDate: {
        type: Date,
        default: Date.now,
        index: true
    },

    // ============ 财务健康评分 (0-100) ============
    financialHealth: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        
        // 现金流评分
        cashFlow: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            currentCash: Number,
            minimumCash: Number,  // 最低现金要求
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 负债率评分
        debtRatio: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalLiabilities: Number,
            totalAssets: Number,
            ratio: Number,  // liabilities/assets
            threshold: { type: Number, default: 0.6 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 净利润评分
        profitMargin: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            revenue: Number,
            totalCost: Number,
            netProfit: Number,
            marginRatio: Number,  // profit/revenue
            targetMargin: { type: Number, default: 0.15 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        }
    },

    // ============ 运营效率评分 (0-100) ============
    operationalEfficiency: {
        score: { type: Number, min: 0, max: 100, default: 0 },

        // 产能利用率
        capacityUtilization: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            plannedCapacity: Number,
            actualProduction: Number,
            utilizationRate: Number,  // actual/planned
            targetUtilization: { type: Number, default: 0.85 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 订单履约率
        orderFulfillmentRate: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalOrders: Number,
            fulfilledOrders: Number,
            delayedOrders: Number,
            fulfillmentRate: Number,  // fulfilled/total
            targetFulfillment: { type: Number, default: 0.95 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 按时交付率
        onTimeDeliveryRate: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            onTimeOrders: Number,
            totalOrders: Number,
            delayDays: Number,
            onTimeRate: Number,  // onTime/total
            targetOnTime: { type: Number, default: 0.90 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 库存周转率
        inventoryTurnover: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalSales: Number,
            averageInventory: Number,
            turnoverRate: Number,
            targetTurnover: { type: Number, default: 4 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        }
    },

    // ============ 成本控制评分 (0-100) ============
    costControl: {
        score: { type: Number, min: 0, max: 100, default: 0 },

        // 采购成本控制
        procurementControl: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalPurchaseAmount: Number,
            priceVariance: Number,  // 与基准价差%
            targetVariance: { type: Number, default: -0.05 },  // 目标降低5%
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 人力成本控制
        laborCostControl: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalPersonnelCost: Number,
            personalPerCapita: Number,
            employeeCount: Number,
            salesPerEmployee: Number,
            targetSalesPerEmployee: { type: Number, default: 50000 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 固定成本控制
        fixedCostControl: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalFixedCost: Number,  // 租金+折旧+管理费
            revenue: Number,
            fixedCostRatio: Number,  // fixedCost/revenue
            targetRatio: { type: Number, default: 0.25 },
            deduction: { type: Number, default: 0 },
            deductionReason: String
        },

        // 库存持有成本
        storageCostControl: {
            score: { type: Number, min: 0, max: 100, default: 0 },
            totalStorageCost: Number,
            inventory: Number,
            storageCostPerUnit: Number,
            targetStorageCost: Number,
            deduction: { type: Number, default: 0 },
            deductionReason: String
        }
    },

    // ============ 综合评分 (0-100) ============
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    scoreBreakdown: {
        financialHealthWeight: { type: Number, default: 0.35 },
        operationalEfficiencyWeight: { type: Number, default: 0.35 },
        costControlWeight: { type: Number, default: 0.30 }
    },

    // ============ 扣分明细 ============
    deductionDetails: [
        {
            category: String,  // financialHealth, operationalEfficiency, costControl
            item: String,  // 具体项目
            originalScore: Number,
            deduction: Number,
            finalScore: Number,
            reason: String
        }
    ],
    totalDeduction: { type: Number, default: 0 },

    // ============ 历史对比 ============
    quarterComparison: {
        previousQuarterScore: Number,
        quarterOverQuarterChange: Number,  // 环比变化
        trendIndicator: {
            type: String,
            enum: ['improving', 'stable', 'declining']
        }
    },

    // ============ 累计成绩 ============
    cumulativeStatistics: {
        totalQuartersCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        lowestScore: { type: Number, default: 0 },
        bestPerformanceCategory: String,
        weakestPerformanceCategory: String
    },

    // ============ 评分状态 ============
    status: {
        type: String,
        enum: ['pending', 'calculated', 'approved', 'archived'],
        default: 'pending',
        index: true
    },
    calculatedAt: Date,
    approvedAt: Date,
    approvedBy: String,

    // 元数据
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    remarks: String
});

// 索引
PerformanceScore.index({ dbName: 1, quarterNumber: 1 });
PerformanceScore.index({ quarterNumber: 1, overallScore: -1 });
PerformanceScore.index({ status: 1, dbName: 1 });
PerformanceScore.index({ scoringDate: -1 });

module.exports = PerformanceScore;
