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
	                    
	                    soAvailableQty = new sap.ui.model.json.JSONModel([]),
	                    
	                    variantColumns = new sap.ui.model.json.JSONModel([]);
	                    
	                    lineItemVariant = new sap.ui.model.json.JSONModel([
	                        {
	                        text:"Accounts by Name",
	                        key:"ABN",
	                        global:true,
	                        readOnly:true,
	                        lifecyclePackage: "",
	                        accessOptions:"R"	                        
	                        },
	                        {
		                     text:"Accounts by ID",
		                     key:"ABI",
		                     global:true,
		                     readOnly:false,
		                     lifecyclePackage: "",
		                     accessOptions:"RWD"	                        
		                     },
		                    {
			                text:"My Global Variant",
			                key:"MGV",
			                global:true,
			                readOnly:false,
			                lifecyclePackage: "",
			                accessOptions:"RWD"	                        
			                },
			                {
				            text:"My Better Variant",
				            key:"MBV",
				            global:true,
				            readOnly:false,
				            lifecyclePackage: "",
				            accessOptions:"RWD"	                        
				            }	                        
	                           ]),
	                    
	                    variantFields = new sap.ui.model.json.JSONModel([]);         
	                    layoutFields = new sap.ui.model.json.JSONModel([
	                        {
	                        
	                        fieldText:'Selected',	                       
	                        fieldName:'Selection',
	                        fieldKey:'SELECTIONID',
	                        visibility:true,updown: 0,
	                        order:1
	                        },
	                        {
	                        fieldText:'Status',
		                    fieldName:'Status',
		                    fieldKey:'STATUS', 
		                    visibility:true,updown: 0,
		                    order:2
		                    },
	                        {
			                fieldText:'Notes',
				            fieldName:'HasNotesFlag',
				            fieldKey:'NOTES', 
				            visibility:true,updown: 0,
				            order:3
				            },
	                        {
				            fieldText:'Line',
					        fieldName:'StructuredLineID',
					        fieldKey:'LINE', 
					        visibility:true,updown: 0,
					        order:4
					        },
	                        {
					        fieldText:'Ref Ln',
						    fieldName:'CustomerPOLineID',
						    fieldKey:'REFLN', 
						    visibility:true,updown: 0,
						    order:5
						    },
	                        {
						    fieldText:'PO Ln',
							fieldName:'CustomerPOLineID',
							fieldKey:'POLN', 
							visibility:true,updown: 0,
							order:6
							},						    
							{
							fieldText:'Qty',
							fieldName:'QTY',
							fieldKey:'QTY', 
							visibility:true,updown: 0,
							order:7
							},
							{
							fieldText:'Ordered',
							fieldName:'QtyOrdered',
							fieldKey:'ORDERED', 
							visibility:true,updown: 0,
							order:8
							},							
							{
							fieldText:'Received',
							fieldName:'QtyReceived',
							fieldKey:'RECEIVED', 
							visibility:true,updown: 0,
							order:9
							 },	
							{
							fieldText:'Shipped',
							fieldName:'QtyShipped',
							fieldKey:'SHIPPED', 
							visibility:true,updown: 0,
							order:10
							},							 
							{
							fieldText:'Billed',
							fieldName:'QtyBilled',
							fieldKey:'BILLED', 
							visibility:true,updown: 0,
							order:11
							},								 
							{
							fieldText:'Manufacturer',
							fieldName:'ManufacturerID',
							fieldKey:'MFR', 
							visibility:true,updown: 0,
							order:12
							},
							{
							fieldText:'Part # Requested',
							fieldName:'CustomerPartID',
							fieldKey:'PARTNO', 
							visibility:true,updown: 0,
							order:13
							},							
							
							{
							fieldText:'Description',
							fieldName:'Description',
							fieldKey:'DESCRIPTION', 
							visibility:true,updown: 0,
							order:14
							},							
							{
							fieldText:'Vendor',
							fieldName:'VendorID',
							fieldKey:'VENDOR', 
							visibility:true,updown: 0,
							order:15
							},							
							{
							fieldText:'List Price',
							fieldName:'ListPrice',
							fieldKey:'LISTPRICE', 
							visibility:true,updown: 0,
							order:16
							},							
							{
							fieldText:'GDT Disc. %',
							fieldName:'GDTDiscountPercent',
							fieldKey:'GDTDISCOUNTPERCENT', 
							visibility:true,updown: 0,
							order:17
							},							
							{
							fieldText:'Unit Cost',
							fieldName:'UnitCost',
							fieldKey:'UNITCOST', 
							visibility:true,updown: 0,
							order:18
							},							
							{
							fieldText:'Ext. Cost',
							fieldName:'ExtendedCost',
							fieldKey:'EXTENDEDCOST', 
							visibility:true,updown: 0,
							order:19
							},
							{
							fieldText:'Cust. Disc. %',
							fieldName:'CustomerDiscountPercent',
							fieldKey:'CUSTOMERDISCOUNT', 
							visibility:true,updown: 0,
							order:20
							},							
							{
							fieldText:'Unit Price',
							fieldName:'UnitPrice',
							fieldKey:'UNITPRICE', 
							visibility:true,updown: 0,
							order:21
							},								
							{
							fieldText:'Ext. Price',
							fieldName:'ExtendedPrice',
							fieldKey:'EXTPRICE', 
							visibility:true,updown: 0,
							order:22
							},								
							{
							fieldText:'GP',
							fieldName:'GrossProfit',
							fieldKey:'GP', 
							visibility:true,updown: 0,
							order:23
							},							
							{
							fieldText:'GP %',
							fieldName:'GrossProfitPercentage',
							fieldKey:'GP_PERCENT', 
							visibility:true,updown: 0,
							order:24
							},
							{
							fieldText:'Stage',
							fieldName:'ItemCategory',
							fieldKey:'STAGE', 
							visibility:true,updown: 0,
							order:25
							},
							{
							fieldText:'D/S',
							fieldName:'ItemCategory',
							fieldKey:'DROPSHIP', 
							visibility:true,updown: 0,
							order:26
							},	
							{
							fieldText:'Ship To',
							fieldName:'ShipToID',
							fieldKey:'SHIPTO', 
							visibility:true,updown: 0,
							order:27
							},							
							{
							fieldText:'Via',
							fieldName:'',
							fieldKey:'VIA', 
							visibility:true,updown: 0,
							order:28
							},							
							{
							fieldText:'Ship ATTN',
							fieldName:'ShipToAttn',
							fieldKey:'SHIPTOATTN', 
							visibility:true,updown: 0,
							order:29
							},								
							{
							fieldText:'Deal ID',
							fieldName:'DealID',
							fieldKey:'DEALID', 
							visibility:true,updown: 0,
							order:30
							},							
							{
							fieldText:'Cust. PO',
							fieldName:'CustomerPOID',
							fieldKey:'CUSTPO', 
							visibility:true,updown: 0,
							order:31
							},							
							{
							fieldText:'Del. Date',
							fieldName:'DeliveryDate',
							fieldKey:'DELIVERYDATE', 
							visibility:true,updown: 0,
							order:32
							},							
							{
							fieldText:'CCW Quote #',
							fieldName:'ExternalQuoteID',
							fieldKey:'CCWQUOTE', 
							visibility:true,updown: 0,
							order:33
							},							
							{
							fieldText:'Line Type',
							fieldName:'SmartNetLineType',
							fieldKey:'LINETYPE',
							visibility:true,updown: 0,
							order:34
							},
							{
							fieldText:'SmartNet Part Covered',
							fieldName:'SmartNetCoveredMaterial',
							fieldKey:'SMARTNETPART',
							visibility:true,updown: 0,
							order:35
							},							
							{
							fieldText:'SmartNet S/N',
						    fieldName:'SmartNetCoveredSerialNumber',
						    fieldKey:'SMARTNETSERIAL',
							visibility:true,updown: 0,
							order:36
							},							
							{
							fieldText:'SmartNet Old S/N',
							fieldName:'SmartNetReplacedSerialNumber',
							fieldKey:'SMARTNETOLDSERIAL',
							visibility:true,updown: 0,
							order:37
							},
							{
							fieldText:'SMART Account',
							fieldName:'SMARTAcctNo',
							fieldKey:'SMARTAC',
							visibility:true,updown: 0,
						    order:38
							},								
							{
							fieldText:'SMARTNET Contract #',
							fieldName:'SmartNetContractNumber',
							fieldKey:'SMARTNETCN',
							visibility:true,updown: 0,
							order:39
							},
							{
							fieldText:'Service Level',
					        fieldName:'SmartNetServiceLevel',
							fieldKey:'SERVICELEVEL',
							visibility:true,updown: 0,
							order:40
							},
							{
							fieldText:'Service Level Description',
						    fieldName:'SmartNetServiceLevelDescription',
							fieldKey:'SERVICELEVELDESCRIPT',
							visibility:true,updown: 0,
							order:41
							},							
							{
							fieldText:'Begin Date',
						    fieldName:'SmartNetBeginDate',
							fieldKey:'BEGINDATE',
							visibility:true,updown: 0,
							order:42
							},							
							{
							fieldText:'End Date',
							fieldName:'SmartNetEndDate',
							fieldKey:'ENDDATE',
							visibility:true,updown: 0,
							order:43
							},							
							{
							fieldText:'Duration',
							fieldName:'SmartNetDuration',
							fieldKey:'DURATION',
							visibility:true,updown: 0,
							order:44
							},								
							{
							fieldText:'WBS Element',
							fieldName:'WBSElement',
							fieldKey:'WBSELEMENT',
							visibility:true,updown: 0,
							order:45
							},								
							{
							fieldText:'Cust Vend Contract #',
							fieldName:'CustomerContractWithVendor',
							fieldKey:'CUSTVENDCONTRACT',
							visibility:true,updown: 0,
							order:46
							},
							{
							fieldText:'Created By',
							fieldName:'CreatedBy',
							fieldKey:'CREATEDBY',
							visibility:true,updown: 0,
							order:47
							},							
							{
							fieldText:'Created On',
							fieldName:'CreatedOn',
							fieldKey:'CREATEDON',
							visibility:true,updown: 0,
							order:48
							},							
							{
							fieldText:'Updated By',
							fieldName:'UpdatedBy',
							fieldKey:'UPDATEDBY',
							visibility:true,updown: 0,
							order:49
							},							
							{
							fieldText:'Updated On',
							fieldName:'UpdatedOn',
							fieldKey:'UPDATEDON',
							visibility:true,updown: 0,
							order:50
								}								
							
	                        ]),      
	                           
	                           
	                    currentState = new sap.ui.model.json.JSONModel({
	                        isEditMode : false,
	                        isNotEditMode : true,
	                        isQuote : false,
	                        isSalesOrder : false,
	                        isPendingSalesOrder : false,
	                        isSubmittedSalesOrder : false,
	                        isAttachmentsNeedSave:false,
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
	                    core.setModel(soAvailableQty, "soAvailableQty");	                    
	                    core.setModel(lineItemVariant,"lineItemVariant"); 
	                    core.setModel(layoutFields,"layoutFields");
	                    core.setModel(variantFields,"variantFields");
	                    core.setModel(variantColumns,'variantColumns');
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
