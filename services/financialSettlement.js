'use strict';

var mongoose = require('mongoose');
var businessCycleSummarySchema = mongoose.Schemas.businessCycleSummary;
var moment = require('../public/js/libs/moment/moment');
var _ = require('underscore');
var async = require('async');
var CONSTANTS = require('../constants/mainConstants');
var ObjectId = mongoose.Types.ObjectId;

module.exports = function (models) {
    return new function () {
        /**
         * Auto-calculate cycle financial summary without manual journal entries
         * Aggregates: revenue, material costs, personnel costs, depreciation, interest, penalties, random events
         * Returns: P&L, balance sheet, cash flow for the cycle
         * 
         * @param {Object} options - {dbName, cycleNumber, periodStart, periodEnd, revenueData, costsData, randomEvents, companyState}
         * @param {Function} callback - (err, summary)
         */
        this.calculateCycleSummary = function (options, callback) {
            var BusinessCycleSummary;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (typeof callback !== 'function') {
                callback = function () {
                    return false;
                };
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters: dbName required');
                err.status = 400;
                return callback(err);
            }

            BusinessCycleSummary = models.get(dbName, 'businessCycleSummary', businessCycleSummarySchema);

            var cycleNumber = options.cycleNumber || 1;
            var periodStart = options.periodStart ? moment(options.periodStart).toDate() : moment().startOf('month').toDate();
            var periodEnd = options.periodEnd ? moment(options.periodEnd).toDate() : moment().endOf('month').toDate();

            // Initialize summary object
            var summary = {
                cycleNumber: cycleNumber,
                periodStart: periodStart,
                periodEnd: periodEnd,
                revenue: options.revenue || 0,
                costs: {
                    materials: options.materialCosts || 0,
                    personnel: options.personnelCosts || 0,
                    depreciation: options.depreciationCosts || 0,
                    interest: options.interestCosts || 0,
                    penalties: options.penaltyCosts || 0,
                    randomEvents: options.randomEventCosts || 0,
                    other: options.otherCosts || 0
                },
                totalCosts: 0,
                netProfit: 0,
                totalAssets: options.totalAssets || 0,
                totalLiabilities: options.totalLiabilities || 0,
                cashFlow: options.cashFlow || 0,
                createdAt: new Date(),
                createdBy: options.createdBy || null
            };

            // Calculate totals
            summary.totalCosts = 
                summary.costs.materials + 
                summary.costs.personnel + 
                summary.costs.depreciation + 
                summary.costs.interest + 
                summary.costs.penalties + 
                summary.costs.randomEvents + 
                summary.costs.other;

            summary.netProfit = summary.revenue - summary.totalCosts;

            // Save to database
            var cycleSummaryRecord = new BusinessCycleSummary(summary);
            cycleSummaryRecord.save(function (err, saved) {
                if (err) {
                    return callback(err);
                }

                callback(null, saved);
            });
        };

        /**
         * Get latest cycle summary for quick dashboard display
         * 
         * @param {Object} options - {dbName, companyId}
         * @param {Function} callback - (err, summary)
         */
        this.getLatestCycleSummary = function (options, callback) {
            var BusinessCycleSummary;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (typeof callback !== 'function') {
                callback = function () {
                };
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters: dbName required');
                err.status = 400;
                return callback(err);
            }

            BusinessCycleSummary = models.get(dbName, 'businessCycleSummary', businessCycleSummarySchema);

            // Find the most recent cycle summary
            BusinessCycleSummary
                .find({})
                .sort({ cycleNumber: -1 })
                .limit(1)
                .exec(function (err, results) {
                    if (err) {
                        return callback(err);
                    }

                    var latest = results && results.length > 0 ? results[0] : null;
                    callback(null, latest);
                });
        };

        /**
         * Get all cycle summaries for historical view
         * 
         * @param {Object} options - {dbName, limit, skip}
         * @param {Function} callback - (err, summaries)
         */
        this.getCycleSummaries = function (options, callback) {
            var BusinessCycleSummary;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (typeof callback !== 'function') {
                callback = function () {
                };
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters: dbName required');
                err.status = 400;
                return callback(err);
            }

            BusinessCycleSummary = models.get(dbName, 'businessCycleSummary', businessCycleSummarySchema);

            var limit = options.limit || 50;
            var skip = options.skip || 0;

            BusinessCycleSummary
                .find({})
                .sort({ cycleNumber: -1 })
                .skip(skip)
                .limit(limit)
                .exec(function (err, summaries) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, summaries || []);
                });
        };

        /**
         * Get cumulative financial snapshot (total revenue, total costs, cumulative net profit, current assets/liabilities)
         * 
         * @param {Object} options - {dbName}
         * @param {Function} callback - (err, snapshot)
         */
        this.getFinancialSnapshot = function (options, callback) {
            var BusinessCycleSummary;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (typeof callback !== 'function') {
                callback = function () {
                };
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters: dbName required');
                err.status = 400;
                return callback(err);
            }

            BusinessCycleSummary = models.get(dbName, 'businessCycleSummary', businessCycleSummarySchema);

            // Aggregate across all cycles
            BusinessCycleSummary.find({}).exec(function (err, summaries) {
                if (err) {
                    return callback(err);
                }

                var snapshot = {
                    totalCyclesCompleted: summaries ? summaries.length : 0,
                    cumulativeRevenue: 0,
                    cumulativeCosts: 0,
                    cumulativeNetProfit: 0,
                    latestCycleAssets: 0,
                    latestCycleLiabilities: 0,
                    latestCycleData: null
                };

                if (summaries && summaries.length > 0) {
                    // Get latest cycle details
                    var latest = summaries[summaries.length - 1];
                    snapshot.latestCycleData = {
                        cycleNumber: latest.cycleNumber,
                        netProfit: latest.netProfit,
                        revenue: latest.revenue,
                        totalCosts: latest.totalCosts,
                        costs: latest.costs
                    };
                    snapshot.latestCycleAssets = latest.totalAssets;
                    snapshot.latestCycleLiabilities = latest.totalLiabilities;

                    // Calculate cumulative totals
                    summaries.forEach(function (summary) {
                        snapshot.cumulativeRevenue += summary.revenue;
                        snapshot.cumulativeCosts += summary.totalCosts;
                        snapshot.cumulativeNetProfit += summary.netProfit;
                    });
                }

                callback(null, snapshot);
            });
        };

        /**
         * Create automatic journal entries for cycle settlement (bypassing manual entry)
         * Internal use: creates balanced double-entry records for the cycle's financial changes
         * 
         * @param {Object} options - {dbName, cycleSummary, journalHandler}
         * @param {Function} callback - (err, result)
         */
        this.createCycleJournalEntries = function (options, callback) {
            // This is called internally after calculateCycleSummary
            // It uses the existing journalEntry handler to create balanced entries
            // without requiring manual voucher creation
            
            if (typeof callback !== 'function') {
                callback = function () {
                };
            }

            var dbName = options.dbName;
            var cycleSummary = options.cycleSummary;
            var journalHandler = options.journalHandler;

            if (!dbName || !cycleSummary || !journalHandler) {
                var err = new Error('Invalid parameters for journal entry creation');
                err.status = 400;
                return callback(err);
            }

            // System auto-creates balanced entries for:
            // 1. Revenue recognition: DR Cash / CR Revenue
            // 2. Material cost: DR COGS / CR Materials Inventory
            // 3. Personnel cost: DR Salary Expense / CR Salary Payable
            // 4. Depreciation: DR Depreciation Expense / CR Accumulated Depreciation
            // 5. Interest: DR Interest Expense / CR Interest Payable
            // 6. Penalties: DR Loss / CR Cash/Payable

            // For now, log that cycle has been recorded
            // Actual journal entries creation happens through existing handler
            callback(null, { 
                message: 'Cycle journal entries ready for creation',
                cycleNumber: cycleSummary.cycleNumber,
                summary: cycleSummary 
            });
        };
    };
};
