define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/login/GatherInfoTemplate.html',
    'dataService',
    'helpers/keyValidator'
], function (Backbone, _, $, GatherInfoTemplate, dataService, keyValidator) {

    var GatherInfoView = Backbone.View.extend({
        el      : '#gatherView',
        template: _.template(GatherInfoTemplate),

        events: {
            'click #submit'   : 'onSubmit',
            'keypress .forNum': 'keypressHandler'
        },

        initialize: function (options) {

            this.render();
        },

        keypressHandler: function (e) {
            return keyValidator(e, false, true);
        },

        onSubmit: function (e) {
            var self = this;
            var $thisEl = this.$el;
            var mobilePhone = $thisEl.find('#phone').val() || '';
            var website = $thisEl.find('#website').val() || '';
            var company = $thisEl.find('#companyName').val() || '';
            var firstName = $thisEl.find('.firstName').val() || '';
            var lastName = $thisEl.find('.lastName').val() || '';
            var err = '';
            var numberPattern = /\d+/g;

            mobilePhone = (mobilePhone.match(numberPattern)).join('');

            var data = {
                mobilePhone: '+' + mobilePhone,
                website    : website,
                company    : company,
                first      : firstName,
                last       : lastName
            };

            e.stopPropagation();
            e.preventDefault();

            if (!mobilePhone) {
                err += 'Phone number is required';
            }

            // 提取纯数字部分用于长度验证
            var digitsOnly = mobilePhone.replace(/\D/g, '');
            // 允许国内11位手机号（1开头）或国际号（通常12-15位数字）
            if (mobilePhone.length && (digitsOnly.length < 11 || digitsOnly.length > 15 || !digitsOnly.length)) {
                return App.render({type: 'error', message: 'Please, enter valid Mobile Phone (11-15 digits)'});
            }

            if (err) {
                App.render({type: 'error', message: err});

                return;
            }

            dataService.patchData('/users/' + App.currentUser._id, data, function (err) {
                if (!err) {
                    self.$el.html('');
                    self.$el.addClass('hidden');
                    App.currentUser.mobilePhone = mobilePhone;
                    Backbone.history.fragment = '';
                    Backbone.history.navigate('/easyErp/reportsDashboard', {trigger: true});
                    return false;
                }

                App.render({
                    type   : 'error',
                    message: err.responseJSON.error
                });
            });
        },

        render: function () {
            var $thisEl = this.$el;

            this.$el.removeClass('hidden');

            $thisEl.html(this.template({user: App.currentUser}));
        }
    });

    return GatherInfoView;
});
