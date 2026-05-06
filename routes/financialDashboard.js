var express = require('express');
var router = express.Router();
var FinancialDashboardHandler = require('../handlers/financialDashboard');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (event, models) {
    'use strict';

    var handler = new FinancialDashboardHandler(event, models);

    router.use(authStackMiddleware);

    /**
     * @api {get} /financialDashboard/latest Get Latest Cycle Summary
     * @apiName getLatestCycleSummary
     * @apiGroup FinancialDashboard
     * @apiDescription Returns the most recent business cycle financial summary for dashboard display
     * 
     * @apiSuccess {Object} data Latest cycle summary with revenue, costs, net profit, assets, liabilities
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "_id": "...",
     *     "cycleNumber": 5,
     *     "periodStart": "2024-01-01T00:00:00Z",
     *     "periodEnd": "2024-01-31T23:59:59Z",
     *     "revenue": 100000,
     *     "costs": {
     *       "materials": 30000,
     *       "personnel": 20000,
     *       "depreciation": 5000,
     *       "interest": 2000,
     *       "penalties": 500
     *     },
     *     "totalCosts": 57500,
     *     "netProfit": 42500,
     *     "totalAssets": 500000,
     *     "totalLiabilities": 200000,
     *     "cashFlow": 35000
     *   }
     * }
     */
    router.get('/latest', handler.getLatestSummary);

    /**
     * @api {get} /financialDashboard/history Get Historical Cycles
     * @apiName getCycleSummaries
     * @apiGroup FinancialDashboard
     * @apiDescription Returns paginated historical cycle summaries
     * 
     * @apiParam {Number} [limit=50] Number of records to return
     * @apiParam {Number} [skip=0] Number of records to skip
     * 
     * @apiSuccess {Array} data Array of cycle summaries
     */
    router.get('/history', handler.getHistory);

    /**
     * @api {get} /financialDashboard/snapshot Get Financial Snapshot
     * @apiName getFinancialSnapshot
     * @apiGroup FinancialDashboard
     * @apiDescription Returns cumulative financial snapshot: total revenue across all cycles, total costs, cumulative net profit
     * 
     * @apiSuccess {Object} data Aggregated financial data with latest cycle status
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "totalCyclesCompleted": 5,
     *     "cumulativeRevenue": 500000,
     *     "cumulativeCosts": 300000,
     *     "cumulativeNetProfit": 200000,
     *     "latestCycleAssets": 500000,
     *     "latestCycleLiabilities": 200000,
     *     "latestCycleData": {
     *       "cycleNumber": 5,
     *       "netProfit": 42500,
     *       "revenue": 100000,
     *       "totalCosts": 57500
     *     }
     *   }
     * }
     */
    router.get('/snapshot', handler.getSnapshot);

    /**
     * @api {post} /financialDashboard/calculateCycle Auto-Calculate Cycle Settlement
     * @apiName calculateCycle
     * @apiGroup FinancialDashboard
     * @apiDescription System auto-generates financial settlement for completed business cycle
     * No manual journal entries needed - system automatically records all entries
     * 
     * @apiParam {Number} [periodStart] Cycle start date
     * @apiParam {Number} [periodEnd] Cycle end date
     * @apiParam {Number} revenue Total revenue for cycle (from sales, contracts)
     * @apiParam {Number} [materialCosts=0] Material purchase costs (COGS)
     * @apiParam {Number} [personnelCosts=0] Personnel salary costs (auto-deducted from active employees)
     * @apiParam {Number} [depreciationCosts=0] Equipment/facility depreciation (fixed cost)
     * @apiParam {Number} [interestCosts=0] Loan interest expense
     * @apiParam {Number} [penaltyCosts=0] Contract penalty losses
     * @apiParam {Number} [randomEventCosts=0] Random event losses/expenses
     * @apiParam {Number} [otherCosts=0] Other miscellaneous costs
     * @apiParam {Number} [totalAssets=0] Balance sheet total assets
     * @apiParam {Number} [totalLiabilities=0] Balance sheet total liabilities
     * @apiParam {Number} [cashFlow=0] Net cash flow for cycle
     * 
     * @apiSuccess {Object} data Saved cycle summary
     * @apiSuccess {String} message Confirmation message
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {...cycle summary...},
     *   "message": "Cycle 5 auto-settlement completed"
     * }
     */
    router.post('/calculateCycle', handler.calculateCycle);

    /**
     * @api {get} /financialDashboard/dashboardData Get Combined Dashboard Data
     * @apiName getDashboardData
     * @apiGroup FinancialDashboard
     * @apiDescription Returns comprehensive dashboard data in single request:
     * - Latest cycle summary
     * - Cumulative financial snapshot
     * - Current HR costs (for next cycle planning)
     * - Active employee count
     * - System status
     * 
     * @apiSuccess {Object} data Dashboard data object
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "latestCycle": {...},
     *     "cumulativeSnapshot": {...},
     *     "employeeCosts": 20000,
     *     "activeEmployees": 5,
     *     "systemStatus": {
     *       "lastUpdated": "2024-01-31T23:59:59Z",
     *       "autoSettlementEnabled": true,
     *       "message": "已启用自动财务结算模式"
     *     }
     *   }
     * }
     */
    router.get('/dashboardData', handler.getDashboardData);

    /**
     * @api {post} /financialDashboard/completeCycle Complete Cycle with Full Cost Integration
     * @apiName completeCycle
     * @apiGroup FinancialDashboard
     * @apiDescription 完整周期结束处理：整合采购、库存、销售、财务
     * 自动收集所有成本（采购、库存持有、员工工资、折旧等）并完成财务结算
     * 
     * @apiParam {Number} cycleNumber - 周期号
     * @apiParam {Number} currentCash - 当前现金
     * @apiParam {Number} salesRevenue - 销售收入（来自销售订单池）
     * @apiParam {Number} [depreciationCosts=0] - 折旧成本
     * @apiParam {Number} [interestCosts=0] - 利息成本
     * @apiParam {Number} [penaltyCosts=0] - 罚款成本
     * @apiParam {Number} [randomEventCosts=0] - 随机事件成本
     * @apiParam {Date} [periodStart] - 周期开始日期
     * @apiParam {Date} [periodEnd] - 周期结束日期
     * @apiParam {Number} [totalAssets=0] - 总资产
     * @apiParam {Number} [totalLiabilities=0] - 总负债
     * 
     * @apiSuccess {Object} data 完整的周期结束报告
     * @apiSuccess {Object} data.cycle 财务结算数据
     * @apiSuccess {Object} data.costBreakdown 成本明细（采购、库存、员工等）
     * @apiSuccess {Object} data.summary 周期摘要（收入、净利、现金等）
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "cycle": {...businessCycleSummary...},
     *     "costBreakdown": {
     *       "purchaseCost": 30000,
     *       "storageCost": 1500,
     *       "employeeCost": 20000,
     *       "totalCosts": 51500
     *     },
     *     "summary": {
     *       "cycleNumber": 1,
     *       "salesRevenue": 100000,
     *       "netProfit": 48500,
     *       "remainingCash": 68500,
     *       "activeEmployees": 5,
     *       "message": "周期1结算完成"
     *     }
     *   }
     * }
     */
    router.post('/completeCycle', handler.completeCycle);

    return router;
};
