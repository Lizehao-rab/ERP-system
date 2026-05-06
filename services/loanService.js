/**
 * 贷款管理服务 - 短期/长期贷款、利息自动计算和到期还款
 * 核心功能：申请贷款、计算利息、自动还本付息
 */

var async = require('async');
var moment = require('moment');

var LoanService = function (options) {
    'use strict';
    this.event = options.event;
    this.models = options.models;
};

/**
 * 申请贷款
 */
LoanService.prototype.applyForLoan = function (dbName, quarterNumber, loanData, callback) {
    var self = this;
    var LoanManagement = this.models.get(dbName, 'loanManagement');

    // 验证贷款额度限制
    var maxLoanAmount = loanData.loanType === 'shortTerm' ? 500000 : 1000000;
    if (loanData.principalAmount > maxLoanAmount) {
        return callback({
            success: false,
            message: '贷款金额超过额度限制: ' + maxLoanAmount
        });
    }

    // 计算到期日期
    var borrowDate = new Date();
    var maturityDate;
    var maturityQuarter;
    
    if (loanData.loanType === 'shortTerm') {
        // 短期贷款：3个月后
        maturityDate = moment(borrowDate).add(3, 'months').toDate();
        maturityQuarter = quarterNumber + 1;
    } else {
        // 长期贷款：12个月后
        maturityDate = moment(borrowDate).add(12, 'months').toDate();
        maturityQuarter = quarterNumber + 4;
    }

    var newLoan = new LoanManagement({
        dbName: dbName,
        loanType: loanData.loanType,
        principalAmount: loanData.principalAmount,
        borrowQuarterNumber: quarterNumber,
        annualInterestRate: loanData.loanType === 'shortTerm' ? 0.05 : 0.08,
        borrowDate: borrowDate,
        maturityDate: maturityDate,
        maturityQuarter: maturityQuarter,
        remainingBalance: loanData.principalAmount,
        status: 'active',
        createdBy: 'player'
    });

    newLoan.save(function (err, doc) {
        if (err) {
            return callback({
                success: false,
                message: '贷款申请失败: ' + err.message
            });
        }

        callback({
            success: true,
            loan: doc,
            message: '贷款已发放',
            details: {
                loanCode: doc.loanCode,
                amount: doc.principalAmount,
                rate: doc.annualInterestRate * 100 + '%',
                maturityDate: maturityDate,
                monthlyInterest: (doc.principalAmount * doc.quarterlyInterestRate).toFixed(2)
            }
        });
    });
};

/**
 * 为指定回合产生利息
 * 每个回合自动计算所有活跃贷款的利息
 */
LoanService.prototype.accrueInterestForQuarter = function (quarterNumber, dbName, callback) {
    var self = this;
    var LoanManagement = this.models.get(dbName, 'loanManagement');

    // 查询所有活跃贷款
    LoanManagement.find({
        dbName: dbName,
        status: 'active',
        borrowQuarterNumber: { $lte: quarterNumber }
    }, function (err, loans) {
        if (err) {
            return callback({
                success: false,
                message: '查询贷款失败: ' + err.message
            });
        }

        if (loans.length === 0) {
            return callback(null, {
                totalInterest: 0,
                loansProcessed: 0,
                details: []
            });
        }

        var totalInterest = 0;
        var interestDetails = [];
        var updateTasks = [];

        loans.forEach(function (loan) {
            // 计算本季度利息
            var quarterlyInterest = loan.principalAmount * loan.quarterlyInterestRate;
            totalInterest += quarterlyInterest;

            // 如果未到期，记录利息应计
            // 如果已到期，自动还款
            if (quarterNumber < loan.maturityQuarter) {
                // 未到期：累计利息
                var updateTask = function (callback) {
                    loan.totalInterestAccrued = (loan.totalInterestAccrued || 0) + quarterlyInterest;
                    loan.remainingBalance = loan.remainingBalance + quarterlyInterest;  // 利息加入本金
                    
                    // 添加到还款计划
                    if (!loan.repaymentHistory) {
                        loan.repaymentHistory = [];
                    }
                    loan.repaymentHistory.push({
                        quarterNumber: quarterNumber,
                        interestCharged: quarterlyInterest,
                        principalRepaid: 0,
                        totalRepaid: 0,
                        repaidAt: new Date(),
                        status: 'pending'
                    });

                    loan.save(callback);
                };
                updateTasks.push(updateTask);

                interestDetails.push({
                    loanCode: loan.loanCode,
                    loanType: loan.loanType,
                    quarterlyInterest: quarterlyInterest,
                    status: 'accrued'
                });

            } else if (quarterNumber === loan.maturityQuarter) {
                // 到期：自动还本付息
                var payoffTask = function (callback) {
                    loan.totalRepaid = loan.principalAmount + loan.totalInterestAccrued + quarterlyInterest;
                    loan.remainingBalance = 0;
                    loan.status = 'paid';

                    if (!loan.repaymentHistory) {
                        loan.repaymentHistory = [];
                    }
                    loan.repaymentHistory.push({
                        quarterNumber: quarterNumber,
                        interestCharged: quarterlyInterest,
                        principalRepaid: loan.principalAmount,
                        totalRepaid: loan.totalRepaid,
                        repaidAt: new Date(),
                        status: 'paid'
                    });

                    loan.save(callback);
                };
                updateTasks.push(payoffTask);

                interestDetails.push({
                    loanCode: loan.loanCode,
                    loanType: loan.loanType,
                    quarterlyInterest: quarterlyInterest,
                    principalRepaid: loan.principalAmount,
                    status: 'paid'
                });
            }
        });

        // 并行执行所有更新
        async.parallel(updateTasks, function (err) {
            if (err) {
                return callback({
                    success: false,
                    message: '利息处理失败: ' + err.message
                });
            }

            callback(null, {
                totalInterest: totalInterest,
                loansProcessed: loans.length,
                details: interestDetails
            });
        });
    });
};

