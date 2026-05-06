module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var virtualMarketOrderSchema = new mongoose.Schema({
        /**
         * Virtual Market Order (虚拟市场订单)
         * Auto-generated order pool for each business cycle
         * Single-player independent orders (no competition, no real customers)
         * 
         * @module VirtualMarketOrder
         * @class VirtualMarketOrder
         * 
         * @property {Number} cycleNumber - Business cycle when order was generated
         * @property {String} orderCode - Unique code (e.g., "VMO-001")
         * 
         * @property {Object} product - Ordered product details
         * @property {String} product.productId - Reference to Product
         * @property {String} product.productName - Product name
         * @property {Number} product.quantity - Ordered quantity
         * @property {Number} product.unitPrice - Unit price
         * @property {Number} product.totalAmount - Quantity * UnitPrice
         * 
         * @property {Object} deliveryRequirement - Delivery constraints
         * @property {Date} deliveryRequirement.dueDate - When order must be delivered
         * @property {Number} deliveryRequirement.daysAllowed - Days allowed for delivery (from order date)
         * 
         * @property {String} status - Order status
         *        - 'available': In pool, waiting for acceptance
         *        - 'accepted': User accepted, manufacturing in progress
         *        - 'delivered': User submitted delivery
         *        - 'completed': Delivery verified, payment received
         *        - 'overdue': Delivery deadline passed, penalty applied
         *        - 'rejected': User rejected this order
         * 
         * @property {Object} acceptance - When user accepted order
         * @property {Date} acceptance.acceptedAt - Timestamp of acceptance
         * @property {String} acceptance.acceptedBy - User/system that accepted
         * 
         * @property {Object} delivery - Delivery submission
         * @property {Date} delivery.submittedAt - When user submitted delivery
         * @property {Number} delivery.submittedQuantity - Quantity user claims to deliver
         * @property {String} delivery.status - 'pending' | 'verified' | 'rejected'
         * 
         * @property {Object} paymentTerms - Payment conditions
         * @property {Number} paymentTerms.revenue - Revenue if delivered on-time
         * @property {Number} paymentTerms.lateDeliveryPenalty - Penalty amount if late (deducted from revenue)
         * @property {Number} paymentTerms.scoreDeduction - Score deduction if late (out of 100)
         * @property {Boolean} paymentTerms.isPaid - Whether payment received
         * 
         * @property {Object} fulfillmentStatus - Track order completion
         * @property {Boolean} fulfillmentStatus.isOnTime - Whether delivered on-time
         * @property {Number} fulfillmentStatus.daysLate - Days after due date (0 if on-time)
         * @property {Number} fulfillmentStatus.finalRevenue - Revenue after deductions (if any)
         * 
         * @property {Date} createdAt - When order was generated
         * @property {Date} updatedAt - Last update
         * 
         * @property {String} notes - Optional notes/description
         */

        cycleNumber: {
            type: Number,
            required: true,
            index: true
        },

        orderCode: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        product: {
            productId: {
                type: ObjectId,
                ref: 'Products',
                default: null
            },
            productName: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0
            },
            totalAmount: {
                type: Number,
                required: true,
                min: 0
            }
        },

        deliveryRequirement: {
            dueDate: {
                type: Date,
                required: true
            },
            daysAllowed: {
                type: Number,
                required: true,
                min: 1,
                default: 10
            }
        },

        status: {
            type: String,
            enum: ['available', 'accepted', 'delivered', 'completed', 'overdue', 'rejected'],
            default: 'available',
            index: true
        },

        acceptance: {
            acceptedAt: {
                type: Date,
                default: null
            },
            acceptedBy: {
                type: String,
                default: null
            }
        },

        delivery: {
            submittedAt: {
                type: Date,
                default: null
            },
            submittedQuantity: {
                type: Number,
                default: 0
            },
            status: {
                type: String,
                enum: ['pending', 'verified', 'rejected', 'none'],
                default: 'none'
            }
        },

        paymentTerms: {
            revenue: {
                type: Number,
                required: true,
                default: 0
            },
            lateDeliveryPenalty: {
                type: Number,
                default: 0
            },
            scoreDeduction: {
                type: Number,
                default: 0
            },
            isPaid: {
                type: Boolean,
                default: false
            }
        },

        fulfillmentStatus: {
            isOnTime: {
                type: Boolean,
                default: null
            },
            daysLate: {
                type: Number,
                default: 0
            },
            finalRevenue: {
                type: Number,
                default: 0
            }
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        },

        notes: {
            type: String,
            default: ''
        }

    }, { collection: 'virtualMarketOrder' });

    mongoose.model('virtualMarketOrder', virtualMarketOrderSchema, 'virtualMarketOrder');
    mongoose.Schemas.virtualMarketOrder = virtualMarketOrderSchema;

    return virtualMarketOrderSchema;

})();
