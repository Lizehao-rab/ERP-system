/**
 * 事件模拟服务 - 每回合随机触发经营事件
 * 原料涨价、产品溢价、政府补贴、设备维修等，仅影响单人数据
 */

var async = require('async');

var EventSimulation = function (options) {
    'use strict';
    this.event = options.event;
    this.models = options.models;
};

/**
 * 触发本回合的随机事件
 * 每个回合都会从事件池中随机抽取若干事件
 */
EventSimulation.prototype.triggerQuarterlyEvents = function (quarterNumber, dbName, financialSnapshot, callback) {
    var self = this;
    var OperatingEvent = this.models.get(dbName, 'operatingEvent');

    // 查询所有可能的事件（已激活的、不在冷却期的）
    OperatingEvent.find({
        dbName: dbName,
        isActive: true,
        $or: [
            { lastTriggeredQuarter: null },
            { lastTriggeredQuarter: { $lte: quarterNumber - 2 } }  // 冷却期2个回合
        ]
    }, function (err, availableEvents) {
        if (err) {
            return callback({
                success: false,
                message: '查询事件池失败: ' + err.message
            });
        }

        if (availableEvents.length === 0) {
            return callback(null, {
                totalImpact: 0,
                appliedEvents: []
            });
        }

        var appliedEvents = [];
        var totalImpact = 0;
        var updateTasks = [];

        // 随机抽取事件（每回合1-3个事件）
        var eventCount = Math.floor(Math.random() * 3) + 1;
        var selectedEvents = [];
        
        for (var i = 0; i < Math.min(eventCount, availableEvents.length); i++) {
            var randomIndex = Math.floor(Math.random() * availableEvents.length);
            var event = availableEvents.splice(randomIndex, 1)[0];
            
            // 检查触发概率
            if (Math.random() * 100 < event.triggerProbability) {
                selectedEvents.push(event);
            }
        }

        selectedEvents.forEach(function (event) {
            // 计算实际影响金额
            var actualAmount = event.financialImpact.baseAmount;
            if (event.financialImpact.variance) {
                var variance = (Math.random() - 0.5) * 2 * event.financialImpact.variance;
                actualAmount += variance;
            }

            if (event.financialImpact.impactType === 'cost') {
                actualAmount = -Math.abs(actualAmount);  // 成本为负数
            } else if (event.financialImpact.impactType === 'revenue') {
                actualAmount = Math.abs(actualAmount);   // 收入为正数
            }

            totalImpact += actualAmount;

            appliedEvents.push({
                eventId: event._id.toString(),
                eventType: event.eventType,
                eventName: event.eventName,
                impact: actualAmount,
                appliedAt: new Date()
            });

            // 更新事件的最后触发时间
            var updateTask = function (callback) {
                event.triggered = true;
                event.triggeredAt = new Date();
                event.lastTriggeredQuarter = quarterNumber;
                
                if (!event.applicationLog) {
                    event.applicationLog = [];
                }
                event.applicationLog.push({
                    appQarter: quarterNumber,
                    appliedAt: new Date(),
                    outcome: 'triggered',
                    resultAmount: actualAmount
                });

                event.save(callback);
            };
            updateTasks.push(updateTask);
        });

        // 并行保存所有事件更新
        async.parallel(updateTasks, function (err) {
            if (err) {
                return callback({
                    success: false,
                    message: '更新事件失败: ' + err.message
                });
            }

            callback(null, {
                totalImpact: totalImpact,
                appliedEvents: appliedEvents,
                eventCount: appliedEvents.length
            });
        });
    });
};

/**
 * 初始化事件池 - 系统启动时预置各类随机事件
 * 用于第一次启动时导入默认事件
 */
