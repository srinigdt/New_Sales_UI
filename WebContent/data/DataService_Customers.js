$.sap.declare("gdt.salesui.data.DataService_Customers");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_Customers = (function($, core, _, helper) {
	var get = function(customerId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	        	model.read("/CustomerSet(CustomerID='" + customerId + "')", {
		            	success: function(data, response) {
							_dataDownFix(data);
		                	defer.resolve(data);
		            	},
						error: function(response) {
							defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Customer from SAP."));
						}
		            });
			}).promise();		
		},
		
		//Begin of Change: To get the results of Duplicate PO :Change by SXVASAMSETTI, 02/16/16		
		getPO = function(CustomerPOID) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	    		model.read("/CheckDuplicatePOSet(CustomerPOID='" + CustomerPOID + "')", {
		            	success: function(data, response) {
		                	defer.resolve(data);
		            	},
						error: function(data, response) {
							defer.reject(helper.ParseError(data,"Failed to check Duplicate PO."));
						}
		            });
			}).promise();		
		},
// End of Change			
		
		_dataDownFix = function(data) {
			if (data.ContactLastName && data.ContactFirstName) {
				data.ContactFullName = data.ContactLastName + ", " + data.ContactFirstName;
			} else {
				data.ContactFullName = "(Contact Unknown)";
			}

			if (!data.ContactPhone) data.ContactPhone = (data.Phone) ? data.Phone : "(Phone # Unknown)";
		},
		load = function(id) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				model.read("/CustomerSet()", {
	            	success: function(data, response) {
						_.each(data.results, function(row) {_dataDownFix(row);});
	                	defer.resolve(data.results);
	            	},
					error: function(response) {
						defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Customers from SAP."));
					}
	            });
			}).promise();		
		}; 
	
	return {
	    get: get,
	    getPO:getPO, 
	    load: load,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);