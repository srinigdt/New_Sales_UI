$.sap.declare("gdt.salesui.data.DataService_SalesOrderAvailableQuantity");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_SalesOrderAvailableQuantity = (function($, core, _, helper) {
	var get = function(DocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	        	model.read("/DocumentSet(DocumentID='" + DocumentId + "')?$expand=SOAvailableQuantity", {
		            	success: function(data, response) {
	                       // core.getModel('documentFlow').setData(data);
							defer.resolve(data.SOAvailableQuantity.results);
		            	},
						error: function(response) {
							defer.reject(helper.ParseError(response, "SalesUI Could not fetch Sales Order Available Quantity."));
						}
		            });
			}).promise();		
		},

		getByForeignKey = function(DocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	        	model.read("/DocumentSet(DocumentID='" + DocumentId + "')?$expand=DocumentFlow", {
		            	success: function(data, response) {
	                        //core.getModel('documentFlow').setData(data);
							defer.resolve(data.SOAvailableQuantity.results);
		            	},
						error: function(response) {
							defer.reject(helper.ParseError(response, "SalesUI Could not fetch Sales Order Available Quantity."));
						}
		            });
			}).promise();		
		};		
		
		
	return {
	    get: get,
	    getByForeignKey:getByForeignKey
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);