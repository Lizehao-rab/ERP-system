/**
 * 经营事件模型 - 每回合随机触发的经营事件
 * 包含原料涨价、产品溢价、政府补贴、设备维修等
 * 仅影响单人经营数据，纯随机独立
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OperatingEvent = new Schema({
    // 基本信息
    eventCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function () {
            return 'EVENT-' + new Date().getFullYear() + '-' + Date.now();
        }
    },
    dbName: {
        type: String,
        required: true,
        index: true
    },

    // 事件分类
    eventType: {
        type: String,
        enum: [
            'materialPriceIncrease',      // 原料涨价
            'materialPriceDecrease',      // 原料降价
            'productPremium',             // 产品溢价/畅销
            'productDiscount',            // 产品滞销/降价压力
            'governmentSubsidy',          // 政府补贴
            'equipmentRepair',            // 设备维修支出
            'marketDemandIncrease',       // 市场需求增长
            'marketDemandDecrease',       // 市场需求萎缩
            'employeeTurnover',           // 员工离职
            'qualityIncident',            // 质量事故损失
            'customerComplaint',          // 客户投诉/退货
            'supplyChainDisruption',      // 供应链中断
            'regulatoryFine',             // 监管罚款
            'taxIncentive',               // 税收优惠
            'currencyFluctuation'         // 汇率波动
        ],
        required: true,
        index: true
    },
    eventName: {
        type: String,
        required: true
    },
    description: String,

    // 事件触发
    quarterTriggered: {
        type: Number,
        required: true,
        index: true
    },
    triggerProbability: {
        type: Number,
        min: 0,
        max: 100,
        default: 30  // 30%概率每回合触发
    },
    triggered: {
        type: Boolean,
        default: false,
        index: true
    },
    triggeredAt: Date,

    // 财务影响
    financialImpact: {
        impactType: {
            type: String,
            enum: ['cost', 'revenue', 'both'],
            required: true
        },
        baseAmount: {
            type: Number,
            required: true
        },
        variance: {
            type: Number,
            default: 0  // 变动范围：±variance
        },
        actualAmount: Number,  // 实际影响金额

        // 按类别影响
        affectedCategory: {
            type: String,
            enum: [
                'materialCost',
                'productPrice',
                'operatingCost',
                'equipmentCost',
                'personnelCost',
                'other'
            ]
        }
    },

    // 运营影响
    operationalImpact: {
        affectsProduction: { type: Boolean, default: false },
        productionDelay: Number,  // 延迟天数
        affectsQuality: { type: Boolean, default: false },
        qualityDefectRate: Number,  // 缺陷率%
        affectsMaterials: { type: Boolean, default: false },
        materialShortageDays: Number  // 短缺天数
    },

    // 分数影响
    scoreImpact: {
        financialHealthDelta: { type: Number, default: 0 },
        operationalEfficiencyDelta: { type: Number, default: 0 },
        costControlDelta: { type: Number, default: 0 },
        totalScoreDelta: { type: Number, default: 0 }
    },

    // 事件应用记录
    applicationLog: [
        {
            appQarter: Number,
            appliedAt: Date,
            outcome: String,
            resultAmount: Number
        }
    ],

    // 事件池管理
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 50  // 优先级 0-100
    },
    frequency: {
        type: String,
        enum: ['oneTime', 'recurring'],
        default: 'recurring'
    },
    lastTriggeredQuarter: Number,
    cooldownQuarters: {
        type: Number,
        default: 1  // 触发后冷却期
    },

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
    createdBy: String
});

// 索引
OperatingEvent.index({ eventType: 1, dbName: 1 });
OperatingEvent.index({ quarterTriggered: 1, triggered: 1 });
OperatingEvent.index({ isActive: 1, dbName: 1 });

module.exports = OperatingEvent;
