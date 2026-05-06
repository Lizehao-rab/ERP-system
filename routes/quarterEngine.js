/**
 * 回合制引擎路由 - RESTful API端点
 * 完整的回合制经营系统API
 */

module.exports = function (event, models) {
    'use strict';

    var express = require('express');
    var router = express.Router();
    var QuarterEngineHandler = require('../handlers/quarterEngine');
    var authStackMiddleware = require('../helpers/checkAuth');

    var quarterEngineHandler = new QuarterEngineHandler(event, models);

    /**
     * ============ 回合管理 API ============
     */

    /**
     * @api {post} /quarterEngine/initQuarter 初始化新回合
     * @apiName InitQuarter
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 创建一个新的经营回合，记录开局财务快照
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} [quarterNumber=1] 回合序号（可选，默认1）
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 创建的回合对象
     * @apiSuccessExample {json} Success-Response:
     *     HTTP/1.1 201 Created
     *     {
     *       "success": true,
     *       "quarter": {
     *         "_id": "...",
     *         "quarterNumber": 1,
     *         "quarterCode": "Q-2026-1",
     *         "status": "planning",
     *         "startDate": "2026-05-05T...",
     *         "endDate": "2026-08-05T..."
     *       },
     *       "message": "第1回合已初始化"
     *     }
     */
    router.post('/initQuarter', authStackMiddleware, function (req, res) {
        quarterEngineHandler.initQuarter(req, res);
    });

    /**
     * @api {get} /quarterEngine/dashboard 获取回合仪表板
     * @apiName GetDashboard
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 获取当前回合的完整信息，包括财务快照、决策、结算、评分、事件
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} [quarterNumber=1] 回合序号
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 回合基本信息
     * @apiSuccess {Object} financialSnapshot 开局财务快照
     * @apiSuccess {Object} decisions 用户决策记录
     * @apiSuccess {Object} settlement 结算数据
     * @apiSuccess {Object} performanceScore 绩效评分
     * @apiSuccess {Array} appliedEvents 应用的随机事件列表
     */
    router.get('/dashboard', authStackMiddleware, function (req, res) {
        quarterEngineHandler.getDashboard(req, res);
    });

    /**
     * @api {post} /quarterEngine/recordDecision 记录用户决策
     * @apiName RecordDecision
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 记录本回合的采购、生产、招人、贷款、接单决策
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} quarterNumber 回合序号
     * @apiParam {Object} decisions 决策数据对象
     * @apiParam {Object} [decisions.purchasing] 采购决策
     * @apiParam {Object} [decisions.production] 生产决策
     * @apiParam {Object} [decisions.sales] 销售决策
     * @apiParam {Object} [decisions.hr] 人力资源决策
     * @apiParam {Array} [decisions.loans] 贷款申请列表
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 更新后的回合对象
     */
    router.post('/recordDecision', authStackMiddleware, function (req, res) {
        quarterEngineHandler.recordDecision(req, res);
    });

    /**
     * @api {post} /quarterEngine/submitDecision 提交决策
     * @apiName SubmitDecision
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 提交本回合决策，锁定所有决策数据，进入系统结算阶段
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} quarterNumber 回合序号
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 已提交的回合对象（status: 'submitted'）
     */
    router.post('/submitDecision', authStackMiddleware, function (req, res) {
        quarterEngineHandler.submitDecision(req, res);
    });

    /**
     * @api {post} /quarterEngine/settleQuarter 自动结算回合
     * @apiName SettleQuarter
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 执行完整的回合结算流程：处理贷款利息、触发随机事件、计算固定成本、聚合经营数据、计算绩效评分
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} quarterNumber 回合序号
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 结算完成的回合对象（status: 'completed'）
     * @apiSuccess {Object} summary 结算摘要
     * @apiSuccess {Number} summary.revenue 总收入
     * @apiSuccess {Number} summary.totalCost 总成本
     * @apiSuccess {Number} summary.netProfit 净利润
     * @apiSuccess {Number} summary.overallScore 综合评分
     */
    router.post('/settleQuarter', authStackMiddleware, function (req, res) {
        quarterEngineHandler.settleQuarter(req, res);
    });

    /**
     * @api {post} /quarterEngine/nextQuarter 进入下一回合
     * @apiName NextQuarter
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 自动初始化下一个经营回合
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} currentQuarterNumber 当前回合序号
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 新创建的回合对象
     */
    router.post('/nextQuarter', authStackMiddleware, function (req, res) {
        quarterEngineHandler.nextQuarter(req, res);
    });

    /**
     * @api {post} /quarterEngine/resetQuarter 重置回合
     * @apiName ResetQuarter
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 重置当前回合到规划阶段，清空所有决策和结算数据，用于单机环境自由重来
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} quarterNumber 回合序号
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} quarter 已重置的回合对象（status: 'planning'）
     */
    router.post('/resetQuarter', authStackMiddleware, function (req, res) {
        quarterEngineHandler.resetQuarter(req, res);
    });

    /**
     * @api {get} /quarterEngine/history 获取回合历史
     * @apiName GetHistory
     * @apiGroup QuarterEngine
     * @apiVersion 1.0.0
     * @apiDescription 获取已完成的历史回合列表，支持分页
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} [limit=10] 返回记录数量
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Array} quarters 历史回合列表（按序号倒序）
     */
    router.get('/history', authStackMiddleware, function (req, res) {
        quarterEngineHandler.getHistory(req, res);
    });

    /**
     * ============ 贷款管理 API ============
     */

    /**
     * @api {post} /quarterEngine/applyLoan 申请贷款
     * @apiName ApplyLoan
     * @apiGroup Loans
     * @apiVersion 1.0.0
     * @apiDescription 申请短期或长期贷款，受额度限制（短期最多¥500000, 长期最多¥1000000）
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} quarterNumber 回合序号
     * @apiParam {String} loanType 贷款类型：'shortTerm'(3个月，5%利率) 或 'longTerm'(12个月，8%利率)
     * @apiParam {Number} principalAmount 贷款金额
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} loan 创建的贷款对象
     * @apiSuccess {Object} details 贷款详情
     * @apiSuccess {String} details.loanCode 贷款代码
     * @apiSuccess {Number} details.amount 贷款金额
     * @apiSuccess {String} details.rate 年利率
     * @apiSuccess {Date} details.maturityDate 到期日期
     * @apiSuccess {Number} details.monthlyInterest 每月利息
     */
    router.post('/applyLoan', authStackMiddleware, function (req, res) {
        quarterEngineHandler.applyLoan(req, res);
    });

    /**
     * @api {get} /quarterEngine/loansSummary 获取贷款摘要
     * @apiName GetLoansSummary
     * @apiGroup Loans
     * @apiVersion 1.0.0
     * @apiDescription 获取当前所有活跃贷款的汇总信息
     * @apiParam {String} dbName 数据库名称
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Object} summary 贷款汇总
     * @apiSuccess {Number} summary.activeLoanCount 活跃贷款数量
     * @apiSuccess {Number} summary.totalDebt 总负债额
     * @apiSuccess {Number} summary.totalInterestAccrued 累计利息
     * @apiSuccess {Array} summary.upcomingPayments 即将到期的贷款列表
     */
    router.get('/loansSummary', authStackMiddleware, function (req, res) {
        quarterEngineHandler.getLoansSummary(req, res);
    });

    /**
     * ============ 绩效评分 API ============
     */

    /**
     * @api {get} /quarterEngine/scoreHistory 获取历史评分
     * @apiName GetScoreHistory
     * @apiGroup Performance
     * @apiVersion 1.0.0
     * @apiDescription 获取过往回合的绩效评分记录，支持分页
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} [limit=10] 返回记录数量
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Array} scores 评分记录列表（按回合序号正序）
     * @apiSuccess {Number} scores[].overallScore 综合评分（0-100）
     * @apiSuccess {Number} scores[].financialHealth.score 财务健康评分（权重35%）
     * @apiSuccess {Number} scores[].operationalEfficiency.score 运营效率评分（权重35%）
     * @apiSuccess {Number} scores[].costControl.score 成本控制评分（权重30%）
     * @apiSuccess {Array} scores[].deductionDetails 扣分明细
     * @apiSuccess {Object} scores[].cumulativeStatistics 累计统计
     */
    router.get('/scoreHistory', authStackMiddleware, function (req, res) {
        quarterEngineHandler.getScoreHistory(req, res);
    });

    /**
     * ============ 随机事件 API ============
     */

    /**
     * @api {get} /quarterEngine/events 获取回合事件
     * @apiName GetEvents
     * @apiGroup Events
     * @apiVersion 1.0.0
     * @apiDescription 获取指定回合触发的所有随机经营事件
     * @apiParam {String} dbName 数据库名称
     * @apiParam {Number} [quarterNumber=1] 回合序号
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Array} events 事件列表
     * @apiSuccess {String} events[].eventType 事件类型
     * @apiSuccess {String} events[].eventName 事件名称
     * @apiSuccess {Number} events[].impact 财务影响（正数为收益，负数为成本）
     */
    router.get('/events', authStackMiddleware, function (req, res) {
        quarterEngineHandler.getEvents(req, res);
    });

    /**
     * @api {post} /quarterEngine/initEventPool 初始化事件池
     * @apiName InitEventPool
     * @apiGroup Events
     * @apiVersion 1.0.0
     * @apiDescription 初始化15+类型的随机事件池（系统启动时一次性执行）
     * @apiParam {String} dbName 数据库名称
     * @apiSuccess {Boolean} success 成功标志
     * @apiSuccess {Number} eventCount 初始化的事件数量
     */
    router.post('/initEventPool', authStackMiddleware, function (req, res) {
        quarterEngineHandler.initEventPool(req, res);
    });

    return router;
};
