module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var purchaseOrderSchema = new mongoose.Schema({
        cycleNumber: {
            type: Number,
            required: true
        },
        orderCode: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        materialId: {
            type: ObjectId,
            ref: 'material',
            required: true
        },
        materialName: {
            type: String,
            required: true
        },
        quantityOrdered: {
            type: Number,
            required: true,
            min: 1
        },
        quantityReceived: {
            type: Number,
            default: 0,
            min: 0
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
        },
        status: {
            type: String,
            enum: ['pending', 'received', 'cancelled'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'unpaid', 'partial'],
            default: 'paid'
        },
        orderDate: {
            type: Date,
            default: Date.now
        },
        expectedDeliveryDate: {
            type: Date,
            required: true
        },
        actualDeliveryDate: {
            type: Date
        },
        isFullyReceived: {
            type: Boolean,
            default: false
        },
        materialInventoryId: {
            type: ObjectId,
            ref: 'materialInventory'
        },
        notes: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: ObjectId,
            ref: 'employee'
        }
    }, {
        collection: 'purchaseOrder',
        strict: true
    });

    // Middleware to generate order code
    purchaseOrderSchema.pre('save', function (next) {
        if (!this.orderCode) {
            this.orderCode = 'PO-C' + this.cycleNumber + '-' + Date.now().toString().slice(-6);
        }
        next();
    });

    mongoose.model('purchaseOrder', purchaseOrderSchema, 'purchaseOrder');

    return purchaseOrderSchema;
});
