$.sap.require("gdt.salesui.util.Formatter");
$.sap.require("gdt.salesui.data.DataLoader");
$.sap.require("gdt.salesui.data.DataContext");
$.sap.require("gdt.salesui.util.Controller");
$.sap.require("gdt.salesui.util.Sharepoint");

$.sap.require("sap.m.MessageBox");

gdt.salesui.util.Controller
        .extend(
                "gdt.salesui.controller.Master", function($, core, datacontext, loader, sharepoint)
                {
                	var view = {},
                		page = null,
                		splitApp = null,
                	                	
                    onInit = function() {
                    	var model = core.getModel(),
	                    	closedQuotesList =  null,
							openQuotesList = null,
							completedQuotesList = null,
							rejectedSalesOrdersList = null,
							pendingSalesOrdersList = null,
	                    	openSalesOrdersList = null,
	                    	closedSalesOrdersList = null,
	                    	componentId = null,
	                    	eventBus = null;
                		
	                    view = this.getView();
                    	page = view.byId('masterpage');
                		splitApp = sap.ui.getCore().byId("app").byId('fioriContent');
                    	closedQuotesList = view.byId('closedQuotesList');
						openQuotesList = view.byId('openQuotesList');
						completedQuotesList = view.byId('completedQuotesList');
						rejectedSalesOrdersList = view.byId('rejectedSalesOrdersList');
						pendingSalesOrdersList = view.byId('pendingSalesOrdersList');
                    	openSalesOrdersList = view.byId('openSalesOrdersList');
                    	closedSalesOrdersList = view.byId('closedSalesOrdersList');
                    	componentId = sap.ui.core.Component.getOwnerIdFor(view);
	                    eventBus = sap.ui.component(componentId).getEventBus();
	                    
                		page.setModel(core.getModel('i18n'),'i18n');
                		page.setModel(core.getModel('device'),'device');
                		page.setModel(core.getModel('currentCustomer'));
                		page.setModel(core.getModel('currentCustomerBalances'),'currentCustomerBalances');
                		page.setModel(core.getModel('globalSelectItems'),'globalSelectItems');
                		page.setModel(core.getModel('customerSelectItems'),'customerSelectItems');
						page.setModel(core.getModel('systemInfo'),'systemInfo');
                		closedQuotesList.setModel(core.getModel('closedQuotes'),'closedQuotes');
						openQuotesList.setModel(core.getModel('openQuotes'),'openQuotes');
						completedQuotesList.setModel(core.getModel('completedQuotes'),'completedQuotes');
						rejectedSalesOrdersList.setModel(core.getModel('rejectedSalesOrders'),'rejectedSalesOrders');
						pendingSalesOrdersList.setModel(core.getModel('pendingSalesOrders'),'pendingSalesOrders');
                		openSalesOrdersList.setModel(core.getModel('openSalesOrders'),'openSalesOrders');
                		closedSalesOrdersList.setModel(core.getModel('closedSalesOrders'),'closedSalesOrders');

	                    view.addStyleClass("sapUiSizeCompact");
	                    
                    	eventBus.subscribe('master', 'salesDocAltered',  function(channelId, eventId, data){
                    		var results = [];
                    		
                        	page.setBusyIndicatorDelay(0);
                            page.setBusy(true);

                            setTimeout(function () {
    	        				results = _.sortBy(datacontext.salesdocuments.getLocalByForeignKey(data.CustomerID), function (line) { return parseInt(line.SalesDocumentID) * -1;});
                            	core.getModel('closedQuotes').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'B' && sd.ValidTo < new Date() && sd.Status != 'C');}));
								core.getModel('openQuotes').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'B' && sd.ValidTo >= new Date() && sd.Status != 'C');}));
								core.getModel('completedQuotes').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'B'  && sd.Status == 'C');}));
								core.getModel('rejectedSalesOrders').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.RejectionStatus != 'A' && sd.SalesOrderStatus != 'E0002');}));
								core.getModel('pendingSalesOrders').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.SalesOrderStatus != 'E0002' && sd.RejectionStatus == 'A');}));
								core.getModel('openSalesOrders').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.SalesOrderStatus == 'E0002' && sd.Status != 'C' && sd.RejectionStatus !='C');}));
								core.getModel('closedSalesOrders').setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.SalesOrderStatus == 'E0002' && (sd.Status == 'C' || sd.RejectionStatus == 'C'));}));
                                page.setBusy(false);
                            });                    	
                    	});
	                    
	                    sap.ui.core.UIComponent
	                            .getRouterFor(this)
	                            .attachRouteMatched(
	                                    function(event) {
		                                    if (event.getParameter("name") === "master") {
			                                    var args = event.getParameter("arguments"),
			                                    	customerId = core.getModel('currentCustomer').getProperty('/CustomerID');
		                                    	
			                                    
			                                    if (!customerId || (customerId != args.customerId) || arguments.refresh) {
			                                    	page.setBusyIndicatorDelay(0);
			                                        page.setBusy(true);

			                                        setTimeout(function () {
			                                        	loader.loadCustomerInfo(args.customerId).done(function() {
			                	                        		_updateCurrentState();
			                        	                    	page.setBusy(false);
																if (core.getModel('customerSelectItems').getProperty('/AccountManagers').length == 0) {
																	sap.m.MessageBox.show('Customer has no assigned Account Manager(s).  Please contact Master Data to resolve this issue before proceeding.',
																		{
																			icon : sap.m.MessageBox.Icon.ERROR,
																			title : 'Customer Master Data Error',
																			onClose : function() {
																				_leaveCustomer();
																			}
																		});
																} else {
																	if (!args.salesDocId) {
																		splitApp.showMaster();
																	} else {
																		splitApp.hideMaster();
																	}
																}
			                                            	}).fail(function (response) {
			                	                            	page.setBusy(false);
			                	    	                    	sap.m.MessageToast.show("Failed to load customer details.  " + response);
			                	    	                    	_leaveCustomer();
			                                            	});
			                                        });                    	
				            					}
		                                    }
	                                    }, this);
                    },
                    
                    _updateCurrentState = function() {
                    	var core = sap.ui.getCore(),
                    		currentState = core.getModel('currentState'),
                    		customerSelectItems = core.getModel('customerSelectItems'),
                    		endcustomers = customerSelectItems.getProperty('/EndCustomers');
                    	
                    	endCustomerCount =(!!endcustomers) ? endcustomers.length : 0;
                        currentState.setProperty('/hasEndCustomers',endCustomerCount != 0);                    	
                    },

        			_toggleCustomersCollapse = function (event, list) {
        				var source = event.getSource();
        				
        				if (source.getIcon() === "sap-icon://collapse-group") {
        					source.setIcon("sap-icon://expand-group");
        					list.setVisible(false);
        				} else {
        					source.setIcon("sap-icon://collapse-group");
        					list.setVisible(true);
        				}

        			},

					handleToggleOpenQuotesCollapse = function (event) {
						_toggleCustomersCollapse(event, this.getView().byId('openQuotesList'));
					},

					handleToggleCompletedQuotesCollapse = function (event) {
						_toggleCustomersCollapse(event, this.getView().byId('completedQuotesList'));
					},

					handleToggleClosedQuotesCollapse = function (event) {
        				_toggleCustomersCollapse(event, this.getView().byId('closedQuotesList'));
        			},

					handleToggleRejectedSalesOrdersCollapse = function (event) {
						_toggleCustomersCollapse(event, this.getView().byId('rejectedSalesOrdersList'));
					},

					handleTogglePendingSalesOrdersCollapse = function (event) {
						_toggleCustomersCollapse(event, this.getView().byId('pendingSalesOrdersList'));
					},

					handleToggleOpenSalesOrdersCollapse = function (event) {
        				_toggleCustomersCollapse(event, this.getView().byId('openSalesOrdersList'));
        			},

        			handleToggleClosedSalesOrdersCollapse = function (event) {
        				_toggleCustomersCollapse(event, this.getView().byId('closedSalesOrdersList'));
					},
					_setFilter = function(filter) {
						var listOpenQuotes = view.byId("openQuotesList"),
							bindingOpenQuotes = listOpenQuotes.getBinding("items"),
							listCompletedQuotes = view.byId("completedQuotesList"),
							bindingCompletedQuotes = listCompletedQuotes.getBinding("items"),
							listClosedQuotes = view.byId("closedQuotesList"),
							bindingClosedQuotes = listClosedQuotes.getBinding("items"),
							listRejectedSalesOrders = view.byId("rejectedSalesOrdersList"),
							bindingRejectedSalesOrders = listRejectedSalesOrders.getBinding("items"),
							listPendingSalesOrders = view.byId("pendingSalesOrdersList"),
							bindingPendingSalesOrders = listPendingSalesOrders.getBinding("items"),
							listOpenSalesOrders = view.byId("openSalesOrdersList"),
							bindingOpenSalesOrders = listOpenSalesOrders.getBinding("items"),
							listClosedSalesOrders = view.byId("closedSalesOrdersList"),
							bindingClosedSalesOrders = listClosedSalesOrders.getBinding("items");

						bindingOpenQuotes.filter(filter);
						bindingCompletedQuotes.filter(filter);
						bindingClosedQuotes.filter(filter);
						bindingRejectedSalesOrders.filter(filter);
						bindingPendingSalesOrders.filter(filter);
						bindingOpenSalesOrders.filter(filter);
						bindingClosedSalesOrders.filter(filter);

					},

                    handleSearch = function(event) {
        				var filters = null,
	        				filter = null,
	        				searchString = this.getView().byId("searchField").getValue(),
							listOpenQuotes = this.getView().byId("openQuotesList"),
							buttonOpenQuotes = this.getView().byId("openQuotesToggle"),
							listCompletedQuotes = this.getView().byId("completedQuotesList"),
							buttonCompletedQuotes = this.getView().byId("completedQuotesToggle"),
							listClosedQuotes = this.getView().byId("closedQuotesList"),
							buttonClosedQuotes = this.getView().byId("closedQuotesToggle"),
							listRejectedSalesOrders = this.getView().byId("rejectedSalesOrdersList"),
							buttonRejectedSalesOrders = this.getView().byId("rejectedSalesOrdersToggle"),
							listPendingSalesOrders = this.getView().byId("pendingSalesOrdersList"),
							buttonPendingSalesOrders = this.getView().byId("pendingSalesOrdersToggle"),
							listOpenSalesOrders = this.getView().byId("openSalesOrdersList"),
							buttonOpenSalesOrders = this.getView().byId("openSalesOrdersToggle"),
							listClosedSalesOrders = this.getView().byId("closedSalesOrdersList"),
							buttonClosedSalesOrders = this.getView().byId("closedSalesOrdersToggle");

                        if (event.getParameter('refreshButtonPressed')) {
                        	loader.loadCustomerInfo(core.getModel('currentCustomer').getProperty('/CustomerID'), true).done(function() {
                        		_updateCurrentState();
    	                    	page.setBusy(false);
                        	}).fail(function (response) {
                            	page.setBusy(false);
    	                    	sap.m.MessageToast.show("Failed to load customer details.  " + response);
    	                    	_leaveCustomer();
                        	});
                        	return;
                        }
                        
        				if (searchString && searchString.length > 0) {
        					filters = [ new sap.ui.model.Filter("HeaderText", sap.ui.model.FilterOperator.Contains, searchString), 
        					            new sap.ui.model.Filter("SalesDocumentID", sap.ui.model.FilterOperator.Contains, searchString),
				            			new sap.ui.model.Filter("ReferencedBy", sap.ui.model.FilterOperator.Contains, searchString) ];
        					
        					filter = new sap.ui.model.Filter(filters,false);
        					buttonClosedQuotes.setIcon("sap-icon://collapse-group");
        					listClosedQuotes.setVisible(true);
							buttonOpenQuotes.setIcon("sap-icon://collapse-group");
							listOpenQuotes.setVisible(true);
							buttonCompletedQuotes.setIcon("sap-icon://collapse-group");
							listCompletedQuotes.setVisible(true);
							buttonRejectedSalesOrders.setIcon("sap-icon://collapse-group");
							listRejectedSalesOrders.setVisible(true);
							buttonPendingSalesOrders.setIcon("sap-icon://collapse-group");
							listPendingSalesOrders.setVisible(true);
        					buttonOpenSalesOrders.setIcon("sap-icon://collapse-group");
        					listOpenSalesOrders.setVisible(true);
        					buttonClosedSalesOrders.setIcon("sap-icon://collapse-group");
        					listClosedSalesOrders.setVisible(true);
        				}
        			
        				_setFilter(filter);
        			},

                    handleSelect = function(event) {
	                    var listItem = event.getSource(), 
	                    	customerId = core.getModel('currentCustomer').getProperty('/CustomerID'),
	                    	salesDocId = listItem.getBinding('title').getValue();
	                    
	                    if (core.getModel("currentState").getProperty("/isEditMode")) {
                    		sap.m.MessageBox.confirm("Changing Sales Document while in Edit Mode will lose any unsaved changes.  Are you sure you wish to leave this document?", 
                   				 	function(confirmation) {
                   			 			if (confirmation == 'OK') {
	               			 				core.getModel("currentState").setProperty('/forceRefresh', true);
	               			 				core.getModel("currentState").setProperty('/isEditMode', false);
	               			 				core.getModel("currentState").setProperty('/isNotEditMode', true);
                	                		event.preventDefault();
                		                    _goToSalesDocument(customerId, salesDocId);
                   			 			} else {
                	                       	sap.m.MessageToast.show("Navigation canceled.");
                	                    	return false;
                   			 			}
                   			 			
                   		 			},
                   		 			"Confirm Cancel Edit");
	                    } else {
		                    _goToSalesDocument(customerId, salesDocId);
	                       	event.preventDefault();
	                    }
                    },
                    
                    _goToSalesDocument = function (customerId, salesDocId) {
                    	var currentDocId = core.getModel('currentSalesDocument').getProperty('/SalesDocumentID');
                    	
                    	if (!!currentDocId && currentDocId == salesDocId && parseInt(currentDocId) != 0) {
	                       	sap.m.MessageToast.show("Requested document already loaded.  Navigation canceled.");
                    		return;
                    	}
                    	
	                    view.byId("searchField").setValue('');
						_setFilter(null);
	                    sap.ui.core.UIComponent.getRouterFor(view).navTo(
	                            "detail", {
	                                from : "master",
	                                tab : "lineItems",
	                                customerId : customerId,
	                                salesDocId : salesDocId
	                            });
                    },
                    
                    handleNavButtonPress = function(event) {
	                    var core = sap.ui.getCore();


	                    if (core.getModel("currentState").getProperty("/isEditMode")) {
                    		sap.m.MessageBox.confirm("Changing customer while in Edit Mode will lose any unsaved changes.  Are you sure you wish to leave this customer?", 
                   				 	function(confirmation) {
                   			 			if (confirmation == 'OK') {
                   			 				core.getModel("currentSalesDocument").setData({});
                   			 				core.getModel("currentSalesDocumentLines").setData([]);
	               			 				core.getModel("currentState").setProperty('/isEditMode', false);
	               			 				core.getModel("currentState").setProperty('/isNotEditMode', true);
                	                		event.preventDefault();
                		                    _leaveCustomer();
                   			 			} else {
                	                       	sap.m.MessageToast.show("Navigation canceled.");
                	                    	return false;
                   			 			}
                   			 			
                   		 			},
                   		 			"Confirm Cancel Edit");
	                    } else {
	                		event.preventDefault();
		                    _leaveCustomer();
	                    }
	                    
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
								loader.loadSalesDocument(_pad(docid,10)).done(function(data) {
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
									loader.loadSalesDocument(_pad(docid,10)).done(function(data) {
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

                    _leaveCustomer = function() {
                		core.getModel('currentSalesDocument').setData({});
                		core.getModel('currentSalesDocumentLines').setData([]);
                		core.getModel('currentCustomer').setData({});
                		core.getModel('currentCustomerBalances').setData({});
                		core.getModel('customerSelectItems').setData({});
                		core.getModel('closedQuotes').setData([]);
						core.getModel('openQuotes').setData([]);
						core.getModel('completedQuotes').setData([]);
						core.getModel('rejectedSalesOrders').setData([]);
						core.getModel('pendingSalesOrders').setData([]);
                		core.getModel('openSalesOrders').setData([]);
                		core.getModel('closedSalesOrders').setData([]);
                		
	        			view.byId("searchField").setValue('');
						_setFilter(null);

	        			splitApp.toDetail(splitApp.getInitialDetail());
            			setTimeout(function() {
            					sap.ui.core.UIComponent.getRouterFor(view).navTo("customer", {}, true);
            				}, 1000);
                    },

                    handleDetailTabChanged = function(chanel, event, data) {
	                    tab = data.tabKey;
                    },
                    
                    
                    // Create New Quote
                    handleCreateNewQuote = function(event) {
		                    var customerId = core.getModel('currentCustomer').getProperty('/CustomerID'),
		                    	salesDocId = '0000000000';
                    
		                if (core.getModel('currentSalesDocument').getProperty('/SalesDocumentID') == salesDocId) {
	                       	sap.m.MessageToast.show("You cannot create a new document, you already are!  If you wish to start a new quote, please exit this one first.");
	                    	return false;
		                }
		                
	                    if (core.getModel("currentState").getProperty("/isEditMode")) {
	                		sap.m.MessageBox.confirm("Creating a new Sales Document while in Edit Mode will lose any unsaved changes.  Are you sure you wish to leave this document?", 
	               				 	function(confirmation) {
	               			 			if (confirmation == 'OK') {
	               			 				core.getModel("currentState").setProperty('/forceRefresh', true);
	               			 				core.getModel("currentState").setProperty('/isEditMode', false);
	               			 				core.getModel("currentState").setProperty('/isNotEditMode', true);
	            	                		event.preventDefault();
	            		                    _goToSalesDocument(customerId, salesDocId);
	               			 			} else {
	            	                       	sap.m.MessageToast.show("Navigation canceled.");
	            	                    	return false;
	               			 			}
	               			 			
	               		 			},
	               		 			"Confirm Cancel Edit");
	                    } else {
	                    	_goToSalesDocument(customerId, salesDocId);
	                       	event.preventDefault();
	                    }
					},
					_pad = function (n, width, z) {
						var 	paddingChar = z || '0',
							stringToPad = n + '';
						return stringToPad.length >= width ? stringToPad : new Array(width - stringToPad.length + 1).join(paddingChar) + stringToPad;
					};

                    
                    return {
                    	onInit : onInit,
                    	handleSearch : handleSearch,
                    	handleSelect : handleSelect,
                    	handleNavButtonPress : handleNavButtonPress,
                    	handleDetailTabChanged : handleDetailTabChanged,
                    	handleCreateNewQuote : handleCreateNewQuote,
						handleToggleOpenQuotesCollapse : handleToggleOpenQuotesCollapse,
						handleToggleCompletedQuotesCollapse : handleToggleCompletedQuotesCollapse,
                    	handleToggleClosedQuotesCollapse : handleToggleClosedQuotesCollapse,
						handleToggleRejectedSalesOrdersCollapse : handleToggleRejectedSalesOrdersCollapse,
						handleTogglePendingSalesOrdersCollapse : handleTogglePendingSalesOrdersCollapse,
                    	handleToggleOpenSalesOrdersCollapse : handleToggleOpenSalesOrdersCollapse,
                    	handleToggleClosedSalesOrdersCollapse : handleToggleClosedSalesOrdersCollapse,
						handleFindByDocumentID : handleFindByDocumentID,
                    };
                    

                }($, sap.ui.getCore(), gdt.salesui.data.DataContext, gdt.salesui.data.DataLoader, gdt.salesui.util.Sharepoint));
