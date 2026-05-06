var express = require('express');
var router = express.Router();
var SalesDashboardHandler = require('../handlers/salesDashboard');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (event, models) {
    'use strict';

    var handler = new SalesDashboardHandler(event, models);

    router.use(authStackMiddleware);

    /**
     * @api {get} /salesDashboard/orderPool Get Available Orders
     * @apiName getOrderPool
     * @apiGroup SalesDashboard
     * @apiDescription Returns list of available virtual market orders ready for acceptance
     * 
     * @apiParam {Number} [cycleNumber] Specific cycle to query (optional)
     * 
     * @apiSuccess {Array} data Array of available orders
     * @apiSuccess {Number} count Total count of available orders
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": [
     *     {
     *       "_id": "...",
     *       "orderCode": "VMO-C1-1000",
     *       "product": {
     *         "productName": "Product A",
     *         "quantity": 50,
     *         "unitPrice": 100,
     *         "totalAmount": 5000
     *       },
     *       "deliveryRequirement": {
     *         "dueDate": "2026-05-13T00:00:00Z",
     *         "daysAllowed": 10
     *       },
     *       "status": "available",
     *       "paymentTerms": {
     *         "revenue": 5000,
     *         "lateDeliveryPenalty": 1500,
     *         "scoreDeduction": 15
     *       }
     *     }
     *   ],
     *   "count": 5
     * }
     */
    router.get('/orderPool', handler.getOrderPool);

    /**
     * @api {post} /salesDashboard/acceptOrder Accept an Order
     * @apiName acceptOrder
     * @apiGroup SalesDashboard
     * @apiDescription User accepts an order from available pool
     * Changes order status from 'available' to 'accepted'
     * 
     * @apiParam {String} orderId Order ID to accept
     * 
     * @apiSuccess {Object} data Updated order object
     * @apiSuccess {String} message Confirmation message
     */
    router.post('/acceptOrder', handler.acceptOrder);

    /**
     * @api {get} /salesDashboard/myOrders Get My Orders
     * @apiName getMyOrders
     * @apiGroup SalesDashboard
     * @apiDescription Returns user's accepted and in-progress orders
     * 
     * @apiSuccess {Array} data Array of accepted orders
     * @apiSuccess {Number} count Total count of user's orders
     */
    router.get('/myOrders', handler.getMyOrders);

    /**
     * @api {post} /salesDashboard/submitDelivery Submit Delivery
     * @apiName submitDelivery
     * @apiGroup SalesDashboard
     * @apiDescription User submits order delivery for verification
     * 
     * @apiParam {String} orderId Order ID
     * @apiParam {Number} submittedQuantity Quantity delivered
     * 
     * @apiSuccess {Object} data Updated order object
     * @apiSuccess {String} message Delivery submission confirmation
     */
    router.post('/submitDelivery', handler.submitDelivery);

    /**
     * @api {post} /salesDashboard/verifyDelivery Verify and Complete Order
     * @apiName verifyDelivery
     * @apiGroup SalesDashboard
     * @apiDescription System verifies delivery and auto-applies payment/penalty
     * Auto-checks if delivery is on-time or late
     * On-time: Auto-payment
     * Late: Auto-penalty (30% of revenue) + score deduction
     * 
     * @apiParam {String} orderId Order ID to verify
     * 
     * @apiSuccess {Object} data Verification result with final revenue, penalties, etc.
     * @apiSuccess {String} message Result message
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "order": {...},
     *     "isOnTime": true,
     *     "daysLate": 0,
     *     "finalRevenue": 5000,
     *     "penaltyApplied": 0,
     *     "scoreDeduction": 0,
     *     "message": "Order completed on-time. Payment received: 5000"
     *   }
     * }
     */
    router.post('/verifyDelivery', handler.verifyDelivery);

    /**
     * @api {post} /salesDashboard/rejectOrder Reject an Order
     * @apiName rejectOrder
     * @apiGroup SalesDashboard
     * @apiDescription User rejects an order (order returns to available pool)
     * 
     * @apiParam {String} orderId Order ID to reject
     * 
     * @apiSuccess {Object} data Updated order object
     * @apiSuccess {String} message Rejection confirmation
     */
    router.post('/rejectOrder', handler.rejectOrder);

    /**
     * @api {get} /salesDashboard/orderSummary Get Order Summary
     * @apiName getOrderSummary
     * @apiGroup SalesDashboard
     * @apiDescription Get summary statistics for all orders in cycle
     * 
     * @apiParam {Number} [cycleNumber] Specific cycle (optional)
     * 
     * @apiSuccess {Object} data Order summary with counts and revenue totals
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "totalOrders": 8,
     *     "availableOrders": 3,
     *     "acceptedOrders": 2,
     *     "completedOrders": 2,
     *     "overdueOrders": 1,
     *     "totalRevenue": 40000,
     *     "paidRevenue": 10000,
     *     "totalPenalties": 1500
     *   }
     * }
     */
    router.get('/orderSummary', handler.getOrderSummary);

    /**
     * @api {get} /salesDashboard/fulfillmentStats Get Fulfillment Stats
     * @apiName getFulfillmentStats
     * @apiGroup SalesDashboard
     * @apiDescription Get fulfillment statistics breakdown by status
     * 
     * @apiParam {Number} [cycleNumber] Specific cycle (optional)
     * 
     * @apiSuccess {Object} data Fulfillment statistics
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "statusBreakdown": {
     *       "available": 3,
     *       "accepted": 2,
     *       "delivered": 1,
     *       "completed": 2,
     *       "overdue": 1,
     *       "rejected": 1
     *     },
     *     "totalRevenue": 40000,
     *     "totalPaid": 10000,
     *     "pendingRevenue": 30000
     *   }
     * }
     */
    router.get('/fulfillmentStats', handler.getFulfillmentStats);

    /**
     * @api {get} /salesDashboard/marketSnapshot Get Market Snapshot
     * @apiName getMarketSnapshot
     * @apiGroup SalesDashboard
     * @apiDescription Comprehensive virtual market snapshot combining all sales data
     * Single request returns: available orders, user's orders, summary, and stats
     * 
     * @apiParam {Number} [cycleNumber] Specific cycle (optional)
     * 
     * @apiSuccess {Object} data Market snapshot object
     * @apiSuccessExample Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "data": {
     *     "availableOrdersCount": 5,
     *     "availableOrders": [...],
     *     "myOrdersCount": 2,
     *     "myOrders": [...],
     *     "orderSummary": {...},
     *     "fulfillmentStats": {...},
     *     "timestamp": "2026-05-03T...",
     *     "systemStatus": {
     *       "orderPoolEnabled": true,
     *       "autoSettlementEnabled": true,
     *       "message": "虚拟市场订单池已启用"
     *     }
     *   }
     * }
     */
    router.get('/marketSnapshot', handler.getMarketSnapshot);

    return router;
};
