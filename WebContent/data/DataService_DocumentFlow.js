 $.sap.declare("gdt.salesui.data.DataService_DocumentFlow");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_DocumentFlow = (function($, core, _, helper) {
	var get = function(DocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	        	model.read("/DocumentSet(DocumentID='" + DocumentId + "')?$expand=DocumentFlow", {
		            	success: function(data, response) {
	                        core.getModel('documentFlow').setData(data);
							var results = _dataDownFix(data);
							defer.resolve(results);
		            	},
						error: function(response) {
							defer.reject(helper.ParseError(response, "SalesUI Could not fetch the DocumentFlow."));
						}
		            });
			}).promise();		
		},

		getByForeignKey = function(DocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	        	model.read("/DocumentSet(DocumentID='" + DocumentId + "')?$expand=DocumentFlow", {
		            	success: function(data, response) {
	                        core.getModel('documentFlow').setData(data);
							var results = _dataDownFix(data);
							defer.resolve(results);
		            	},
						error: function(response) {
							defer.reject(helper.ParseError(response, "SalesUI Could not fetch the DocumentFlow."));
						}
		            });
			}).promise();		
		},		
		
		
_dataDownFix = function(data) {
           rows = data.DocumentFlow.results;
           _.each(rows, function (row, i) { 
	       row.__metadata = ""; //removing metaData Content
	       row.__proto__ = "";	
               });

       var result = [ ];
       rootNode    = _.min(rows, function(row) { return row.Hlevel; });
       result[0]   = rootNode ;
       childNodes  = _.filter(rows, function(row) { return row.Docnuv == rootNode.Docnum ; });
       rootNode.Node = childNodes;
       _getFillChildren(childNodes,rows);

       return result;
		};
		
_getFillChildren = function(childNodes,rows){
	_.each(childNodes, function (child, i) { 
		childNodes = _.filter(rows, function (row) { return ( row.Docnuv == child.Docnum )  });
		filterrows = _.filter(rows, function (row) { return ( row.Docnuv != child.Docnum )  });
		if(childNodes.length == 0) return;
		child.Node = childNodes;
		_getFillChildren(childNodes,filterrows);
	} );	
	
};		
	return {
	    get: get,
	    getByForeignKey:getByForeignKey
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);