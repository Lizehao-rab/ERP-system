module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var materialInventorySchema = new mongoose.Schema({
        materialId: {
            type: ObjectId,
            ref: 'material',
            required: true
        },
        materialName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        totalValue: {
            type: Number,
            default: 0,
            min: 0
        },
        cycleNumber: {
            type: Number,
            required: true
        },
        lastPurchaseOrderId: {
            type: ObjectId,
            ref: 'purchaseOrder'
        },
        minStockLevel: {
            type: Number,
            default: 50,
            min: 0
        },
        maxStockLevel: {
            type: Number,
            default: 500,
            min: 0
        },
        storageLocation: {
            type: String,
            default: 'Warehouse-A'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: ObjectId,
            ref: 'employee'
        }
    }, {
        collection: 'materialInventory',
        strict: true
    });

    // Virtual field: total inventory value
    materialInventorySchema.virtual('inventoryValue')
        .get(function () {
            return this.quantity * this.unitPrice;
        });

    // Middleware to update totalValue before save
    materialInventorySchema.pre('save', function (next) {
        this.totalValue = this.quantity * this.unitPrice;
        this.updatedAt = new Date();
        next();
    });

    mongoose.model('materialInventory', materialInventorySchema, 'materialInventory');

    return materialInventorySchema;
});
