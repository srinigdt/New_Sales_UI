$.sap.declare("gdt.salesui.data.DataService_CustomerPayers");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_CustomerPayers = (function($, core, _, helper) {
	var getByForeignKey = function(customerId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				
				model.read("/CustomerSet(CustomerID='" + customerId + "')/Payers", {
	            	success: function(data, response) {
	                	defer.resolve(data.results);
	            	},
					error: function(response) {
						defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Payers for Customer from SAP."));
					}
	            });
			}).promise();		
		}; 
	
	return {
		getByForeignKey: getByForeignKey,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);