$.sap.declare("gdt.salesui.data.DataLoader");
$.sap.require("gdt.salesui.data.DataContext");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataLoader = (function($, core, _, datacontext, helper) {
	var _customerLoaded = null,
		loadCustomerInfo = function(customerId, forceRefresh) {
			var customerMainInfoDfr = $.Deferred(function(defer) {
					datacontext.customers.get(customerId, forceRefresh).done(function () {
	                	var customerInfo = core.getModel('currentCustomer'),
	                		data = datacontext.customers.getLocal(customerId);

	                	customerInfo.setData(data);
	                	defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				customerBalancesDfr = $.Deferred(function(defer) {
					datacontext.customerbalances.get(customerId, forceRefresh).done(function () {
	                	var customerBalances = core.getModel('currentCustomerBalances'),
	                		data = datacontext.customerbalances.getLocal(customerId);
	                	
                		customerBalances.setData(data);
                		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				salesDocsDfr = $.Deferred(function(defer) {
					datacontext.salesdocuments.getByForeignKey(customerId, forceRefresh).done(function () {
	                	var closedQuotes = core.getModel('closedQuotes'),
							openQuotes = core.getModel('openQuotes'),
							completedQuotes = core.getModel('completedQuotes'),
							rejectedSalesOrders = core.getModel('rejectedSalesOrders'),
							pendingSalesOrders = core.getModel('pendingSalesOrders'),
	        				openSalesOrders = core.getModel('openSalesOrders'),
	        				closedSalesOrders = core.getModel('closedSalesOrders'),
	        				results = _.sortBy(datacontext.salesdocuments.getLocalByForeignKey(customerId), function (line) { return parseInt(line.SalesDocumentID) * -1;});
	                	
	                	closedQuotes.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'B' && sd.ValidTo < new Date() && sd.Status != 'C');}));
						openQuotes.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'B' && sd.ValidTo >= new Date() && sd.Status == 'A');}));
						completedQuotes.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'B' && ( sd.Status == 'C' || sd.Status == 'B' ));}));
						rejectedSalesOrders.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.RejectionStatus != 'A' && sd.SalesOrderStatus != 'E0002');}));
						pendingSalesOrders.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.SalesOrderStatus != 'E0002' && sd.RejectionStatus == 'A');}));
						openSalesOrders.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.SalesOrderStatus == 'E0002' && sd.Status != 'C' && sd.RejectionStatus !='C');}));
						closedSalesOrders.setData(_.filter(results,function (sd) {return (sd.DocumentCategory == 'C' && sd.SalesOrderStatus == 'E0002' && (sd.Status == 'C' || sd.RejectionStatus == 'C'));}));
                		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				salesAdminsDfr = $.Deferred(function(defer) {
					datacontext.customersalesadmins.getByForeignKey(customerId, forceRefresh).done(function () {
                    	var customerSelectItems = core.getModel('customerSelectItems'),
                    		results = datacontext.customersalesadmins.getLocalByForeignKey(customerId);
                    	
                    	customerSelectItems.setProperty('/SalesAdmins', results);	                    	
                		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				accountManagersDfr = $.Deferred(function(defer) {
					datacontext.customeracctmgrs.getByForeignKey(customerId, forceRefresh).done(function () {
                    	var customerSelectItems = core.getModel('customerSelectItems'),
                    		results = datacontext.customeracctmgrs.getLocalByForeignKey(customerId);
                    	
                    	customerSelectItems.setProperty('/AccountManagers', results);
                		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				shipTosDfr = $.Deferred(function(defer) {
					datacontext.customershiptos.getByForeignKey(customerId, forceRefresh).done(function () {
                    	var customerSelectItems = core.getModel('customerSelectItems'),
                    		results = datacontext.customershiptos.getLocalByForeignKey(customerId),
                            defaultPartner = _.find(results, function(row) { return !!row.DefaultPartnerFlag; }),
                            defaultPartnerID = (!!defaultPartner) ? defaultPartner.PartnerID : customerId;

                    	customerSelectItems.setProperty('/ShipTos', results);
                        customerSelectItems.setProperty('/DefaultShipToID', defaultPartnerID);

	            		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				billTosDfr = $.Deferred(function(defer) {
					datacontext.customerbilltos.getByForeignKey(customerId, forceRefresh).done(function () {
                    	var customerSelectItems = core.getModel('customerSelectItems'),
                    		results = datacontext.customerbilltos.getLocalByForeignKey(customerId),
                            defaultPartner = _.find(results, function(row) { return !!row.DefaultPartnerFlag; }),
                            defaultPartnerID = (!!defaultPartner) ? defaultPartner.PartnerID : customerId;
                    	
                    	customerSelectItems.setProperty('/BillTos', results);
                        customerSelectItems.setProperty('/DefaultBillToID', defaultPartnerID);
                		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				payersDfr = $.Deferred(function(defer) {
					datacontext.customerpayers.getByForeignKey(customerId, forceRefresh).done(function () {
                    	var customerSelectItems = core.getModel('customerSelectItems'),
                    		results = datacontext.customerpayers.getLocalByForeignKey(customerId),
                            defaultPartner = _.find(results, function(row) { return !!row.DefaultPartnerFlag; }),
                            defaultPartnerID = (!!defaultPartner) ? defaultPartner.PartnerID : customerId;
                    	
                    	customerSelectItems.setProperty('/Payers', results);
                        customerSelectItems.setProperty('/DefaultPayerID', defaultPartnerID);
                		defer.resolve(results);
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				endCustomersDfr = $.Deferred(function(defer) {
					datacontext.customerendcustomers.getByForeignKey(customerId, forceRefresh).done(function () {
                    	var customerSelectItems = core.getModel('customerSelectItems'),
                    		results = datacontext.customerendcustomers.getLocalByForeignKey(customerId),
                            defaultPartner = _.find(results, function(row) { return !!row.DefaultPartnerFlag; }),
                            defaultPartnerID = (!!defaultPartner) ? defaultPartner.PartnerID : customerId;
                    		
                    	customerSelectItems.setProperty('/EndCustomers', results);
                        customerSelectItems.setProperty('/DefaultEndCustomerID', defaultPartnerID);
                		defer.resolve(results);
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				});
				
			if (!_customerLoaded || _customerLoaded != customerId) {
				return $.when(customerMainInfoDfr, customerBalancesDfr, salesDocsDfr, salesAdminsDfr, accountManagersDfr, shipTosDfr, billTosDfr, payersDfr, endCustomersDfr).promise();
			}
			
			return $.Deferred(function (def) {def.resolve();}).promise();
		},
	
		loadSalesDocument = function(salesDocumentId, forceRefresh) {
			var salesDocumentHeaderDfr = $.Deferred(function(defer) {
					datacontext.salesdocuments.get(salesDocumentId, forceRefresh).done(function (data) {
	                	var salesDocument = core.getModel('currentSalesDocument'),
	                		customer = core.getModel('currentCustomer'),
	                		customerId = (!!customer) ? helper.Pad(customer.getProperty('/CustomerID'),10) : 0,
	                		salesDocCustomer = helper.Pad(data.CustomerID, 10);
	                	
	            		if ((salesDocCustomer != 0) && (salesDocCustomer != customerId)) {
	            			loadCustomerInfo(salesDocCustomer).done(function() {
								salesDocument.setData(data);
	            				defer.resolve();
	    	                }).fail(function (response) {
	    	                	defer.reject(response);
	    	                });
	            		} else {
							salesDocument.setData(data);
            				defer.resolve();
	            		}
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				}),
	
				salesDocumentDetailsDfr = $.Deferred(function(defer) {
					datacontext.salesdocumentlines.getByForeignKey(salesDocumentId, forceRefresh).done(function () {
	                	var salesDocumentDetails = core.getModel('currentSalesDocumentLines')
	                		results = datacontext.salesdocumentlines.getLocalByForeignKey(salesDocumentId);

						if (results.length > 100) {
							salesDocumentDetails.setSizeLimit(results.length + 100);
						}
	            		salesDocumentDetails.setData(results);
						salesDocumentHeaderDfr.done(function () {
							var unsubmitted = _.find(results, function(row) {
								return (!!row.ItemCategory && row.ItemCategory.substring(0,1) != 'Y') || (!!row.ReasonForRejection && !row.MarkedAsDeleted);
							});
							if (!!unsubmitted && unsubmitted.length != 0) {
								core.getModel('currentSalesDocument').setProperty('/SalesOrderStatus', 'E0001')
							} else {
								core.getModel('currentSalesDocument').setProperty('/SalesOrderStatus', 'E0002')
							}
							defer.resolve();
						})
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
	
				}),
					
				salesDocumentAttachmentsDfr = $.Deferred(function(defer) {
					datacontext.salesdocumentattachments.getByForeignKey(salesDocumentId, forceRefresh).done(function () {
	                	var salesDocumentAttachments = core.getModel('currentSalesDocumentAttachments'),
	                		results = datacontext.salesdocumentattachments.getLocalByForeignKey(salesDocumentId);
	                	
	                	salesDocumentAttachments.setData(results);
	            		defer.resolve();
	                }).fail(function (response) {
	                	defer.reject(response);
	                });
				});
				
			salesDocumentFlowDfr = $.Deferred(function(defer) {
				datacontext.documentFlow.getByForeignKey(salesDocumentId, forceRefresh).done(function () {
                	var salesDocumentFlow = core.getModel('documentFlow');
                	var	results = datacontext.documentFlow.getLocalByForeignKey(salesDocumentId);
                	
                	salesDocumentFlow.setData(results);
            		defer.resolve();
                }).fail(function (response) {
                	defer.reject(response);
                });
			});			
			
			
			return $.when(salesDocumentHeaderDfr, salesDocumentDetailsDfr, salesDocumentAttachmentsDfr,salesDocumentFlowDfr).promise();
			
		};
	
	return {
		loadCustomerInfo: loadCustomerInfo,
		loadSalesDocument: loadSalesDocument
	};
})($,sap.ui.getCore(), _ , gdt.salesui.data.DataContext, gdt.salesui.util.SAPGatewayHelper);
