jQuery.sap.declare("gdt.salesui.Component");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("gdt.salesui.data.Preloader");

sap.ui.core.UIComponent
        .extend(
                "gdt.salesui.Component",
                {

                    metadata : {
                        name : "GDT Sales UI",
                        version : "1.0",
                        includes : [],
                        dependencies : {
                            libs : ["sap.m", "sap.me", "sap.ushell"],
                            components : []
                        },
                        
                        config : {
                            resourceBundle : "i18n/messageBundle.properties",
                            titleResource : "SHELL_TITLE",

                            serviceConfig : {
                                name : "ZCUSTOMERS_SRV",
                                // serviceUrl:
								// "/sap/opu/odata/sap/ZCUSTOMERS_SRV/"
                                serviceUrl : "/sap/opu/odata/sap/Z_SALESUI_ENTITY_SRV_01/"
                            }
                        },

                        routing : {
                            config : {
                                viewType : "XML",
                                viewPath : "gdt.salesui.view", // common prefix
                                clearTarget : false,
                                transition : "slide"
                            },
                            routes : [
                                    {
                                        pattern : "customer/{customerId}",
                                        name : "master",
                                        view : "Master",
                                        viewLevel : 2,
                                        targetControl : "fioriContent",
                                        targetAggregation : "masterPages",
                                        subroutes : [{
                                            pattern : "customer/{customerId}/salesDocument/{salesDocId}/:tab:",
                                            name : "detail",
                                            view : "Detail",
                                            viewLevel : 3,
                                            targetAggregation : "detailPages"
                                        }]
                                    }, {
                                        pattern : "",
                                        name : "customer",
                                        view : "Customer",
                                        viewLevel : 1,
                                        targetAggregation : "masterPages",
                                        preservePageInSplitContainer : true,
                                        targetControl : "fioriContent",
                                    /*
									 * subroutes : [ { pattern :
									 * "Detail/{salesDocPath}/:tab:", // will be
									 * the url and from has to be provided in
									 * the data view : "Detail", viewLevel: 3,
									 * name : "Detail", // name used for
									 * listening or navigating to this route
									 * targetAggregation : "detailPages" }, {
									 * pattern : "{all*}", name : "NotFound",
									 * view : "NotFound", viewLevel : 3,
									 * targetAggregation : "detailPages" } ]
									 */}]
                        }
                    },

                    init : function() {
	                    var that = this,
	                    	core = sap.ui.getCore(),
	                    	serviceConfig = this.getMetadata().getConfig()["serviceConfig"], 
	                    	serviceUrl = ((window.location.hostname === "localhost") ? "proxy" : "")
	                            + serviceConfig.serviceUrl
	                            + ((window.location.hostname === "localhost") ? "?sap-client=150"
	                                    : ""),
	                                   // 
	                  
	                    rootPath = jQuery.sap.getModulePath("gdt.salesui"),
	                    
	                    mainCSSUrl = [rootPath, "css/mainCSS.css"].join("/"),
	                    
	                    printCSSUrl = [rootPath, "css/print.css"].join("/"),

	                    i18nModel = new sap.ui.model.resource.ResourceModel({
		                    bundleUrl : [rootPath,
		                            "i18n/messageBundle.properties"].join("/")
	                    }),

	                    deviceModel = new sap.ui.model.json.JSONModel({
	                        isTouch : sap.ui.Device.support.touch,
	                        isNoTouch : !sap.ui.Device.support.touch,
	                        isPhone : jQuery.device.is.phone,
	                        isNoPhone : !jQuery.device.is.phone,
	                        listMode : (jQuery.device.is.phone) ? "None"
	                                : "SingleSelectMaster",
	                        listItemType : (jQuery.device.is.phone) ? "Active"
	                                : "Inactive"
	                    }),
	                    
	                    blankDetailLine = new sap.ui.model.json.JSONModel({}),

						rejectionReasons = new sap.ui.model.json.JSONModel({}),

						allCustomers = new sap.ui.model.json.JSONModel({}),

						myCustomers = new sap.ui.model.json.JSONModel({}),

	                    currentCustomer = new sap.ui.model.json.JSONModel({}),

	                    closedQuotes = new sap.ui.model.json.JSONModel({}),

						openQuotes = new sap.ui.model.json.JSONModel({}),

						completedQuotes = new sap.ui.model.json.JSONModel({}),

						rejectedSalesOrders = new sap.ui.model.json.JSONModel({}),

						pendingSalesOrders = new sap.ui.model.json.JSONModel({}),

						openSalesOrders = new sap.ui.model.json.JSONModel({}),
	                    
	                    closedSalesOrders = new sap.ui.model.json.JSONModel({}),
	                    
	                    systemInfo = new sap.ui.model.json.JSONModel({}),
	                    
	                    currentSalesDocumentAttachments = new sap.ui.model.json.JSONModel({}),
	                    
	                    currentSalesDocument = new sap.ui.model.json.JSONModel({}),

	                    currentSalesDocumentLines = new sap.ui.model.json.JSONModel([]),
	                    
	                    currentCopySalesDocumentLines = new sap.ui.model.json.JSONModel([]),

	                    currentAttachments = new sap.ui.model.json.JSONModel([]),

	                    copies = new sap.ui.model.json.JSONModel([]),

	                    documentFlow = new sap.ui.model.json.JSONModel([]),
	                    
	                    currentState = new sap.ui.model.json.JSONModel({
	                        isEditMode : false,
	                        isNotEditMode : true,
	                        isQuote : false,
	                        isSalesOrder : false,
	                        isPendingSalesOrder : false,
	                        isSubmittedSalesOrder : false,
	                        canDelete : false,
	                        canEdit : true
	                    }),

	                    currentTotals = new sap.ui.model.json.JSONModel({
	                        HWRevenue : 0,
	                        HWCost : 0,
	                        HWGP : 0,
	                        HWGPP : 0,
	                        ServicesRevenue : 0,
	                        ServicesCost : 0,
	                        ServicesGP : 0,
	                        ServicesGPP : 0,
	                        TotalRevenue : 0,
	                        TotalCost : 0,
	                        TotalGP : 0,
	                        TotalGPP : 0
	                    }),

	                    currentCustomerBalances = new sap.ui.model.json.JSONModel(
	                            {
	                                Balance : 0,
	                                OverdueAmt : 0,
	                                CreditLimit : 0,
	                                AvailableCredit : 0,
	                                YTDSales : 0,
	                            }),

	                    currentTexts = new sap.ui.model.json.JSONModel({
	                        Description : '',
	                        Notes : '',
	                    }),
	                    
	                    currentVia = new sap.ui.model.json.JSONModel({ 
	                    	ID: '', 
	                    	Name: '', 
	                    	Street : 'XXXXX', 
	                    	City: '', 
	                    	State: '', 
	                    	Zip: '', 
	                    	Phone: ''
	                    }),
	                    

	                    globalSelectItems = new sap.ui.model.json.JSONModel({
		                    "customerPOTypes" : [{
		                        "Desc" : "",
		                        "Key" : ""
		                    }, {
		                        "Desc" : "EDI",
		                        "Key" : "DFUE"
		                    }, {
		                        "Desc" : "Oral",
		                        "Key" : "MUEN"
		                    }, {
		                        "Desc" : "Email",
		                        "Key" : "SCHR"
		                    }, {
		                        "Desc" : "Telephone",
		                        "Key" : "TELE"
		                    }],
		                    "ShippingConditions" : [],
		                    "Vendors" : [],
		                    "Manufacturers" : [],
		                    "MaterialsSet" : [],
	                    
	                    }),

	                    customerSelectItems = new sap.ui.model.json.JSONModel({
		                    "SalesAdmins" : [],
		                    "AccountManagers" : [],
		                    "ShipTos" : [],
		                    "BillTos" : [],
		                    "Payers" : [],
		                    "EndCustomers" : [],
	                    });

//	                    $.sap.log.setLevel($.sap.log.Level.TRACE);
//	                    $.sap.log.setLevel($.sap.log.Level.INFO);
//	                    $.sap.log.setLevel($.sap.log.Level.WARNING);
	                    	                    
	                    globalSelectItems.setDefaultBindingMode("OneWay");
	                    customerSelectItems.setDefaultBindingMode("OneWay");

	                    model = new sap.ui.model.odata.ODataModel(serviceUrl, {
	                        json : true,
	                        loadMetadataAsync : false
	                    });

						model.forceNoCache(true);
	                   
	                    jQuery.sap.includeStyleSheet(printCSSUrl);
	                    jQuery.sap.includeStyleSheet(mainCSSUrl);

	                    sap.ui.core.UIComponent.prototype.init.apply(this,
	                            arguments);

	                    //** set models
	                    core.setModel(i18nModel, "i18n");
						core.setModel(rejectionReasons, "rejectionReasons");
	                    core.setModel(myCustomers, "myCustomers");
	                    core.setModel(allCustomers, "allCustomers");
	                    core.setModel(currentCustomer, "currentCustomer");
						core.setModel(openQuotes, "openQuotes");
						core.setModel(completedQuotes, "completedQuotes");
	                    core.setModel(closedQuotes, "closedQuotes");
						core.setModel(rejectedSalesOrders, "rejectedSalesOrders");
						core.setModel(pendingSalesOrders, "pendingSalesOrders");
	                    core.setModel(openSalesOrders, "openSalesOrders");
	                    core.setModel(closedSalesOrders, "closedSalesOrders");
	                    core.setModel(systemInfo, "systemInfo");
	                    core.setModel(currentSalesDocumentAttachments,"currentSalesDocumentAttachments");
	                    core.setModel(currentCustomerBalances,"currentCustomerBalances");
	                    core.setModel(currentTexts, "currentTexts");
	                    core.setModel(currentVia, "currentVia");
	                    core.setModel(currentSalesDocument,"currentSalesDocument");
	                    core.setModel(currentSalesDocumentLines,"currentSalesDocumentLines");
	                    core.setModel(currentCopySalesDocumentLines,"currentCopySalesDocumentLines");
	                    core.setModel(currentAttachments, "currentAttachments");
	                    core.setModel(copies, "copies");
	                    core.setModel(currentState, "currentState");
	                    core.setModel(currentTotals, "currentTotals");
	                    core.setModel(globalSelectItems, "globalSelectItems");
	                    core.setModel(customerSelectItems, "customerSelectItems");
	                    core.setModel(blankDetailLine, "blankDetailLine");
	                    core.setModel(documentFlow, "documentFlow");
	                    model.setDefaultBindingMode("TwoWay");
	                    core.setModel(model);
	                    deviceModel.setDefaultBindingMode("OneWay");
	                    core.setModel(deviceModel, "device");
	                    
	                    $.when(gdt.salesui.data.Preloader.init(model)).done(function() {
	                    	that._oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(
	                            that.getRouter());
	                    	that.getRouter().initialize();
	                    }).fail(function() {
	                    	sap.m.MessageToast.show("Failed to preload data...app could not start");
	                    });
	                    
                    },

                    createContent : function() {

	                    var view = sap.ui.view({
		                        id : "app",
		                        viewName : "gdt.salesui.view.App",
		                        type : sap.ui.core.mvc.ViewType.XML,
		                        viewData : {
			                        component : this
		                        },
		                    }),
		                    splitApp = view.byId('fioriContent'),
		                    initialDetail = splitApp.getDetailPages()[0];

	                    splitApp.setInitialDetail(initialDetail);
	                    return view;
                    }
                });
