module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var productionPlanSchema = new mongoose.Schema({
        /**
         * 生产计划模型 - 简化版
         * 关键字段: 生产数量、完成期限、BOM配置、生产进度
         */
        cycleNumber: {
            type: Number,
            required: true,
            index: true
        },

        planCode: {
            type: String,
            unique: true,
            required: true,
            index: true
        },

        productId: {
            type: ObjectId,
            ref: 'product',
            required: true
        },

        productName: {
            type: String,
            required: true
        },

        quantityPlanned: {
            type: Number,
            required: true,
            min: 1
        },

        quantityProduced: {
            type: Number,
            default: 0,
            min: 0
        },

        quantityCompleted: {
            type: Number,
            default: 0,
            min: 0
        },

        // BOM配置 - 保留原有结构
        bomId: {
            type: ObjectId,
            ref: 'bom'
        },

        bomItems: [
            {
                materialId: ObjectId,
                materialName: String,
                quantityPerUnit: Number,
                totalQuantityRequired: Number,
                quantityAllocated: Number,
                quantityConsumed: Number
            }
        ],

        // 工作中心和产能约束
        workCenterId: {
            type: ObjectId,
            ref: 'workCenter'
        },

        workCenterName: {
            type: String
        },

        // 生产周期 - 单位: 回合数 (1 = 1个周期需要完工)
        productionCycleDays: {
            type: Number,
            default: 1,
            min: 1
        },

        // 生产时间
        planStartDate: {
            type: Date,
            required: true
        },

        planDueDate: {
            type: Date,
            required: true
        },

        actualStartDate: {
            type: Date
        },

        actualCompletionDate: {
            type: Date
        },

        // 状态: planned → inprogress → completed → delayed → cancelled
        status: {
            type: String,
            enum: ['planned', 'inprogress', 'completed', 'delayed', 'cancelled'],
            default: 'planned'
        },

        // 产能占用
        capacityUtilization: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        // 关联销售订单 - 用于履约跟踪
        linkedVirtualOrders: [
            {
                orderId: ObjectId,
                orderCode: String,
                quantity: Number,
                dueDate: Date
            }
        ],

        // 违约罚款
        contractPenalty: {
            isApplied: {
                type: Boolean,
                default: false
            },
            penaltyAmount: {
                type: Number,
                default: 0,
                min: 0
            },
            scoreDeduction: {
                type: Number,
                default: 0,
                min: 0
            },
            reason: String
        },

        notes: String,

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        },

        createdBy: {
            type: ObjectId,
            ref: 'employee'
        }
    }, {
        collection: 'productionPlan',
        strict: true
    });

    // Middleware: 自动更新updatedAt
    productionPlanSchema.pre('save', function (next) {
        this.updatedAt = new Date();
        next();
    });

    mongoose.model('productionPlan', productionPlanSchema, 'productionPlan');

    return productionPlanSchema;
});
