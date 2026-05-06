'use strict';

var mongoose = require('mongoose');
var virtualMarketOrderSchema = mongoose.Schemas.virtualMarketOrder;
var moment = require('../public/js/libs/moment/moment');
var _ = require('underscore');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

module.exports = function (models) {
    return new function () {
        /**
         * Accept an order - User commits to fulfill it
         * Changes order status from 'available' to 'accepted'
         * 
         * @param {Object} options - {dbName, orderId, acceptedBy}
         * @param {Function} callback - (err, updatedOrder)
         */
        this.acceptOrder = function (options, callback) {
            var VirtualMarketOrder;
            var dbName;
            var orderId;
            var acceptedBy;
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
            orderId = options.orderId;
            acceptedBy = options.acceptedBy || 'system';

            if (!dbName || !orderId) {
                err = new Error('Invalid input parameters: dbName and orderId required');
                err.status = 400;
                return callback(err);
            }

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            var updateData = {
                status: 'accepted',
                acceptance: {
                    acceptedAt: new Date(),
                    acceptedBy: acceptedBy
                },
                updatedAt: new Date()
            };

            VirtualMarketOrder.findByIdAndUpdate(orderId, updateData, { new: true }, function (err, order) {
                if (err) {
                    return callback(err);
                }

                if (!order) {
                    err = new Error('Order not found');
                    err.status = 404;
                    return callback(err);
                }

                callback(null, {
                    message: 'Order accepted successfully',
                    order: order
                });
            });
        };

        /**
         * Submit order delivery - User claims order is ready
         * Changes status to 'delivered' and waits for verification
         * 
         * @param {Object} options - {dbName, orderId, submittedQuantity}
         * @param {Function} callback - (err, result)
         */
        this.submitDelivery = function (options, callback) {
            var VirtualMarketOrder;
            var dbName;
            var orderId;
            var submittedQuantity;
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
            orderId = options.orderId;
            submittedQuantity = options.submittedQuantity || 0;

            if (!dbName || !orderId) {
                err = new Error('Invalid input parameters: dbName and orderId required');
                err.status = 400;
                return callback(err);
            }

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            var updateData = {
                status: 'delivered',
                delivery: {
                    submittedAt: new Date(),
                    submittedQuantity: submittedQuantity,
                    status: 'pending'
                },
                updatedAt: new Date()
            };

            VirtualMarketOrder.findByIdAndUpdate(orderId, updateData, { new: true }, function (err, order) {
                if (err) {
                    return callback(err);
                }

                if (!order) {
                    err = new Error('Order not found');
                    err.status = 404;
                    return callback(err);
                }

                callback(null, {
                    message: 'Delivery submitted for verification',
                    order: order
                });
            });
        };

        /**
         * Verify and complete order - Auto verification (in single-player mode, assume user fulfilled correctly)
         * Auto-payment if on-time, penalty if late
         * 
         * @param {Object} options - {dbName, orderId}
         * @param {Function} callback - (err, result)
         */
        this.verifyAndCompleteOrder = function (options, callback) {
            var VirtualMarketOrder;
            var dbName;
            var orderId;
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
            orderId = options.orderId;

            if (!dbName || !orderId) {
                err = new Error('Invalid input parameters: dbName and orderId required');
                err.status = 400;
                return callback(err);
            }

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            VirtualMarketOrder.findById(orderId, function (err, order) {
                if (err) {
                    return callback(err);
                }

                if (!order) {
                    err = new Error('Order not found');
                    err.status = 404;
                    return callback(err);
                }

                // Check if delivery is on-time or late
                var dueDate = moment(order.deliveryRequirement.dueDate);
                var submittedDate = moment(order.delivery.submittedAt);
                var isOnTime = submittedDate.isSameOrBefore(dueDate);
                var daysLate = isOnTime ? 0 : submittedDate.diff(dueDate, 'days');

                var finalRevenue = order.paymentTerms.revenue;
                var scoreDeduction = 0;

                if (!isOnTime) {
                    // Late delivery: apply penalty
                    finalRevenue = order.paymentTerms.revenue - order.paymentTerms.lateDeliveryPenalty;
                    scoreDeduction = order.paymentTerms.scoreDeduction;
                }

                var updateData = {
                    status: 'completed',
                    delivery: {
                        submittedAt: order.delivery.submittedAt,
                        submittedQuantity: order.delivery.submittedQuantity,
                        status: 'verified'
                    },
                    fulfillmentStatus: {
                        isOnTime: isOnTime,
                        daysLate: daysLate,
                        finalRevenue: finalRevenue
                    },
                    paymentTerms: {
                        revenue: order.paymentTerms.revenue,
                        lateDeliveryPenalty: order.paymentTerms.lateDeliveryPenalty,
                        scoreDeduction: scoreDeduction,
                        isPaid: true
                    },
                    updatedAt: new Date()
                };

                VirtualMarketOrder.findByIdAndUpdate(orderId, updateData, { new: true }, function (err, updated) {
                    if (err) {
                        return callback(err);
                    }

                    var result = {
                        order: updated,
                        isOnTime: isOnTime,
                        daysLate: daysLate,
                        finalRevenue: finalRevenue,
                        penaltyApplied: !isOnTime ? order.paymentTerms.lateDeliveryPenalty : 0,
                        scoreDeduction: scoreDeduction,
                        message: isOnTime ? 
                            'Order completed on-time. Payment received: ' + finalRevenue : 
                            'Order completed late. Penalty applied: ' + order.paymentTerms.lateDeliveryPenalty + ', Score deduction: ' + scoreDeduction
                    };

                    callback(null, result);
                });
            });
        };

        /**
         * Reject an order - User decides not to accept it
         * Changes status from 'available' to 'rejected'
         * 
         * @param {Object} options - {dbName, orderId}
         * @param {Function} callback - (err, result)
         */
        this.rejectOrder = function (options, callback) {
            var VirtualMarketOrder;
            var dbName;
            var orderId;
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
            orderId = options.orderId;

            if (!dbName || !orderId) {
                err = new Error('Invalid input parameters: dbName and orderId required');
                err.status = 400;
                return callback(err);
            }

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            VirtualMarketOrder.findByIdAndUpdate(orderId, { status: 'rejected', updatedAt: new Date() }, { new: true }, function (err, order) {
                if (err) {
                    return callback(err);
                }

                if (!order) {
                    err = new Error('Order not found');
                    err.status = 404;
                    return callback(err);
                }

                callback(null, {
                    message: 'Order rejected',
                    order: order
                });
            });
        };

        /**
         * Auto-check for overdue orders and apply penalties
         * Should be called at cycle end or periodically
         * 
         * @param {Object} options - {dbName}
         * @param {Function} callback - (err, result)
         */
        this.checkAndApplyOverduePenalties = function (options, callback) {
            var VirtualMarketOrder;
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

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            // Find orders that are accepted or delivered but past due date
            var now = new Date();

            VirtualMarketOrder.find({
                status: { $in: ['accepted', 'delivered'] },
                'deliveryRequirement.dueDate': { $lt: now }
            }).exec(function (err, overdueOrders) {
                if (err) {
                    return callback(err);
                }

                if (!overdueOrders || overdueOrders.length === 0) {
                    return callback(null, {
                        message: 'No overdue orders found',
                        overdueCount: 0,
                        orders: []
                    });
                }

                // Update overdue orders
                var ordersToUpdate = overdueOrders.map(function (order) {
                    return {
                        updateOne: {
                            filter: { _id: order._id },
                            update: {
                                $set: {
                                    status: 'overdue',
                                    updatedAt: new Date()
                                }
                            }
                        }
                    };
                });

                VirtualMarketOrder.bulkWrite(ordersToUpdate, function (err, bulkResult) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, {
                        message: 'Overdue orders marked',
                        overdueCount: overdueOrders.length,
                        orders: overdueOrders
                    });
                });
            });
        };

        /**
         * Get order fulfillment statistics
         * 
         * @param {Object} options - {dbName, cycleNumber}
         * @param {Function} callback - (err, stats)
         */
        this.getOrderFulfillmentStats = function (options, callback) {
            var VirtualMarketOrder;
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

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            var cycleNumber = options.cycleNumber || null;
            var matchQuery = {};
            if (cycleNumber) {
                matchQuery.cycleNumber = cycleNumber;
            }

            VirtualMarketOrder.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalRevenue: { $sum: '$paymentTerms.revenue' },
                        totalPaid: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentTerms.isPaid', true] }, '$fulfillmentStatus.finalRevenue', 0]
                            }
                        }
                    }
                }
            ], function (err, stats) {
                if (err) {
                    return callback(err);
                }

                var statsMap = {
                    available: 0,
                    accepted: 0,
                    delivered: 0,
                    completed: 0,
                    overdue: 0,
                    rejected: 0
                };

                var totalRevenue = 0;
                var totalPaid = 0;

                if (stats && stats.length > 0) {
                    stats.forEach(function (stat) {
                        statsMap[stat._id] = stat.count;
                        totalRevenue += stat.totalRevenue || 0;
                        totalPaid += stat.totalPaid || 0;
                    });
                }

                callback(null, {
                    statusBreakdown: statsMap,
                    totalRevenue: totalRevenue,
                    totalPaid: totalPaid,
                    pendingRevenue: totalRevenue - totalPaid
                });
            });
        };

        return this;
    };
};
