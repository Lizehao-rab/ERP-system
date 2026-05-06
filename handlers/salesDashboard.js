var mongoose = require('mongoose');
var async = require('async');

var SalesDashboard = function (event, models) {
    'use strict';

    var OrderPoolService = require('../services/orderPool')(models);
    var SalesSimulationService = require('../services/salesSimulation')(models);
    var EmployeeService = require('../services/employee')(models);
    var RESPONSES = require('../constants/responses');
    var CONSTANTS = require('../constants/mainConstants.js');

    var access = require('../helpers/access')(models, event);
    var logger = require('../helpers/logger');

    /**
     * GET /salesDashboard/orderPool
     * Get current available orders for user to accept
     */
    this.getOrderPool = function (req, res, next) {
        var dbName = req.session.lastDb;
        var query = req.query;
        var cycleNumber = parseInt(query.cycleNumber, 10) || null;

        var options = {
            dbName: dbName,
            status: 'available',
            cycleNumber: cycleNumber
        };

        OrderPoolService.getAvailableOrders(options, function (err, orders) {
            if (err) {
                logger.error('Error getting order pool:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ 
                data: orders || [],
                count: (orders || []).length 
            });
        });
    };

    /**
     * POST /salesDashboard/acceptOrder
     * User accepts an order from the pool
     */
    this.acceptOrder = function (req, res, next) {
        var dbName = req.session.lastDb;
        var body = req.body;
        var orderId = body.orderId;
        var user = req.session.user;

        if (!orderId) {
            var err = new Error('orderId is required');
            err.status = 400;
            return res.status(400).send(new RESPONSES.BadRequest(err));
        }

        var options = {
            dbName: dbName,
            orderId: orderId,
            acceptedBy: user ? user.login : 'system'
        };

        SalesSimulationService.acceptOrder(options, function (err, result) {
            if (err) {
                logger.error('Error accepting order:', err);
                return res.status(err.status || 400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ 
                data: result.order,
                message: result.message
            });
        });
    };

    /**
     * GET /salesDashboard/myOrders
     * Get user's accepted and in-progress orders
     */
    this.getMyOrders = function (req, res, next) {
        var dbName = req.session.lastDb;

        var options = {
            dbName: dbName
        };

        OrderPoolService.getAcceptedOrders(options, function (err, orders) {
            if (err) {
                logger.error('Error getting my orders:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ 
                data: orders || [],
                count: (orders || []).length 
            });
        });
    };

    /**
     * POST /salesDashboard/submitDelivery
     * User submits delivery for an accepted order
     */
    this.submitDelivery = function (req, res, next) {
        var dbName = req.session.lastDb;
        var body = req.body;
        var orderId = body.orderId;
        var quantity = parseInt(body.submittedQuantity, 10) || 0;

        if (!orderId) {
            var err = new Error('orderId is required');
            err.status = 400;
            return res.status(400).send(new RESPONSES.BadRequest(err));
        }

        var options = {
            dbName: dbName,
            orderId: orderId,
            submittedQuantity: quantity
        };

        SalesSimulationService.submitDelivery(options, function (err, result) {
            if (err) {
                logger.error('Error submitting delivery:', err);
                return res.status(err.status || 400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ 
                data: result.order,
                message: result.message
            });
        });
    };

    /**
     * POST /salesDashboard/verifyDelivery
     * System verifies and completes order (auto-verify in single-player mode)
     * Auto-applies payment or penalty based on delivery date
     */
    this.verifyDelivery = function (req, res, next) {
        var dbName = req.session.lastDb;
        var body = req.body;
        var orderId = body.orderId;

        if (!orderId) {
            var err = new Error('orderId is required');
            err.status = 400;
            return res.status(400).send(new RESPONSES.BadRequest(err));
        }

        var options = {
            dbName: dbName,
            orderId: orderId
        };

        SalesSimulationService.verifyAndCompleteOrder(options, function (err, result) {
            if (err) {
                logger.error('Error verifying delivery:', err);
                return res.status(err.status || 400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ 
                data: result,
                message: result.message
            });
        });
    };

    /**
     * POST /salesDashboard/rejectOrder
     * User rejects an order (return to available pool)
     */
    this.rejectOrder = function (req, res, next) {
        var dbName = req.session.lastDb;
        var body = req.body;
        var orderId = body.orderId;

        if (!orderId) {
            var err = new Error('orderId is required');
            err.status = 400;
            return res.status(400).send(new RESPONSES.BadRequest(err));
        }

        var options = {
            dbName: dbName,
            orderId: orderId
        };

        SalesSimulationService.rejectOrder(options, function (err, result) {
            if (err) {
                logger.error('Error rejecting order:', err);
                return res.status(err.status || 400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ 
                data: result.order,
                message: result.message
            });
        });
    };

    /**
     * GET /salesDashboard/orderSummary
     * Get sales cycle summary (available, accepted, completed, overdue order counts)
     */
    this.getOrderSummary = function (req, res, next) {
        var dbName = req.session.lastDb;
        var query = req.query;
        var cycleNumber = parseInt(query.cycleNumber, 10) || null;

        var options = {
            dbName: dbName,
            cycleNumber: cycleNumber
        };

        OrderPoolService.getCycleOrderSummary(options, function (err, summary) {
            if (err) {
                logger.error('Error getting order summary:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ data: summary || {} });
        });
    };

    /**
     * GET /salesDashboard/fulfillmentStats
     * Get fulfillment statistics for current cycle
     */
    this.getFulfillmentStats = function (req, res, next) {
        var dbName = req.session.lastDb;
        var query = req.query;
        var cycleNumber = parseInt(query.cycleNumber, 10) || null;

        var options = {
            dbName: dbName,
            cycleNumber: cycleNumber
        };

        SalesSimulationService.getOrderFulfillmentStats(options, function (err, stats) {
            if (err) {
                logger.error('Error getting fulfillment stats:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            res.status(200).send({ data: stats || {} });
        });
    };

    /**
     * GET /salesDashboard/marketSnapshot
     * Get comprehensive sales market snapshot including order pool status
     */
    this.getMarketSnapshot = function (req, res, next) {
        var dbName = req.session.lastDb;
        var query = req.query;
        var cycleNumber = parseInt(query.cycleNumber, 10) || null;

        var tasks = {
            orderPool: function (callback) {
                var options = {
                    dbName: dbName,
                    status: 'available',
                    cycleNumber: cycleNumber
                };
                OrderPoolService.getAvailableOrders(options, callback);
            },
            myOrders: function (callback) {
                var options = { dbName: dbName };
                OrderPoolService.getAcceptedOrders(options, callback);
            },
            orderSummary: function (callback) {
                var options = {
                    dbName: dbName,
                    cycleNumber: cycleNumber
                };
                OrderPoolService.getCycleOrderSummary(options, callback);
            },
            fulfillmentStats: function (callback) {
                var options = {
                    dbName: dbName,
                    cycleNumber: cycleNumber
                };
                SalesSimulationService.getOrderFulfillmentStats(options, callback);
            }
        };

        async.parallel(tasks, function (err, results) {
            if (err) {
                logger.error('Error getting market snapshot:', err);
                return res.status(400).send(new RESPONSES.BadRequest(err));
            }

            var snapshot = {
                availableOrdersCount: (results.orderPool || []).length,
                availableOrders: results.orderPool || [],
                myOrdersCount: (results.myOrders || []).length,
                myOrders: results.myOrders || [],
                orderSummary: results.orderSummary || {},
                fulfillmentStats: results.fulfillmentStats || {},
                timestamp: new Date(),
                systemStatus: {
                    orderPoolEnabled: true,
                    autoSettlementEnabled: true,
                    message: '虚拟市场订单池已启用（Virtual market order pool enabled）'
                }
            };

            res.status(200).send({ data: snapshot });
        });
    };

    return this;
};

module.exports = SalesDashboard;