EventSimulation.prototype.initializeEventPool = function (dbName, callback) {
    var self = this;
    var OperatingEvent = this.models.get(dbName, 'operatingEvent');

    var defaultEvents = [
        // 原料相关
        {
            eventType: 'materialPriceIncrease',
            eventName: '原材料涨价',
            description: '国际大宗商品价格上升，采购成本增加',
            triggerProbability: 40,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 50000,
                variance: 20000,
                affectedCategory: 'materialCost'
            },
            priority: 60
        },
        {
            eventType: 'materialPriceDecrease',
            eventName: '原材料降价',
            description: '原料过剩导致价格下跌，采购成本下降',
            triggerProbability: 25,
            financialImpact: {
                impactType: 'revenue',
                baseAmount: 30000,
                variance: 15000,
                affectedCategory: 'materialCost'
            },
            priority: 50
        },

        // 产品相关
        {
            eventType: 'productPremium',
            eventName: '产品畅销',
            description: '市场需求旺盛，产品溢价销售',
            triggerProbability: 35,
            financialImpact: {
                impactType: 'revenue',
                baseAmount: 80000,
                variance: 25000,
                affectedCategory: 'productPrice'
            },
            priority: 70
        },
        {
            eventType: 'productDiscount',
            eventName: '产品滞销',
            description: '竞争加剧，产品被迫降价促销',
            triggerProbability: 30,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 40000,
                variance: 20000,
                affectedCategory: 'productPrice'
            },
            priority: 60
        },

        // 政府相关
        {
            eventType: 'governmentSubsidy',
            eventName: '政府补贴',
            description: '国家补贴新兴产业，获得扶持资金',
            triggerProbability: 15,
            financialImpact: {
                impactType: 'revenue',
                baseAmount: 100000,
                variance: 30000,
                affectedCategory: 'other'
            },
            priority: 80
        },
        {
            eventType: 'regulatoryFine',
            eventName: '监管罚款',
            description: '环保不达标或安全隐患被处罚',
            triggerProbability: 20,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 50000,
                variance: 25000,
                affectedCategory: 'other'
            },
            priority: 55
        },

        // 设备相关
        {
            eventType: 'equipmentRepair',
            eventName: '设备维修',
            description: '关键设备出现故障需要维修',
            triggerProbability: 25,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 60000,
                variance: 30000,
                affectedCategory: 'equipmentCost'
            },
            priority: 65,
            operationalImpact: {
                affectsProduction: true,
                productionDelay: 5
            }
        },

        // 市场相关
        {
            eventType: 'marketDemandIncrease',
            eventName: '市场需求增长',
            description: '产业景气度上升，销售机会增加',
            triggerProbability: 30,
            financialImpact: {
                impactType: 'revenue',
                baseAmount: 120000,
                variance: 40000,
                affectedCategory: 'other'
            },
            priority: 75
        },
        {
            eventType: 'marketDemandDecrease',
            eventName: '市场需求萎缩',
            description: '经济下行，订单减少',
            triggerProbability: 20,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 80000,
                variance: 30000,
                affectedCategory: 'other'
            },
            priority: 60
        },

        // 人员相关
        {
            eventType: 'employeeTurnover',
            eventName: '员工离职',
            description: '关键员工跳槽，需要招聘替代',
            triggerProbability: 25,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 40000,
                variance: 20000,
                affectedCategory: 'personnelCost'
            },
            priority: 55
        },

        // 质量相关
        {
            eventType: 'qualityIncident',
            eventName: '质量事故',
            description: '产品质量问题导致经济损失',
            triggerProbability: 15,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 70000,
                variance: 35000,
                affectedCategory: 'other'
            },
            priority: 65
        },
        {
            eventType: 'customerComplaint',
            eventName: '客户投诉退货',
            description: '客户对产品或服务不满意，退货申请',
            triggerProbability: 20,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 50000,
                variance: 25000,
                affectedCategory: 'other'
            },
            priority: 50
        },

        // 供应链相关
        {
            eventType: 'supplyChainDisruption',
            eventName: '供应链中断',
            description: '原料供应商出现问题，材料短缺',
            triggerProbability: 15,
            financialImpact: {
                impactType: 'cost',
                baseAmount: 80000,
                variance: 40000,
                affectedCategory: 'materialCost'
            },
            priority: 70,
            operationalImpact: {
                affectsMaterials: true,
                materialShortageDays: 3
            }
        },

        // 税收相关
        {
            eventType: 'taxIncentive',
            eventName: '税收优惠',
            description: '产业优惠政策，获得税收优惠',
            triggerProbability: 10,
            financialImpact: {
                impactType: 'revenue',
                baseAmount: 60000,
                variance: 20000,
                affectedCategory: 'other'
            },
            priority: 70
        },

        // 汇率相关
        {
            eventType: 'currencyFluctuation',
            eventName: '汇率波动',
            description: '国际汇率变化影响进出口成本',
            triggerProbability: 20,
            financialImpact: {
                impactType: 'both',
                baseAmount: 40000,
                variance: 20000,
                affectedCategory: 'other'
            },
            priority: 50
        }
    ];

    // 批量插入默认事件
    OperatingEvent.insertMany(defaultEvents.map(function (evt) {
        evt.dbName = dbName;
        evt.isActive = true;
        evt.frequency = 'recurring';
        evt.createdBy = 'system';
        return evt;
    }), function (err, docs) {
        if (err) {
            return callback({
                success: false,
                message: '初始化事件池失败: ' + err.message
            });
        }

        callback({
            success: true,
            eventCount: docs.length,
            message: '事件池已初始化'
        });
    });
};

/**
 * 获取本回合已发生的事件列表
 */
EventSimulation.prototype.getQuarterlyEvents = function (quarterNumber, dbName, callback) {
    var self = this;
    var OperatingEvent = this.models.get(dbName, 'operatingEvent');

    OperatingEvent.find({
        dbName: dbName,
        lastTriggeredQuarter: quarterNumber,
        triggered: true
    }, function (err, events) {
        if (err) {
            return callback({
                success: false,
                message: '查询事件失败: ' + err.message
            });
        }

        var eventSummary = events.map(function (evt) {
            return {
                eventType: evt.eventType,
                eventName: evt.eventName,
                impact: evt.applicationLog && evt.applicationLog.length > 0 ? 
                    evt.applicationLog[evt.applicationLog.length - 1].resultAmount : 0
            };
        });

        callback({
            success: true,
            events: eventSummary,
            message: '事件列表已获取'
        });
    });
};

module.exports = function (options) {
    return new EventSimulation(options);
};
