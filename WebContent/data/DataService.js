$.sap.declare("gdt.salesui.data.DataService");
$.sap.require("gdt.salesui.data.DataService_Customers");
$.sap.require("gdt.salesui.data.DataService_CustomerAcctMgrs");
$.sap.require("gdt.salesui.data.DataService_CustomerBalances");
$.sap.require("gdt.salesui.data.DataService_CustomerBillTos");
$.sap.require("gdt.salesui.data.DataService_CustomerEndCustomers");
$.sap.require("gdt.salesui.data.DataService_CustomerPayers");
$.sap.require("gdt.salesui.data.DataService_CustomerSalesAdmins");
$.sap.require("gdt.salesui.data.DataService_CustomerShipTos");
$.sap.require("gdt.salesui.data.DataService_Materials");
$.sap.require("gdt.salesui.data.DataService_SalesDocuments");
$.sap.require("gdt.salesui.data.DataService_SalesDocumentLines");
$.sap.require("gdt.salesui.data.DataService_SalesDocumentAttachments");
$.sap.require("gdt.salesui.data.DataService_RejectionReasons");
$.sap.require("gdt.salesui.data.DataService_UserPrefs");
$.sap.require("gdt.salesui.data.DataService_DocumentFlow");
$.sap.require("gdt.salesui.data.DataService_SalesOrderAvailableQuantity");

gdt.salesui.data.DataService = (function(customers, customerbalances, customershiptos, customerbilltos, customerpayers,
									customerendcustomers, customersalesadmins, customeracctmgrs, materials, salesdocuments,
										 salesdocumentlines, salesdocumentattachments, rejectionreasons, userprefs,documentflow,
										 SoAvailableQty) {
	var dataservice = {
	    customers: customers,
	    customerbalances: customerbalances,
	    customershiptos: customershiptos,
	    customerbilltos: customerbilltos,
	    customerpayers: customerpayers,
	    customerendcustomers: customerendcustomers,
	    customersalesadmins: customersalesadmins,
	    customeracctmgrs: customeracctmgrs,
		materials: materials,
	    salesdocuments: salesdocuments,
	    salesdocumentlines: salesdocumentlines,
		salesdocumentattachments: salesdocumentattachments,
		rejectionreasons: rejectionreasons,
		userprefs: userprefs,
		documentflow:documentflow,
		SoAvailableQty:SoAvailableQty
	};
	
	return dataservice;
})(gdt.salesui.data.DataService_Customers, 
		gdt.salesui.data.DataService_CustomerBalances,
		gdt.salesui.data.DataService_CustomerShipTos,
		gdt.salesui.data.DataService_CustomerBillTos,
		gdt.salesui.data.DataService_CustomerPayers,
		gdt.salesui.data.DataService_CustomerEndCustomers,
		gdt.salesui.data.DataService_CustomerSalesAdmins,
		gdt.salesui.data.DataService_CustomerAcctMgrs,
		gdt.salesui.data.DataService_Materials,
		gdt.salesui.data.DataService_SalesDocuments,
		gdt.salesui.data.DataService_SalesDocumentLines,
		gdt.salesui.data.DataService_SalesDocumentAttachments,
		gdt.salesui.data.DataService_RejectionReasons,
		gdt.salesui.data.DataService_UserPrefs,
		gdt.salesui.data.DataService_DocumentFlow,
		gdt.salesui.data.DataService_SalesOrderAvailableQuantity);