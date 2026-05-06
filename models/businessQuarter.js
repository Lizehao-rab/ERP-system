/**
 * 业务季度模型 - 管理经营回合/季度周期
 * 单机单用户环境，每个季度可自由推进，支持重置重来
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BusinessQuarter = new Schema({
    // 基本信息
    quarterNumber: {
        type: Number,
        required: true,
        index: true
    },
    quarterCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function () {
            return 'Q-' + new Date().getFullYear() + '-' + this.quarterNumber;
        }
    },
    dbName: {
        type: String,
        required: true,
        index: true
    },

    // 回合状态管理
    status: {
        type: String,
        enum: ['planning', 'executing', 'submitted', 'settling', 'completed', 'cancelled'],
        default: 'planning',
        index: true
    },
    // planning: 计划阶段(用户可修改决策)
    // executing: 执行阶段(决策已锁定，等待提交)
    // submitted: 已提交(用户已锁定决策，等待系统结算)
    // settling: 结算中(系统正在自动结算)
    // completed: 已完成(结算完成，可进入下一回合)
    // cancelled: 已取消(用户重置重来)

    // 时间信息
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    submittedAt: {
        type: Date
    },
    settledAt: {
        type: Date
    },

    // 财务快照（回合开始时记录）
    openingSnapshot: {
        cash: Number,
        totalAssets: Number,
        totalLiabilities: Number,
        totalEquity: Number
    },

    // 决策记录（用户提交）
    decisions: {
        purchasing: {
            purchaseOrders: [
                {
                    materialId: String,
                    quantity: Number,
                    unitPrice: Number,
                    totalAmount: Number,
                    createdAt: Date
                }
            ],
            totalAmount: { type: Number, default: 0 }
        },
        production: {
            productionPlans: [
                {
                    planId: String,
                    productId: String,
                    quantityPlanned: Number,
                    workCenterId: String,
                    createdAt: Date
                }
            ],
            totalPlanned: { type: Number, default: 0 }
        },
        sales: {
            acceptedOrders: [
                {
                    orderId: String,
                    productId: String,
                    quantity: Number,
                    dueDate: Date,
                    createdAt: Date
                }
            ],
            totalAccepted: { type: Number, default: 0 }
        },
        hr: {
            hirings: { type: Number, default: 0 },
            firings: { type: Number, default: 0 },
            totalEmployees: Number
        },
        loans: [
            {
                loanId: String,
                loanType: String,
                amount: Number,
                appliedAt: Date
            }
        ]
    },

    // 回合结算数据（系统自动计算）
    settlement: {
        // 收入
        salesRevenue: { type: Number, default: 0 },
        orderFulfillmentRevenue: { type: Number, default: 0 },

        // 固定成本（每回合自动）
        rentalExpense: { type: Number, default: 0 },           // 厂房租金
        depreciationExpense: { type: Number, default: 0 },     // 设备折旧
        managementExpense: { type: Number, default: 0 },       // 管理费用
        
        // 变动成本
        purchaseCost: { type: Number, default: 0 },
        productionCost: { type: Number, default: 0 },
        productionPenalty: { type: Number, default: 0 },
        storageCost: { type: Number, default: 0 },
        personnelCost: { type: Number, default: 0 },
        
        // 金融成本
        interestExpense: { type: Number, default: 0 },         // 贷款利息
        
        // 随机事件成本/收益
        randomEventImpact: { type: Number, default: 0 },

        // 总体
        totalCost: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        closingCash: { type: Number, default: 0 }
    },

    // 随机事件应用记录
    appliedEvents: [
        {
            eventId: String,
            eventType: String,
            eventName: String,
            impact: Number,
            appliedAt: Date
        }
    ],

    // 性能评分
    performanceScore: {
        overallScore: { type: Number, min: 0, max: 100, default: 0 },
        financialHealth: { type: Number, min: 0, max: 100, default: 0 },
        operationalEfficiency: { type: Number, min: 0, max: 100, default: 0 },
        costControl: { type: Number, min: 0, max: 100, default: 0 },
        scoreDetails: {
            cashFlowScore: Number,
            debtRatioScore: Number,
            profitMarginScore: Number,
            capacityUtilization: Number,
            orderFulfillmentRate: Number,
            procurementCostControl: Number,
            laborCostControl: Number,
            fixedCostControl: Number
        }
    },

    // 累计评分（全游戏进度）
    cumulativeScore: {
        totalScore: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        highestScore: { type: Number, default: 0 },
        lowestScore: { type: Number, default: 0 },
        completedQuarters: { type: Number, default: 0 }
    },

    // 元数据
    createdBy: String,
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 索引
BusinessQuarter.index({ quarterNumber: 1, dbName: 1 });
BusinessQuarter.index({ status: 1, dbName: 1 });
BusinessQuarter.index({ createdAt: -1 });
BusinessQuarter.index({ settledAt: -1 });

module.exports = BusinessQuarter;
