/**
 * 回合制引擎处理器 - 将业务逻辑转化为HTTP请求处理
 * 7个主要API端点
 */

var async = require('async');

var QuarterEngineHandler = function (event, models) {
    'use strict';

    var QuarterEngine = require('../services/quarterEngine');
    var LoanService = require('../services/loanService');
    var EventSimulation = require('../services/eventSimulation');
    var PerformanceEvaluation = require('../services/performanceEvaluation');

    var RESPONSES = require('../constants/responses');
    var access = require('../helpers/access')(models, event);
    var logger = require('../helpers/logger');

    return {
        /**
         * 初始化新回合
         * POST /quarterEngine/initQuarter
         */
        initQuarter: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var quarterNumber = options.quarterNumber || 1;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.initializeNewQuarter(quarterNumber, dbName, function (result) {
                if (result.success) {
                    return res.status(201).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 获取当前回合仪表板
         * GET /quarterEngine/dashboard?dbName=xxx&quarterNumber=1
         */
        getDashboard: function (req, res) {
            var options = req.query;
            var dbName = options.dbName;
            var quarterNumber = parseInt(options.quarterNumber) || 1;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.getCurrentQuarterDashboard(dbName, quarterNumber, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 记录用户决策
         * POST /quarterEngine/recordDecision
         * Body: { dbName, quarterNumber, decisions: { purchasing, production, sales, hr, loans } }
         */
        recordDecision: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var quarterNumber = options.quarterNumber;
            var decisions = options.decisions;

            if (!dbName || !quarterNumber || !decisions) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少必要参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.recordDecision(quarterNumber, dbName, decisions, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 提交决策并进入结算阶段
         * POST /quarterEngine/submitDecision
         * Body: { dbName, quarterNumber }
         */
        submitDecision: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var quarterNumber = options.quarterNumber;

            if (!dbName || !quarterNumber) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少必要参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.submitDecision(quarterNumber, dbName, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 自动结算回合
         * POST /quarterEngine/settleQuarter
         * Body: { dbName, quarterNumber }
         */
        settleQuarter: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var quarterNumber = options.quarterNumber;

            if (!dbName || !quarterNumber) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少必要参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.settleQuarter(quarterNumber, dbName, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 进入下一回合
         * POST /quarterEngine/nextQuarter
         * Body: { dbName, currentQuarterNumber }
         */
        nextQuarter: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var currentQuarterNumber = options.currentQuarterNumber;

            if (!dbName || !currentQuarterNumber) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少必要参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.advanceToNextQuarter(currentQuarterNumber, dbName, function (result) {
                if (result.success) {
                    return res.status(201).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 重置当前回合（用于单机环境自由重来）
         * POST /quarterEngine/resetQuarter
         * Body: { dbName, quarterNumber }
         */
        resetQuarter: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var quarterNumber = options.quarterNumber;

            if (!dbName || !quarterNumber) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少必要参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.resetQuarter(quarterNumber, dbName, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 获取回合历史
         * GET /quarterEngine/history?dbName=xxx&limit=10
         */
        getHistory: function (req, res) {
            var options = req.query;
            var dbName = options.dbName;
            var limit = parseInt(options.limit) || 10;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var quarterEngine = QuarterEngine({ event: event, models: models });
            quarterEngine.getQuarterHistory(dbName, limit, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 申请贷款
         * POST /quarterEngine/applyLoan
         * Body: { dbName, quarterNumber, loanType: 'shortTerm'|'longTerm', principalAmount }
         */
        applyLoan: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;
            var quarterNumber = options.quarterNumber;
            var loanType = options.loanType;
            var principalAmount = options.principalAmount;

            if (!dbName || !quarterNumber || !loanType || !principalAmount) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少贷款参数'));
            }

            var loanService = LoanService({ event: event, models: models });
            loanService.applyForLoan(dbName, quarterNumber, {
                loanType: loanType,
                principalAmount: principalAmount
            }, function (result) {
                if (result.success) {
                    return res.status(201).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 获取活跃贷款摘要
         * GET /quarterEngine/loansSummary?dbName=xxx
         */
        getLoansSummary: function (req, res) {
            var options = req.query;
            var dbName = options.dbName;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var loanService = LoanService({ event: event, models: models });
            loanService.getActiveLoansSummary(dbName, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 获取历史评分
         * GET /quarterEngine/scoreHistory?dbName=xxx&limit=10
         */
        getScoreHistory: function (req, res) {
            var options = req.query;
            var dbName = options.dbName;
            var limit = parseInt(options.limit) || 10;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var perfEval = PerformanceEvaluation({ event: event, models: models });
            perfEval.getScoreHistory(dbName, limit, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 获取本回合事件列表
         * GET /quarterEngine/events?dbName=xxx&quarterNumber=1
         */
        getEvents: function (req, res) {
            var options = req.query;
            var dbName = options.dbName;
            var quarterNumber = parseInt(options.quarterNumber) || 1;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var eventSim = EventSimulation({ event: event, models: models });
            eventSim.getQuarterlyEvents(quarterNumber, dbName, function (result) {
                if (result.success) {
                    return res.status(200).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        },

        /**
         * 初始化事件池（系统启动时一次性执行）
         * POST /quarterEngine/initEventPool
         * Body: { dbName }
         */
        initEventPool: function (req, res) {
            var options = req.body;
            var dbName = options.dbName;

            if (!dbName) {
                return res.status(400).send(new RESPONSES.BadRequest('缺少dbName参数'));
            }

            var eventSim = EventSimulation({ event: event, models: models });
            eventSim.initializeEventPool(dbName, function (result) {
                if (result.success) {
                    return res.status(201).send(result);
                } else {
                    return res.status(400).send(result);
                }
            });
        }
    };
};

module.exports = QuarterEngineHandler;
