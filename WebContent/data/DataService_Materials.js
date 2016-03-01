$.sap.declare("gdt.salesui.data.DataService_Materials");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_Materials = (function($, core, _, helper) {
	var get = function(key) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				model.read("/MaterialSet(CustomerID='" + key.CustomerID + "',ManufacturerID='" + key.ManufacturerID + "',MaterialID='" + key.MaterialID + "',MfrPartID='" + encodeURIComponent(key.MfrPartID) + "')", {
					success: function(data) {
						defer.resolve(data);
					},
					error: function(response) {
						defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Material from SAP."));
					}
				});
			}).promise();
		},
		load = function(keys) {
			return $.Deferred(function(defer) {
				var model = core.getModel(),
					batchOperations = [];

				if (!keys || keys.length == 0) {
					defer.resolve([]);
				} else {
					_.each(keys, function (key) {
						batchOperations.push(model.createBatchOperation(
							"/MaterialSet(CustomerID='" + key.CustomerID + "',ManufacturerID='" + key.ManufacturerID + "',MaterialID='" + key.MaterialID + "',MfrPartID='" + encodeURIComponent(key.MfrPartID) + "')", 'GET'));
					});
					model.addBatchReadOperations(batchOperations);
					model.submitBatch(function (data) {
						var results = [];
						_.each(data.__batchResponses, function (response) {
							results.push((!!response.data) ? response.data : null);
						});
						defer.resolve(results);
					}, function (response) {
						defer.reject(helper.ParseError(response, "SalesUI Could not fetch the Material from SAP."));
					});
				}
			}).promise();
		};

	return {
	    get: get,
		load: load,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);