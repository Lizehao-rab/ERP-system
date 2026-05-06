/**
 * 贷款管理模型 - 短期和长期贷款管理
 * 包括额度限制、利率固定、自动还本付息逻辑
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LoanManagement = new Schema({
    // 基本信息
    loanCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function () {
            return 'LOAN-' + new Date().getFullYear() + '-' + Date.now();
        }
    },
    dbName: {
        type: String,
        required: true,
        index: true
    },

    // 贷款类型和基本参数
    loanType: {
        type: String,
        enum: ['shortTerm', 'longTerm'],
        required: true,
        index: true
    },
    // shortTerm: 短期贷款(3个月内到期, 利率较低)
    // longTerm: 长期贷款(12个月到期, 利率较高)

    principalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    borrowQuarterNumber: {
        type: Number,
        required: true,
        index: true
    },

    // 利率和成本
    annualInterestRate: {
        type: Number,
        required: true,
        default: function () {
            return this.loanType === 'shortTerm' ? 0.05 : 0.08; // 5% or 8%
        }
    },
    quarterlyInterestRate: {
        type: Number,
        default: function () {
            return this.annualInterestRate / 4;
        }
    },

    // 还款计划
    repaymentSchedule: {
        type: String,
        enum: ['monthly', 'quarterly', 'atMaturity'],
        default: function () {
            return this.loanType === 'shortTerm' ? 'atMaturity' : 'quarterly';
        }
    },

    // 到期日期计算
    borrowDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    maturityDate: {
        type: Date,
        required: true
    },
    maturityQuarter: {
        type: Number,
        required: true,
        index: true
    },

    // 还款跟踪
    totalInterestAccrued: {
        type: Number,
        default: 0
    },
    totalRepaid: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        required: true
    },

    // 还款记录
    repaymentHistory: [
        {
            quarterNumber: Number,
            interestCharged: Number,
            principalRepaid: Number,
            totalRepaid: Number,
            repaidAt: Date,
            status: {
                type: String,
                enum: ['scheduled', 'paid', 'pending', 'overdue'],
                default: 'scheduled'
            }
        }
    ],

    // 额度限制和级别
    loanLimit: {
        type: Number,
        default: function () {
            return this.loanType === 'shortTerm' ? 500000 : 1000000; // Max amounts
        }
    },
    currentDebtRatio: Number,

    // 贷款状态
    status: {
        type: String,
        enum: ['active', 'repaying', 'paid', 'overdue', 'defaulted', 'cancelled'],
        default: 'active',
        index: true
    },

    // 违约信息
    defaultInfo: {
        isDefaulted: { type: Boolean, default: false },
        defaultedAt: Date,
        defaultAmount: Number,
        penalties: Number
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
    createdBy: String,
    approvedBy: String
});

// 复合索引
LoanManagement.index({ dbName: 1, status: 1 });
LoanManagement.index({ maturityQuarter: 1, dbName: 1 });
LoanManagement.index({ loanType: 1, status: 1 });

module.exports = LoanManagement;
