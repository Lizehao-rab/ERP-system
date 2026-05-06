var mongoose = require('mongoose');
var async = require('async');
var redisStore = require('../helpers/redisClient');
var objectId = mongoose.Types.ObjectId;

var Module = function (models) {
    'use strict';

    var userSchema = mongoose.Schemas.User;

    // 禁用模块列表 - 单机经营模拟系统中不需要的功能
    var DISABLED_MODULES = {
        // CRM - 线索、商机、客户跟进相关
        'leads': true,
        'opportunity': true,
        'dealTasks': true,
        
        // 外部集成
        'integrations': true,
        'syncLogs': true,
        
        // 项目与任务管理
        'project': true,
        'projectsDashboard': true,
        'tasks': true,
        
        // 复杂税务、手工会计凭证
        'manualEntry': true,
        'journalEntries': true,
        'taxSettings': true,
        
        // 招聘、入职、合同、假勤、考勤
        'jobs': true,
        'application': true,
        'vacation': true,
        'weeklyScheduler': true,
        'wTrack': true,
        
        // 多队伍/权限隔离（单用户模式）
        'saas': true
    };

    function getModules(req, userId, callback) {
        models
            .get(req.session.lastDb, 'User', userSchema)
            .aggregate([{
                    $match: {
                        _id: objectId(userId)
                    }
                }, {
                    $lookup: {
                        from        : 'Profile',
                        localField  : 'profile',
                        foreignField: '_id',
                        as          : 'profile'
                    }
                }, {
                    $project: {
                        profileAccess: {
                            $arrayElemAt: [
                                '$profile.profileAccess',
                                0
                            ]
                        },

                        _id: 0
                    }
                }, {
                    $project: {
                        profileAccess: {
                            $filter: {
                                input: '$profileAccess',
                                as   : 'access',
                                cond : {$eq: ['$$access.access.read', true]}
                            }
                        },

                        _id: 0
                    }
                }, {
                    $unwind: '$profileAccess'
                }, {
                    $group: {
                        _id: '$profileAccess.module'
                    }
                }, {
                    $lookup: {
                        from        : 'modules',
                        localField  : '_id',
                        foreignField: '_id',
                        as          : 'module'
                    }
                }, {
                    $project: {
                        module: {
                            $arrayElemAt: [
                                '$module',
                                0
                            ]
                        },

                        _id: 0
                    }
                }, {
                    $match: {
                        'module.visible': true
                    }
                }, {
                    $project: {
                        _id     : '$module._id',
                        mname   : '$module.mname',
                        href    : '$module.href',
                        sequence: '$module.sequence',
                        parrent : {
                            $cond: ['$module.single', '$module._id', '$module.parrent']
                        },

                        single: '$module.single',
                        link  : '$module.link'
                    }
                }, {
                    $sort: {
                        sequence: 1
                    }
                }, {
                    $group: {
                        _id       : '$parrent',
                        subModules: {
                            $push: '$$ROOT'
                        }
                    }
                }, {
                    $match: {
                        _id: {
                            $ne: null
                        }
                    }
                }, {
                    $lookup: {
                        from        : 'modules',
                        localField  : '_id',
                        foreignField: '_id',
                        as          : 'module'
                    }

                }, {
                    $project: {
                        module: {
                            $arrayElemAt: [
                                '$module',
                                0
                            ]
                        },

                        subModules: {
                            mname : 1,
                            href  : 1,
                            single: 1,
                            link  : 1
                        },

                        _id: 0
                    }
                }, {
                    $match: {
                        'module.visible': true
                    }
                }, {
                    $sort: {
                        'module.sequence': 1
                    }
                }, {
                    $project: {
                        _id       : '$module._id',
                        mname     : '$module.mname',
                        href      : '$module.href',
                        single    : '$module.single',
                        link      : '$module.link',
                        subModules: 1
                    }
                }],

                callback
            );
    }

    this.getAllModulesByProfile = function (req, res, next) {
        var userId = req.session ? req.session.uId : null;
        var key = req.session.profileId;

        getModules(req, userId, function (err, modules) {
            if (err) {
                return next(err);
            }

            // 过滤禁用的模块
            var filteredModules = modules.map(function(parentModule) {
                if (DISABLED_MODULES[parentModule.href]) {
                    // 跳过禁用的主菜单模块
                    return null;
                }
                
                // 过滤子菜单中的禁用项
                if (parentModule.subModules && Array.isArray(parentModule.subModules)) {
                    parentModule.subModules = parentModule.subModules.filter(function(subModule) {
                        return !DISABLED_MODULES[subModule.href];
                    });
                }
                
                return parentModule;
            }).filter(function(m) {
                // 移除null项，且如果没有子菜单则也移除
                return m !== null && (!m.subModules || m.subModules.length > 0);
            });

            res.status(200).send(filteredModules);
            // redisStore.writeToStorage('modules', key, JSON.stringify(filteredModules));
        });
    };

};

module.exports = Module;
