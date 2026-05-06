module.exports = (function () {
    'use strict';
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var productInventorySchema = new mongoose.Schema({
        productId: {
            type: ObjectId,
            ref: 'product',
            required: true
        },
        productName: {
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
        cycleProduced: {
            type: Number,
            default: 0
        },
        cycleConsumed: {
            type: Number,
            default: 0
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
        collection: 'productInventory',
        strict: true
    });

    // Virtual field: total inventory value
    productInventorySchema.virtual('inventoryValue')
        .get(function () {
            return this.quantity * this.unitPrice;
        });

    // Middleware to update totalValue before save
    productInventorySchema.pre('save', function (next) {
        this.totalValue = this.quantity * this.unitPrice;
        this.updatedAt = new Date();
        next();
    });

    mongoose.model('productInventory', productInventorySchema, 'productInventory');

    return productInventorySchema;
});
