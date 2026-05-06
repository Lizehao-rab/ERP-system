'use strict';

var populateWrapper = require('../helpers/callbackWrapper').populate;
var mongoose = require('mongoose');
var employeeSchema = mongoose.Schemas.Employee;
var validator = require('validator');
var objectId = mongoose.Types.ObjectId;
var _ = require('lodash');

module.exports = function (models) {
    return new function () {
        this.create = function (options, callback) {
            var dbName;
            var EmployeeModel;
            var employee;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {
                };
            }

            dbName = options.dbName;
            delete options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;

                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            employee = new EmployeeModel(options);
            employee.save(function (err, employee) {
                if (err) {
                    return callback(err);
                }

                callback(null, employee);
            });
        };

        this.findByIdAndUpdate = function (_id, updateObject, options, callback) {
            var _options = {new: true};
            var EmployeeModel;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {
                };
            }

            if (!_id || !updateObject || typeof updateObject !== 'object') {
                err = new Error('Invalid input parameters');
                err.status = 400;

                return callback(err);
            }

            if (options) {
                _options = _.assign(_options, options);
            }

            dbName = _options.dbName;
            delete _options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;

                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            EmployeeModel.findByIdAndUpdate(_id, updateObject, _options, function (err, employee) {
                if (err) {
                    return callback(err);
                }

                callback(null, employee);
            });
        };

        this.findAndUpdate = function (query, updateObject, options, callback) {
            var _options = {};
            var EmployeeModel;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {
                };
            }

            if (!query || !updateObject || typeof updateObject !== 'object') {
                err = new Error('Invalid input parameters');
                err.status = 400;

                return callback(err);
            }

            if (options) {
                _options = _.assign(_options, options);
            }

            dbName = _options.dbName;
            delete _options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;

                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            EmployeeModel.update(query, updateObject, _options, function (err, updated) {
                if (err) {
                    return callback(err);
                }

                callback(null, updated);
            });
        };

        this.findById = function (_id, options, callback) {
            var EmployeeModel;
            var dbName;
            var query;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            dbName = options.dbName;

            if (!dbName || !validator.isMongoId(_id)) {
                err = new Error('Invalid input parameters');
                err.status = 400;

                if (typeof callback !== 'function') {
                    return populateWrapper(err);
                }

                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            query = EmployeeModel.findById(_id);

            if (typeof callback !== 'function') {
                return query;
            }

            query.exec(function (err, employee) {
                if (err) {
                    return callback(err);
                }

                callback(null, employee);
            });
        };

        this.findByIdAndRemove = function (_id, options, callback) {
            var EmployeeModel;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {
                };
            }

            dbName = options.dbName;

            delete options.dbName;

            if (!dbName || !_id) {
                err = new Error('Invalid input parameters');
                err.status = 400;

                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            EmployeeModel.findByIdAndRemove(_id, function (err, employee) {
                if (err) {
                    return callback(err);
                }

                callback(null, employee);
            });
        };

        this.sortByFiled = function (options, callback) {
            var EmployeeModel;
            var dbName;
            var query;
            var err;
            var sort;
            var aggregate;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            dbName = options.dbName;
            sort = options.sort;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;

                if (typeof callback !== 'function') {
                    return populateWrapper(err);
                }

                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);

            aggregate = [{
                $match: {
                    isEmployee: true
                }
            }, {
                $lookup: {
                    from        : 'Department',
                    localField  : 'department',
                    foreignField: '_id',
                    as          : 'department'
                }
            }, {
                $lookup: {
                    from        : 'JobPosition',
                    localField  : 'jobPosition',
                    foreignField: '_id',
                    as          : 'jobPosition'
                }
            }, {
                $lookup: {
                    from        : 'Employees',
                    localField  : 'manager',
                    foreignField: '_id',
                    as          : 'manager'
                }
            }, {
                $lookup: {
                    from        : 'transfers',
                    localField  : '_id',
                    foreignField: 'employee',
                    as          : 'transfer'
                }
            },
                {
                    $project: {
                        imageSrc             : 1,
                        name                 : 1,
                        workEmail            : 1,
                        personalEmail        : 1,
                        'workPhones.mobile'  : 1,
                        'workPhones.phone'   : 1,
                        skype                : 1,
                        department           : {$arrayElemAt: ['$department', 0]},
                        jobPosition          : {$arrayElemAt: ['$jobPosition', 0]},
                        manager              : {$arrayElemAt: ['$manager', 0]},
                        nationality          : 1,
                        'homeAddress.street' : 1,
                        'homeAddress.city'   : 1,
                        'homeAddress.state'  : 1,
                        'homeAddress.zip'    : 1,
                        'homeAddress.country': 1,
                        dateBirth            : 1,
                        age                  : 1,
                        source               : 1,
                        marital              : 1,
                        employmentType       : 1,
                        gender               : 1,
                        jobType              : 1,
                        'social.FB'          : 1,
                        'social.LI'          : 1,
                        'social.GP'          : 1,
                        userName             : 1,
                        transfer             : 1,
                        _id                  : 1
                    }
                },
                {
                    $project: {
                        imageSrc           : 1,
                        name               : 1,
                        workEmail          : 1,
                        personalEmail      : 1,
                        'workPhones.mobile': 1,
                        'workPhones.phone' : 1,
                        skype              : 1,
                        department         : '$department.name',
                        jobPosition        : '$jobPosition.name',
                        manager            : '$manager.name',
                        nationality        : 1,
                        homeAddress        : 1,
                        dateBirth          : 1,
                        age                : 1,
                        source             : 1,
                        marital            : 1,
                        employmentType     : 1,
                        gender             : 1,
                        jobType            : 1,
                        'social.FB'        : 1,
                        'social.LI'        : 1,
                        'social.GP'        : 1,
                        userName           : 1,
                        hired              : {
                            $filter: {
                                input: '$transfer',
                                as   : 'item',
                                cond : {
                                    $eq: ['$$item.status', 'hired']
                                }
                            }
                        },
                        fired              : {
                            $filter: {
                                input: '$transfer',
                                as   : 'item',
                                cond : {
                                    $eq: ['$$item.status', 'fired']
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        imageSrc      : 1,
                        name          : 1,
                        workEmail     : 1,
                        personalEmail : 1,
                        mobile        : '$workPhones.mobile',
                        phone         : '$workPhones.phone',
                        skype         : 1,
                        department    : 1,
                        jobPosition   : 1,
                        manager       : 1,
                        nationality   : 1,
                        homeAddress   : 1,
                        dateBirth     : 1,
                        age           : 1,
                        source        : 1,
                        marital       : 1,
                        employmentType: 1,
                        gender        : 1,
                        jobType       : 1,
                        FB            : '$social.FB',
                        LI            : '$social.LI',
                        GP            : '$social.GP',
                        userName      : 1,
                        hired         : {$max: '$hired.date'},
                        fired         : {$max: '$fired.date'}
                    }
                }
            ];

            if (options.dateRange) {
                if (options.hired) {
                    aggregate.push({
                        $match: {
                            $and: [
                                {
                                    hired: options.dateRange
                                }
                            ]
                        }
                    });
                }
                else {
                    aggregate.push({
                        $match: {
                            $and: [
                                {
                                    fired: options.dateRange
                                }
                            ]
                        }
                    });
                }
            }

            if (sort) {
                aggregate.push(sort);
            }

            query = EmployeeModel.aggregate(aggregate);

            if (typeof callback !== 'function') {
                return query;
            }

            query.exec(function (err, employee) {
                if (err) {
                    return callback(err);
                }

                callback(null, employee);
            });
        };

        /**
         * 新增员工（招人操作）- 简化版HR系统
         * @param {Object} options 包含dbName和员工信息
         * @param {Function} callback 回调函数
         */
        this.hire = function (options, callback) {
            var dbName;
            var EmployeeModel;
            var employee;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {};
            }

            dbName = options.dbName;
            delete options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;
                return callback(err);
            }

            // 招人即时生效 - 设置为已雇用状态
            options.isEmployee = true;
            options.hireDate = new Date();
            options.isActive = true;

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            employee = new EmployeeModel(options);
            employee.save(function (err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result);
            });
        };

        /**
         * 离职员工（裁员操作）- 简化版HR系统
         * @param {String} _id 员工ID
         * @param {Object} options 包含dbName等选项
         * @param {Function} callback 回调函数
         */
        this.fire = function (_id, options, callback) {
            var _updateOptions = {new: true};
            var EmployeeModel;
            var dbName;
            var updateData;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {};
            }

            if (!_id) {
                err = new Error('Invalid input parameters');
                err.status = 400;
                return callback(err);
            }

            dbName = options.dbName;
            delete options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;
                return callback(err);
            }

            // 裁员即时生效 - 更新为离职状态
            updateData = {
                isEmployee: false,
                isActive: false,
                fireDate: new Date()
            };

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            EmployeeModel.findByIdAndUpdate(_id, updateData, _updateOptions, function (err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result);
            });
        };

        /**
         * 获取在册员工总数
         * @param {Object} options 包含dbName
         * @param {Function} callback 回调函数
         */
        this.getActiveEmployeeCount = function (options, callback) {
            var EmployeeModel;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {};
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;
                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);
            
            var query = {
                isEmployee: true,
                isActive: true
            };

            // 如果设置了fireDate，则排除已离职的员工
            query.$or = [
                {fireDate: null},
                {fireDate: {$gt: new Date()}}
            ];

            EmployeeModel.count(query, function (err, count) {
                if (err) {
                    return callback(err);
                }

                callback(null, count);
            });
        };

        /**
         * 获取总人力成本（固定月度成本）
         * @param {Object} options 包含dbName
         * @param {Function} callback 回调函数
         */
        this.getTotalMonthlyCost = function (options, callback) {
            var EmployeeModel;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {};
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;
                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);

            EmployeeModel.aggregate([
                {
                    $match: {
                        isEmployee: true,
                        isActive: true,
                        $or: [
                            {fireDate: null},
                            {fireDate: {$gt: new Date()}}
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCost: {$sum: '$baseSalary'}
                    }
                }
            ], function (err, result) {
                if (err) {
                    return callback(err);
                }

                var totalCost = (result && result[0]) ? result[0].totalCost : 0;
                callback(null, totalCost);
            });
        };

        /**
         * 获取在册员工列表及其成本信息
         * @param {Object} options 包含dbName
         * @param {Function} callback 回调函数
         */
        this.getActiveEmployeesWithCost = function (options, callback) {
            var EmployeeModel;
            var dbName;
            var err;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback || typeof callback !== 'function') {
                callback = function () {};
            }

            dbName = options.dbName;

            if (!dbName) {
                err = new Error('Invalid input parameters');
                err.status = 400;
                return callback(err);
            }

            EmployeeModel = models.get(dbName, 'Employees', employeeSchema);

            EmployeeModel.aggregate([
                {
                    $match: {
                        isEmployee: true,
                        isActive: true,
                        $or: [
                            {fireDate: null},
                            {fireDate: {$gt: new Date()}}
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'Department',
                        localField: 'department',
                        foreignField: '_id',
                        as: 'department'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        fullName: {$concat: ['$name.first', ' ', '$name.last']},
                        department: {$arrayElemAt: ['$department.name', 0]},
                        baseSalary: 1,
                        annualCost: {$multiply: ['$baseSalary', 12]},
                        hireDate: 1,
                        isActive: 1
                    }
                },
                {
                    $sort: {hireDate: -1}
                }
            ], function (err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result || []);
            });
        }
    };
}
;
