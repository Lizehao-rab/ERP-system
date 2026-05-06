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
         * Generate virtual market orders for a cycle
         * Creates a pool of random orders based on available products and business cycle
         * 
         * @param {Object} options - {dbName, cycleNumber, numOrders, productsData}
         * @param {Function} callback - (err, ordersGenerated)
         */
        this.generateOrderPool = function (options, callback) {
            var VirtualMarketOrder;
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

            VirtualMarketOrder = models.get(dbName, 'virtualMarketOrder', virtualMarketOrderSchema);

            var cycleNumber = options.cycleNumber || 1;
            var numOrders = options.numOrders || 5;
            var productsData = options.productsData || [];

            if (!productsData || productsData.length === 0) {
                err = new Error('No products available for order generation');
                err.status = 400;
                return callback(err);
            }

            var ordersToCreate = [];
            var orderCodeSequence = cycleNumber * 1000;

            // Generate random orders
            for (var i = 0; i < numOrders; i++) {
                var randomProduct = productsData[Math.floor(Math.random() * productsData.length)];
                var randomQuantity = Math.floor(Math.random() * 50) + 10; // 10-60 units
                var unitPrice = randomProduct.price || 100;
                var totalAmount = randomQuantity * unitPrice;
                var daysAllowed = Math.floor(Math.random() * 15) + 5; // 5-20 days

                var orderCode = 'VMO-C' + cycleNumber + '-' + (orderCodeSequence + i);

                var dueDate = moment().add(daysAllowed, 'days').toDate();

                // Base revenue = total amount
                // Penalty = 30% of revenue if late
                var lateDeliveryPenalty = Math.round(totalAmount * 0.30);
                var scoreDeduction = Math.floor(Math.random() * 20) + 10; // 10-30 points

                var orderRecord = {
                    cycleNumber: cycleNumber,
                    orderCode: orderCode,
                    product: {
                        productId: randomProduct._id,
                        productName: randomProduct.name || 'Product-' + i,
                        quantity: randomQuantity,
                        unitPrice: unitPrice,
                        totalAmount: totalAmount
                    },
                    deliveryRequirement: {
                        dueDate: dueDate,
                        daysAllowed: daysAllowed
                    },
                    status: 'available',
                    paymentTerms: {
                        revenue: totalAmount,
                        lateDeliveryPenalty: lateDeliveryPenalty,
                        scoreDeduction: scoreDeduction,
                        isPaid: false
                    },
                    notes: 'Auto-generated virtual market order'
                };

                ordersToCreate.push(orderRecord);
            }

            // Bulk insert orders
            VirtualMarketOrder.insertMany(ordersToCreate, function (err, created) {
                if (err) {
                    return callback(err);
                }

                callback(null, {
                    cycleNumber: cycleNumber,
                    ordersGenerated: created.length,
                    orders: created
                });
            });
        };

        /**
         * Get all available orders in current pool
         * 
         * @param {Object} options - {dbName, cycleNumber, status}
         * @param {Function} callback - (err, orders)
         */
        this.getAvailableOrders = function (options, callback) {
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
            var status = options.status || 'available';

            var query = { status: status };
            if (cycleNumber) {
                query.cycleNumber = cycleNumber;
            }

            VirtualMarketOrder
                .find(query)
                .sort({ createdAt: -1 })
                .exec(function (err, orders) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, orders || []);
                });
        };

        /**
         * Get user's accepted orders (in-progress)
         * 
         * @param {Object} options - {dbName}
         * @param {Function} callback - (err, orders)
         */
        this.getAcceptedOrders = function (options, callback) {
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

            VirtualMarketOrder
                .find({ status: { $in: ['accepted', 'delivered'] } })
                .sort({ 'acceptance.acceptedAt': -1 })
                .exec(function (err, orders) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, orders || []);
                });
        };

        /**
         * Get order by ID
         * 
         * @param {Object} options - {dbName, orderId}
         * @param {Function} callback - (err, order)
         */
        this.getOrderById = function (options, callback) {
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

                callback(null, order);
            });
        };

        /**
         * Get cycle summary with order statistics
         * 
         * @param {Object} options - {dbName, cycleNumber}
         * @param {Function} callback - (err, summary)
         */
        this.getCycleOrderSummary = function (options, callback) {
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
            var query = {};
            if (cycleNumber) {
                query.cycleNumber = cycleNumber;
            }

            VirtualMarketOrder.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        availableOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                        },
                        acceptedOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
                        },
                        completedOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        overdueOrders: {
                            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
                        },
                        totalRevenue: { $sum: '$paymentTerms.revenue' },
                        paidRevenue: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentTerms.isPaid', true] }, '$paymentTerms.revenue', 0]
                            }
                        },
                        totalPenalties: {
                            $sum: {
                                $cond: [{ $gt: ['$fulfillmentStatus.daysLate', 0] }, '$paymentTerms.lateDeliveryPenalty', 0]
                            }
                        }
                    }
                }
            ], function (err, result) {
                if (err) {
                    return callback(err);
                }

                var summary = result && result.length > 0 ? result[0] : {
                    totalOrders: 0,
                    availableOrders: 0,
                    acceptedOrders: 0,
                    completedOrders: 0,
                    overdueOrders: 0,
                    totalRevenue: 0,
                    paidRevenue: 0,
                    totalPenalties: 0
                };

                callback(null, summary);
            });
        };

        return this;
    };
};
