$.sap.declare("gdt.salesui.data.Preloader");
$.sap.require("gdt.salesui.data.DataContext");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.Preloader = (function($, core, _, datacontext) {
	var init = function(model) {
			var allCustomersDfr = $.Deferred(function(defer) {
					datacontext.customers.load().done(function () {
						var allCustomers = core.getModel('allCustomers'),
							results = datacontext.customers.getAllLocal();
						
	                		allCustomers.setData(results);
	                		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
				
			myCustomersDfr = $.Deferred(function(defer) {
				model.read("/MyCustomerSet()", {
	            	success: function(data) {
	                	var myCustomers = core.getModel('myCustomers');
	                	myCustomers.setData(_.uniq(data.results, function(item) { 
	                	    return item.CustomerID;
	                	}));
	                	defer.resolve();
	            	},
					error: function() {
						defer.reject();
					}
	            });
			}),

			systemInfoDfr = $.Deferred(function(defer) {
				model.read("/SystemProfileSet()", {
	            	success: function(data) {
	                	var systemInfo = core.getModel('systemInfo');
	                	if (data.results.length > 0) {
	                		systemInfo.setData(data.results[0]);
							datacontext.userprefs.load(systemInfo.getProperty('/Uname')).done(function () {
								defer.resolve();
							}).fail(function(msg) {
								defer.reject(msg);
							});
	                	} else {
							defer.reject();
	                	}
	            	},
					error: function() {
						defer.reject();
					}
	            });
			}),

			blankDetailLineDfr = $.Deferred(function(defer) {
				model.read("/SalesDocumentDetailSet(SalesDocumentID='0000000000',SalesDocumentLineID='000000',ManufacturerID='000000000000',MaterialID='00',ManufacturerPartID='00')", {
	            	success: function(data) {
	                	var blankDetailLine = core.getModel('blankDetailLine');
	                	blankDetailLine.setData(data);
	                	defer.resolve();
	            	},
					error: function() {
						defer.reject();
					}
	            });
			}),

			shippingConditionsDfr = $.Deferred(function(defer) {
				model.read('/ShippingConditionsSet', {
					success: function(data) {
						var globalSelectItems = core.getModel('globalSelectItems');
						globalSelectItems.setProperty('/ShippingConditions', data.results);
						defer.resolve();
					},
					error: function() {
						defer.reject();
					}
				});
			}),

			rejectionReasonsDfr = $.Deferred(function(defer) {
				datacontext.rejectionreasons.load().done(function () {
					var rejectionReasons = core.getModel('rejectionReasons'),
						results = datacontext.rejectionreasons.getAllLocal();

					rejectionReasons.setData(results);
					defer.resolve();
				}).fail(function (response) {
					defer.reject(response);
				});
			}),

			manufacturersDfr = $.Deferred(function(defer) {
			model.read('/ManufacturerSet', {
				success: function(data) {
					var globalSelectItems = core.getModel('globalSelectItems');
						mfrs = null,
						vdrs = null;

					data.results.unshift({ManufacturerID: '', ManufacturerName: ''});
					mfrs = _.filter(_.reject(data.results, {ManufacturerName : 'Alt Payee'}),{KTOKK : 'MNFR'});
					vdrs = _.filter(_.reject(data.results, {ManufacturerName : 'Alt Payee'}),{KTOKK : 'YB01'});
					globalSelectItems.setProperty('/Manufacturers', mfrs);
					globalSelectItems.setProperty('/Vendors', vdrs);
					defer.resolve();
				},
				error: function() {
					defer.reject();
				}
			});
		});

		return $.when(systemInfoDfr, allCustomersDfr, myCustomersDfr, blankDetailLineDfr, shippingConditionsDfr, manufacturersDfr, rejectionReasonsDfr).promise();
	};
	
	return {
		init: init
	};
})($,sap.ui.getCore(), _, gdt.salesui.data.DataContext);