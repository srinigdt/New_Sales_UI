$.sap.require("gdt.salesui.util.Formatter");
$.sap.require("gdt.salesui.util.Controller");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.data.DataLoader");

gdt.salesui.util.Controller.extend("gdt.salesui.controller.Customer", function($, core, _, dataLoader) {
	//var myPref;
	var onInit = function () {
 			var splitApp = null,
 				view= this.getView(),
 	 			page = view.byId('page'), 
 				core = sap.ui.getCore();				
		
            view.addStyleClass("sapUiSizeCompact");

            sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(function(event) {
				// when detail navigation occurs, update the binding context
				if (event.getParameter("name") === "customer") {
            		page.setModel(core.getModel('i18n'),'i18n');
					page.setModel(core.getModel('device'),'device');
					page.setModel(core.getModel('systemInfo'),'systemInfo');
					view.byId('myCustomerList').setModel(core.getModel('myCustomers'));
					view.byId('allCustomerList').setModel(core.getModel('allCustomers'));
					//myPref = getUserPreferences();
					//applyFavorites();
					splitApp = sap.ui.getCore().byId("app").byId('fioriContent');
                    splitApp.showMaster();
				}
			}, this);
		 },
		//getUserPreferences= function(){return {favoriteCustomers: []}},
		handleSearch = function (event) {
			var filters = null,
				filter = null,
				searchString = this.getView().byId("searchField").getValue(),
				listMy = this.getView().byId("myCustomerList"),
				bindingMy = listMy.getBinding("items"),
				listAll = this.getView().byId("allCustomerList"),
				bindingAll = listAll.getBinding("items");
		
			if (searchString && searchString.length > 0) {
				filters = [ new sap.ui.model.Filter("CustomerName", sap.ui.model.FilterOperator.Contains, searchString), 
				            new sap.ui.model.Filter("CustomerID", sap.ui.model.FilterOperator.Contains, searchString),
				            new sap.ui.model.Filter("Street", sap.ui.model.FilterOperator.Contains, searchString),
				            new sap.ui.model.Filter("State", sap.ui.model.FilterOperator.Contains, searchString),
	            			new sap.ui.model.Filter("Zip", sap.ui.model.FilterOperator.Contains, searchString) ];

				filter = new sap.ui.model.Filter(filters,false);
			}
			bindingMy.filter(filter);
			bindingAll.filter(filter);
		},
		
		toggleCustomersCollapse = function (event, list) {
			var source = event.getSource();
			
			if (source.getIcon() === "sap-icon://collapse-group") {
				source.setIcon("sap-icon://expand-group");
				list.setVisible(false);
			} else {
				source.setIcon("sap-icon://collapse-group");
				list.setVisible(true);
			}

		},
		
		handleToggleMyCustomersCollapse = function (event) {
			toggleCustomersCollapse(event, this.getView().byId('myCustomerList'));
		},

		handleToggleAllCustomersCollapse = function (event) {
			toggleCustomersCollapse(event, this.getView().byId('allCustomerList'));
		},
		
		handleFindByDocumentID = function(event) {
     		var dialog = this.getView().byId('customerSearchByDocIDDialog'),
	 			msg = this.getView().byId('Msg'),
	 			input = this.getView().byId('SalesDocID'),
	 			router = sap.ui.core.UIComponent.getRouterFor(this),
	 			handler = function(){
					var docid = input.getValue();

					input.setValue('');

	 				if (!docid) return;
						dataLoader.loadSalesDocument(_pad(docid,10)).done(function(data) {
							var salesDocument = core.getModel('currentSalesDocument').getData();
							core.getModel('currentState').setProperty('/forceRefresh', true);
							input.setValueState('None');
							dialog.close();

							router.navTo(
									"detail", {
										from : "master",
										tab : "lineItems",
										customerId : salesDocument.CustomerID,
										salesDocId : salesDocument.SalesDocumentID
									});
						}).fail(function () {
							var newID = _pad(docid,10);

							newID = newID.substring(3);
							newID = '002' + newID;
							dataLoader.loadSalesDocument(_pad(docid,10)).done(function(data) {
								var salesDocument = core.getModel('currentSalesDocument').getData();
								core.getModel('currentState').setProperty('/forceRefresh', true);
								input.setValueState('None');
								dialog.close();
								router.navTo(
										"detail", {
											from : "master",
											tab : "lineItems",
											customerId : salesDocument.CustomerID,
											salesDocId : salesDocument.SalesDocumentID
										});
							}).fail(function() {
								msg.setText('Sales Document Not Found');
								input.setValueState('Error');
							});
						});
	 			};
     		
			dialog.removeAllButtons();
			
			input.onChange = handler;
			
 			dialog.addStyleClass("sapUiSizeCompact");			            	                    
     		dialog.addButton(new sap.m.Button({text: "Search", enabled: true, press: handler})); 
     		dialog.addButton(new sap.m.Button({text: "Cancel", press:function(){
     				dialog.close();	
     			}}));
     		
     		dialog.open();
			input.focus();
		},

		handleSelectCustomer = function (event) {
			var listItem = event.getParameter("listItem") || event.getSource(),
				listMy = this.getView().byId("myCustomerList"),
				bindingMy = listMy.getBinding("items"),
				listAll = this.getView().byId("allCustomerList"),
				bindingAll = listAll.getBinding("items"),
				bindingContext = listItem.getBindingContext(),
				customerPath = bindingContext.getPath(),
				customerId = bindingContext.getModel().getObject(customerPath).CustomerID;
			
			core.getModel("currentSalesDocument").setData({});
	 		core.getModel("currentSalesDocumentLines").setData([]);
	 		
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master",
					{from: "customer",
					 customerId: customerId
					 });
			
			this.getView().byId("searchField").setValue('');
			bindingMy.filter(null);
			bindingAll.filter(null);

		},
		//handleFavorites = function(oEvent) {
         //   var titleClicked = oEvent.getSource().data("custID");
         //   var idx = myPref.favoriteCustomers.indexOf(titleClicked);
         //   if ( idx > -1){
         //       myPref.favoriteCustomers.splice(idx, 1);
         //   } else {
         //       myPref.favoriteCustomers.push(titleClicked);
         //   }
		//	applyFavorites(titleClicked);
        //},
		//applyFavorites = function(titleClicked){
		//	var idx, favCust = [], favClicked;
		//	if (titleClicked){
		//		core.getModel('allCustomers').getObject('/').findIndex(function(cust){
		//			if(cust.CustomerID == titleClicked) cust["favIcon"] = false;});};
		//	myPref.favoriteCustomers.forEach(function(fav){
		//		idx = core.getModel('allCustomers').getObject('/')
		//					.findIndex(function(cust){
		//						if(cust.CustomerID == fav) {
		//							cust["favIcon"] = true;
		//							favCust.push(cust);
		//							return cust;
		//						}
		//					});
		//	});
		//	core.getModel("myCustomers").setData(favCust);
		//	core.getModel("allCustomers").refresh(true);
		//},
        _pad = function (n, width, z) {
      	  var 	paddingChar = z || '0',
      	  		stringToPad = n + '';
      	  return stringToPad.length >= width ? stringToPad : new Array(width - stringToPad.length + 1).join(paddingChar) + stringToPad;
		};
	
	return {
		onInit : onInit,
		handleSearch : handleSearch,
		handleToggleMyCustomersCollapse : handleToggleMyCustomersCollapse,
		handleToggleAllCustomersCollapse : handleToggleAllCustomersCollapse,
		handleSelectCustomer : handleSelectCustomer,
		handleFindByDocumentID : handleFindByDocumentID,
		//handleFavorites: handleFavorites,
		//applyFavorites: applyFavorites
	};
		
}($, sap.ui.getCore(), _, gdt.salesui.data.DataLoader));