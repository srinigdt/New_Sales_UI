$.sap.declare("gdt.salesui.data.DataService_RejectionReasons");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_RejectionReasons = (function($, core, _, helper) {
	var load = function(id) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				model.read("/RejectionReasonSet", {
	            	success: function(data, response) {
	                	defer.resolve(data.results);
	            	},
					error: function(response) {
						if (!!response && !!response.response && !!response.response.statusCode && response.response.statusCode != 404) {
							defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Rejection Reasons from SAP."));
						} else {
							defer.resolve();
						}
					}
	            });
			}).promise();		
		}; 
	
	return {
	    load: load,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);