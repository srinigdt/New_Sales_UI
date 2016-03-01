$.sap.declare("gdt.salesui.data.DataService_CustomerBalances");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_CustomerBalances = (function($, core, _, helper) {
	var get = function(customerId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				
	        	model.read("/CustomerSet(CustomerID='" + customerId + "')/Balances", {
	            	success: function(data, response) {
	                	defer.resolve(data);
	            	},
					error: function(response) {
						defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Customer Balances for Customer from SAP."));
					}
	            });
			}).promise();		
		}; 
	
	return {
	    get: get,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);