/**
 * 获取当前活跃贷款列表和总负债
 */
LoanService.prototype.getActiveLoansSummary = function (dbName, callback) {
    var self = this;
    var LoanManagement = this.models.get(dbName, 'loanManagement');

    LoanManagement.find({
        dbName: dbName,
        status: { $in: ['active', 'repaying'] }
    }, function (err, loans) {
        if (err) {
            return callback({
                success: false,
                message: '查询贷款失败: ' + err.message
            });
        }

        var totalDebt = 0;
        var totalInterestAccrued = 0;
        var upcomingPayments = [];

        loans.forEach(function (loan) {
            totalDebt += loan.remainingBalance || 0;
            totalInterestAccrued += loan.totalInterestAccrued || 0;

            if (loan.maturityDate) {
                upcomingPayments.push({
                    loanCode: loan.loanCode,
                    type: loan.loanType,
                    principalAmount: loan.principalAmount,
                    remainingBalance: loan.remainingBalance,
                    maturityDate: loan.maturityDate,
                    totalDue: loan.principalAmount + (loan.totalInterestAccrued || 0)
                });
            }
        });

        callback({
            success: true,
            summary: {
                activeLoanCount: loans.length,
                totalDebt: totalDebt,
                totalInterestAccrued: totalInterestAccrued,
                upcomingPayments: upcomingPayments
            }
        });
    });
};

/**
 * 获取贷款详情
 */
LoanService.prototype.getLoanDetail = function (dbName, loanCode, callback) {
    var self = this;
    var LoanManagement = this.models.get(dbName, 'loanManagement');

    LoanManagement.findOne({
        dbName: dbName,
        loanCode: loanCode
    }, function (err, loan) {
        if (err) {
            return callback({
                success: false,
                message: '查询贷款失败: ' + err.message
            });
        }

        if (!loan) {
            return callback({
                success: false,
                message: '贷款不存在'
            });
        }

        callback({
            success: true,
            loan: loan
        });
    });
};

/**
 * 获取贷款历史（已完成的贷款）
 */
LoanService.prototype.getLoanHistory = function (dbName, callback) {
    var self = this;
    var LoanManagement = this.models.get(dbName, 'loanManagement');

    LoanManagement.find({
        dbName: dbName,
        status: 'paid'
    }).sort({ settledAt: -1 }).exec(function (err, loans) {
        if (err) {
            return callback({
                success: false,
                message: '查询贷款历史失败: ' + err.message
            });
        }

        var history = loans.map(function (loan) {
            return {
                loanCode: loan.loanCode,
                loanType: loan.loanType,
                principalAmount: loan.principalAmount,
                totalInterestPaid: loan.totalInterestAccrued,
                borrowDate: loan.borrowDate,
                maturityDate: loan.maturityDate,
                status: 'paid'
            };
        });

        callback({
            success: true,
            history: history
        });
    });
};

/**
 * 计算债务率 - 用于绩效评分
 */
LoanService.prototype.calculateDebtRatio = function (dbName, totalAssets, callback) {
    var self = this;
    var LoanManagement = this.models.get(dbName, 'loanManagement');

    LoanManagement.aggregate([
        { $match: { dbName: dbName, status: { $in: ['active', 'repaying'] } } },
        {
            $group: {
                _id: null,
                totalDebt: { $sum: '$remainingBalance' }
            }
        }
    ], function (err, result) {
        if (err) {
            return callback({
                success: false,
                message: '计算债务率失败: ' + err.message
            });
        }

        var totalDebt = (result.length > 0 && result[0].totalDebt) ? result[0].totalDebt : 0;
        var debtRatio = totalAssets > 0 ? totalDebt / totalAssets : 0;

        callback({
            success: true,
            totalDebt: totalDebt,
            totalAssets: totalAssets,
            debtRatio: debtRatio,
            healthStatus: debtRatio < 0.5 ? 'healthy' : (debtRatio < 0.7 ? 'warning' : 'critical')
        });
    });
};

module.exports = function (options) {
    return new LoanService(options);
};
