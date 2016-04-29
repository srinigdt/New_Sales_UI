jQuery.sap.declare("gdt.salesui.util.ReOrderSoItems");

$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");
$.sap.require("sap.ui.core.format.DateFormat");
$.sap.require("gdt.salesui.data.DataContext");
gdt.salesui.util.ReOrderSoItems = (function($, core, _, view) {

reorderData = function(data){
var	params = {parentLineID: '', rows: [], sortedRows: [], result: false};
params.rows = $.extend(true, [], data);
params.parentLineID = '000000';
params = _reorderChildren(params);
return params.sortedRows;
},

_reorderChildren = function (params) {
	var children = _findLinesByParentLineID(params.parentLineID, params.rows),
		len = (!!children) ? children.length : 0,
		child = {},
		structuredLineID = '',
		canonicalLineID = '',
		originalLineIDOrder = [],
		sortedLineIDOrder,
		reordered = false;

	if (!children || children.length == 0) return false;

	for (var i = 0; i < len; i++) {
		child = children[i];
		structuredLineID = child.StructuredLineID;
		canonicalLineID = (structuredLineID.lastIndexOf(".") != -1 && parseInt(structuredLineID.substring(structuredLineID.lastIndexOf(".") + 1)) == 0) ? structuredLineID.substring(0, structuredLineID.lastIndexOf(".")) : structuredLineID;
		originalLineIDOrder.push({canonicalLineID: canonicalLineID, row: child});
	}

	sortedLineIDOrder = $.extend(true, [], originalLineIDOrder).sort(_srt({key:'canonicalLineID',dotted:true}));

	for (var i = 0; i < len; i++) {
		if (sortedLineIDOrder[i].canonicalLineID != originalLineIDOrder[i].canonicalLineID) reordered = true;
	}

	for (var i = 0; i < len; i++) {
		child = (reordered) ? sortedLineIDOrder[i].row : originalLineIDOrder[i].row;
		params.sortedRows.push(child);
		params.parentLineID = child.SalesDocumentLineID;
		_reorderChildren(params);
	}

	params.result = params.result || reordered;

	return params;
},	

_findLinesByParentLineID = function (parentLineID, rows){
	var currentSalesDocumentLines = rows || view.getModel('currentSalesDocumentLines').getData();

	return $.grep(currentSalesDocumentLines, function(n){
	  return (n.ParentLineID == parentLineID);
	});
},


_srt = function (sorton,descending) {
	 on = sorton && sorton.constructor === Object ? sorton : {};
	 return function(a,b){
		 var atokens = [],
			 btokens = [],
			 pad = 0;
	   if (on.string || on.key || on.dotted) {
		 a = on.key ? a[on.key] : a;
		 b = on.key ? b[on.key] : b;
		 a = (on.string || on.dotted) ? String(a).toLowerCase() : a;
		 b = (on.string || on.dotted) ? String(b).toLowerCase() : b;
		 // if key is not present, move to the end
		 if (on.key && (!b || !a)) {
		  return !a && !b ? 1 : !a ? 1 : -1;
		 }

		 if (on.dotted) {
			 atokens = a.split('.');
			 btokens = b.split('.');

			 if (atokens.length < btokens.length) {
				 for (var i = 0, count = btokens.length - atokens.length; i < count; i++) {
					 atokens.push('');
				 }
			 }
			 if (btokens.length < atokens.length) {
				 for (var i = 0, count = atokens.length - btokens.length; i < count; i++) {
					 btokens.push('');
				 }
			 }
			 a = '';
			 b = '';
			 for (var i = 0, count = atokens.length; i < count; i++) {
				 pad = Math.max(atokens[i].length, btokens[i].length);

				 a += _pad(atokens[i],pad);
				 b += _pad(btokens[i],pad);
			 }
		 }
	   }
	   return descending ? ~~((on.string || on.dotted) ? b.localeCompare(a) : a < b)
						 : ~~((on.string || on.dotted) ? a.localeCompare(b) : a > b);
	  };
},	


_pad = function (n, width, z) {
	  var 	paddingChar = z || '0',
			stringToPad = n + '';
	  return stringToPad.length >= width ? stringToPad : new Array(width - stringToPad.length + 1).join(paddingChar) + stringToPad;
}
	
return {
	reOrderData:reorderData 
}	
})($,sap.ui.getCore(), _, sap.ui.getCore().byId('__xmlview1'));