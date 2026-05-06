module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var businessCycleSummarySchema = new mongoose.Schema({
        /**
         * Auto-generated financial summary for each business cycle (turn/period)
         * Eliminates manual journal entry: system auto-calculates and records P&L, assets, liabilities per cycle
         * 
         * @module BusinessCycleSummary
         * @class BusinessCycleSummary
         * 
         * @property {Number} cycleNumber - Sequential cycle/turn number in business simulation
         * @property {Date} periodStart - Start date of cycle
         * @property {Date} periodEnd - End date of cycle
         * 
         * @property {Number} revenue - Total revenue for cycle (from sales, contracts, etc.)
         * 
         * @property {Object} costs - Breakdown of expenses for cycle
         * @property {Number} costs.materials - Material purchase costs (COGS)
         * @property {Number} costs.personnel - Personnel salary costs (rigid monthly expense)
         * @property {Number} costs.depreciation - Equipment/facility depreciation (fixed cost)
         * @property {Number} costs.interest - Loan interest expense
         * @property {Number} costs.penalties - Contract penalty losses
         * @property {Number} costs.randomEvents - Random event losses/expenses
         * @property {Number} costs.other - Other miscellaneous costs
         * 
         * @property {Number} totalCosts - Sum of all costs for cycle
         * @property {Number} netProfit - Revenue minus total costs (bottom line P&L)
         * 
         * @property {Number} totalAssets - Balance sheet: total assets (current + fixed)
         * @property {Number} totalLiabilities - Balance sheet: total liabilities
         * 
         * @property {Number} cashFlow - Net cash flow for cycle (operating + investing + financing)
         * 
         * @property {Date} createdAt - Timestamp when summary was auto-generated
         * @property {String} createdBy - System user or automated process that created summary
         * 
         * @property {Boolean} isFinalized - Whether cycle is locked/finalized (no further edits)
         * @property {Date} finalizedAt - When cycle was finalized
         */

        cycleNumber: {
            type: Number,
            required: true,
            index: true
        },

        periodStart: {
            type: Date,
            required: true
        },

        periodEnd: {
            type: Date,
            required: true
        },

        revenue: {
            type: Number,
            default: 0
        },

        costs: {
            materials: {
                type: Number,
                default: 0
            },
            personnel: {
                type: Number,
                default: 0
            },
            depreciation: {
                type: Number,
                default: 0
            },
            interest: {
                type: Number,
                default: 0
            },
            penalties: {
                type: Number,
                default: 0
            },
            randomEvents: {
                type: Number,
                default: 0
            },
            other: {
                type: Number,
                default: 0
            }
        },

        totalCosts: {
            type: Number,
            default: 0
        },

        netProfit: {
            type: Number,
            default: 0
        },

        totalAssets: {
            type: Number,
            default: 0
        },

        totalLiabilities: {
            type: Number,
            default: 0
        },

        cashFlow: {
            type: Number,
            default: 0
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        createdBy: {
            type: String,
            default: 'system'
        },

        isFinalized: {
            type: Boolean,
            default: false
        },

        finalizedAt: {
            type: Date,
            default: null
        },

        notes: {
            type: String,
            default: ''
        }

    }, { collection: 'businessCycleSummary' });

    mongoose.model('businessCycleSummary', businessCycleSummarySchema, 'businessCycleSummary');
    mongoose.Schemas.businessCycleSummary = businessCycleSummarySchema;

    return businessCycleSummarySchema;

})();
