$.sap.require("sap.m.MessageBox");
$.sap.require("sap.m.MessageToast");
$.sap.require("sap.ui.core.util.Export");
$.sap.require("sap.ui.core.util.ExportTypeCSV");
$.sap.require("gdt.salesui.data.DataContext");
$.sap.require("gdt.salesui.lib.underscore-min");
$.sap.require("gdt.salesui.lib.jquery-scrollTo-min");
$.sap.require("gdt.salesui.lib.jquery-visible-min");
$.sap.require("gdt.salesui.data.DataImporter");
$.sap.require("sap.ui.commons.MessageBox");
$.sap.require("gdt.salesui.util.AddressHelper");
$.sap.require("gdt.salesui.util.Controller");
$.sap.require("gdt.salesui.util.Formatter");
$.sap.require("gdt.salesui.util.Sharepoint");
$.sap.require("gdt.salesui.vm.SalesDocumentDetail");

gdt.salesui.util.Controller
        .extend(
                "gdt.salesui.controller.Detail", function($, core, _, importer, datacontext, addressHelper, sharepoint, formatter, detailsvm)
                {
                	var copies = core.getModel('copies'),
						materialSeries_FinishedGoods = 1,
						materialSeries_Placeholder = 2,
						materialSeries_Hardware = 3,
						materialSeries_ProfessionalServices = 4,
                		currentTab = null,
	                	view = null,
	                	page = null,
						busyDlg = null,
						splitApp = sap.ui.getCore().byId("app").byId('fioriContent'),
	            		componentId = null,
	                	eventBus = null,
	                	router = null,
	                	currentCustomerID = '',
	                	currentSalesDocumentID = '',
	                	forceRefresh = false,
	                	startupMsg = null,
               	
                    onInit = function(event) {
                    	var table = null,
                    		oldTableOnAfterRendering = null,
                    		currentState = core.getModel('currentState');
                    	
                    	view = this.getView();
						busyDlg = view.byId('busyDlg');
						componentId = sap.ui.core.Component.getOwnerIdFor(view),
	                    eventBus = sap.ui.component(componentId).getEventBus(), 
                    	router = this.getRouter();
                    	page = view.byId('detailPage');
                    	table = view.byId('lineItemsTable');
                    	oldTableOnAfterRendering = table.onAfterRendering;
                    	 
                    	table.onAfterRendering = function() {
                    	  var tmpResult = oldTableOnAfterRendering.apply(this, arguments);
                    	 
                    	  if (typeof onAfterTableOnAfterRendering === 'function')
                    		  onAfterTableOnAfterRendering.apply(this, arguments);

                    	  return tmpResult;
                    	};
                    	
// ISS53 Change   
// HotFix Change                    	
                    	
                		view.setModel(currentState,'currentState');
                		view.setModel(core.getModel('device'),'device');
                		view.setModel(core.getModel('globalSelectItems'),'globalSelectItems');
	                    _attachValidationHandlers();
	                    view.setModel(core.getModel('i18n'),'i18n');
                        table._oVSb.attachScroll(_.debounce(_calculateTotals,50),table);
                        $(document).on( "paste", "td", handlePaste);
                    	$(document).on( "keydown", "td", handleTableKeyDown);
                    	$(document).on(
                    		    'dragover',
                    		    function(e) {
                    		        e.preventDefault();
                    		        e.stopPropagation();
                    		    }
                    		);
                    	$(document).on(
                    		    'dragenter',
                    		    function(e) {
                    		        e.preventDefault();
                    		        e.stopPropagation();
                    		    }
                    		);
                    	$(document).on('drop', "#"+view.byId('detailPage').getId(), handleDropFile);

	                    
	                    sap.ui.core.UIComponent
	                            .getRouterFor(this)
	                            .attachRouteMatched(
	                                    function(evt) {
		                                    if (evt.getParameter("name") === "detail") {
			                                    var arguments = evt.getParameter("arguments"),
			                                    	iconTabBar = view.byId("iconTabBar"),
			                                    	salesDocumentID = arguments.salesDocId;
			                                    
			                                    currentTab = arguments.tab || "lineItems";

		            	                		currentCustomerID = arguments.customerId;			                                    

			            	                    //page.addStyleClass("sapUiSizeCompact");

												if (!!salesDocumentID && parseInt(salesDocumentID) != 0) {
													busyDlg.setText('Fetching document ' + salesDocumentID + ' from SAP.')
												} else {
													busyDlg.setText('Please Wait.')
												}
												if (currentTab == 'attachments') {
													busyDlg.setText('Checking with SharePoint.');
												}
//Begin of Change:Added by SXVASAMSETTI												
												if (currentTab == 'docflow') {
													busyDlg.setText('Fetching related documents to document(' + salesDocumentID + ') from SAP.');
												}
//end of Changed												
												busyDlg.open();

			                                    if (!!core.getModel('currentState').getProperty('/forceRefresh')) {
			                                    	core.getModel('currentState').setProperty('/forceRefresh', false);
			                                    	forceRefresh = true;
			                                    }

			                                    setTimeout(function () {
				            	                	_refreshSalesDocumentFromServer(salesDocumentID, forceRefresh).done(function() {
					                                    if (iconTabBar && (iconTabBar.getSelectedKey() !== currentTab)) {
						                                    iconTabBar.setSelectedKey(currentTab);
					                                    }
		
					                                    if (currentTab == 'attachments') {
					                                    	_refreshAttachments(salesDocumentID).always(function() {
								                                busyDlg.close();
					                                    		
							                                    if (startupMsg) {
							                                    	sap.m.MessageToast.show(startupMsg);
							                                    	
							                                    	startupMsg = null;
							                                    }
					                                    	});
					                                    } 
					                                  //Begin of Change:Added by SXVASAMSETTI		                         
					                                    else if(currentTab == 'docflow' && parseInt(salesDocumentID) != 0 ){
                                                           
					                                    	_getDocumentFlowFromSAP(core.getModel('currentSalesDocument').getProperty('/ReferencedBy') ||salesDocumentID,true).always(function(){
					                                    		busyDlg.close();
					                                    		});				                                  
					                                 
					                                    }
					                                  //End of Change:SXVASAMSETTI
					                                    else {
															busyDlg.close();
														}
			                                    
			                                    	}).fail(function (msg) {
														busyDlg.close();
														if (page) {
															splitApp.toDetail(splitApp.getInitialDetail());
															splitApp.showMaster();
														}
														currentSalesDocumentID = null;
														core.getModel('currentSalesDocument').setProperty('/SalesDocumentID','');
														router.navTo("master", {from: "customer", customerId: currentCustomerID}, true);
													}).always(function() {
														if (startupMsg) {
															sap.m.MessageToast.show(startupMsg);

															startupMsg = null;
														}
													});
			                                    });
		                                    }
	                                    }, this);
	                    
                        
                    },
  
                    onBeforeRendering = function(event) {
                    	var qPnl = view.byId('detailQuotePageHeader'),
                			sPnl = view.byId('detailSalesOrderPageHeader');
                    	
                    	qPnl.attachEvent('expand', _resizeTable, null);
                    	sPnl.attachEvent('expand', _resizeTable, null);
                    	$(window).resize(_resizeTable);
                    	_resizeTable();
                    	
                    },
                    
                    onAfterRendering = function(event) {
                    	var linesModel = core.getModel('currentSalesDocumentLines');

                    	linesModel.bindList('/',null).attachChange(_handleDetailListChange);  
                    	

                    },
                    
                    
                    onAfterTableOnAfterRendering = function() {
                        _calculateTotals();
                    },
                    
//Begin of Change for DocumentFlow Section:SXVASAMSETTI   
                    
                    _refreshDocumentFlowFromServer=function(salesDocumentID,refresh){
                    	_getDocumentFlowFromSAP(salesDocumentID,refresh).always(function(){
                    		busyDlg.close();
                    		});		
                    }                       
                    
                    _doExpandAll = function() {
                    	var treeTable = view.byId('docflowTreeTable');
                        for (var i=0; i<treeTable.getRows().length; i++) {
                        	if(treeTable.getContextByIndex(i)!=undefined){
                        	try{
                        	treeTable.expand(i);
                        	}catch(e){
                        	console.log(e);	
                        	}
                        	}
                        } },

                       
                    _getDocumentFlowFromSAP = function(documentID,refresh){
                    	var deferred =  $.Deferred(function(defer) {
                        	busyDlg.setText('Fetching related documents to document(' + documentID + ') from SAP.');
                        	busyDlg.open();		
                    	datacontext.documentFlow.get(documentID,refresh).done( function(data){
                        busyDlg.open();	
//                        core.getModel('documentFlow').setData(data);
                   		var treeTable = view.byId('docflowTreeTable');
                   		var treeTableModel = new sap.ui.model.json.JSONModel();
                   		treeTableModel.setData({modelData: data});
                   		treeTable.setModel(treeTableModel);
                   		treeTable.bindRows("/modelData");
                      		defer.resolve( );
                    	}).fail(function(msg){
                    		defer.reject(msg);
                    	})
                    	}).done(function(){
                    		 _doExpandAll();
                    	}).fail( );
                    	
                    	return deferred;
                    },                   
                  //End of Change    
                    
                    _handleDetailListChange = function(event) {
                    	var source = event.getSource(),
                    		linesModel = core.getModel('currentSalesDocumentLines');
                    	
                    	_.each(source.getContexts(), function (context) {
                    		var path = context.getPath();
                    		
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'QTY' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('QTY',context).attachChange(function(event) {detailsvm.HandleDetailQtyChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'ListPrice' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('ListPrice',context).attachChange(function(event) {detailsvm.HandleDetailListPriceChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'GDTDiscountPercent' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('GDTDiscountPercent',context).attachChange(function(event) {detailsvm.HandleDetailGDTDiscountChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'UnitCost' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('UnitCost',context).attachChange(function(event) {detailsvm.HandleDetailUnitCostChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'ExtendedCost' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('ExtendedCost',context).attachChange(function(event) {detailsvm.HandleDetailExtendedCostChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'CustomerDiscountPercent' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('CustomerDiscountPercent',context).attachChange(function(event) {detailsvm.HandleDetailCustomerDiscountChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'UnitPrice' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('UnitPrice',context).attachChange(function(event) {detailsvm.HandleDetailUnitPriceChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'ExtendedPrice' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('ExtendedPrice',context).attachChange(function(event) {detailsvm.HandleDetailExtendedPriceChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'GrossProfit' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('GrossProfit',context).attachChange(function(event) {detailsvm.HandleDetailGrossProfitChange(event); _calculateTotals()});
                    		}
                    		if (_.filter(linesModel.aBindings, function (b) {return b.getPath() == 'GrossProfitPercentage' && (b.getContext()) && (b.getContext().getPath) && (b.getContext().getPath() == path); }).length == 0) {
                    			linesModel.bindProperty('GrossProfitPercentage',context).attachChange(function(event) {detailsvm.HandleDetailGrossProfitPercentageChange(event); _calculateTotals()});
                    		}
                    	});
                    },
                    
                    _resizeTable = function() {
                    	var height = $(document).height(),
	                		tbl = view.byId('lineItemsTable'),
	                		qPnl = view.byId('detailQuotePageHeader'),
	                		sPnl = view.byId('detailSalesOrderPageHeader'),
	                		salesDoc = core.getModel('currentSalesDocument'),
	                		docCat = (salesDoc) ? salesDoc.getProperty('/DocumentCategory') : 'B',
	                		isQuote = (docCat) ? (docCat == 'B') : false,
	    	                qExpanded = (qPnl) ? qPnl.getExpanded() : true,
	    	    	        sExpanded = (sPnl) ? sPnl.getExpanded() : true,
	                		offset = 375,  //MG - reduce offset now Header on own tab
//	                		offset = (isQuote) ? ((qExpanded) ? 470 : 415) : ((sExpanded) ? 635 : 444),
	                		rows = parseInt((height - offset) / 32);
            	
                    	if (tbl) {
                    		if (rows > 5) {
	                    		tbl.setVisibleRowCount(rows);
	                    	} else {
	                    		tbl.setVisibleRowCount(5);
	                    	}
                    	}
                    },
                    
                    _refreshSalesDocumentFromServer = function(salesDocumentID, refresh) {
                    	var deferred;
          	
                    	if (!refresh && core.getModel('currentSalesDocument').getProperty('/SalesDocumentID') == salesDocumentID)
                    		return $.Deferred(function(def) {return def.resolve();}).promise();


						deferred =  $.Deferred(function(defer) {
							currentSalesDocumentID = salesDocumentID;

							gdt.salesui.data.DataLoader.loadSalesDocument(salesDocumentID, forceRefresh || refresh).done(function () {
								currentCustomerID = core.getModel('currentCustomer').getProperty('/CustomerID');

								view.setModel(core.getModel('currentTotals'), 'currentTotals');
								view.setModel(core.getModel('currentCustomer'), 'currentCustomer');
								view.setModel(core.getModel('customerSelectItems'), 'customerSelectItems');
								view.setModel(core.getModel('currentSalesDocumentLines'), 'currentSalesDocumentLines');
								view.setModel(core.getModel('currentSalesDocument'), 'currentSalesDocument');
								view.setModel(core.getModel('currentAttachments'), 'currentAttachments');
								view.setModel(core.getModel('currentVia'), 'currentVia');
								_setCurrentDocumentStates();
								if (!parseInt(salesDocumentID)) { // Creating a new document
									_setupNewDocument();
								}
								_calculateTotals();

								splitApp.hideMaster();
								defer.resolve();
							}).fail(function (msg) {
								defer.reject(msg);
							}).always(function () {
								forceRefresh = false;
								_resizeTable();
							});
						});
                        	
                    	return deferred;
                    },
                    
                    handleTableKeyDown = function(event) {
                    	var target = event.target,
                    		tbl = view.byId('lineItemsTable'),
                    		data = core.getModel('currentSalesDocumentLines').getData(),
                    		newtarget = null,
                    		parent = null,
                    		td = null,
                    		tr = null,
                    		body = null,
                    		value = null,
                    		startRow = tbl.getFirstVisibleRow(),
                    		lastRow = 0,
                    		numRows = (data) ? data.length : 0,
                    		voffset = 0,
                    		hoffset = 0,
                    		newrow = -1,
                    		newcol = -1,
                    		moved = false,
                    		row = 0,
                    		col = 0;
                    	
                    	if (numRows == 0) return;
                    	
                    	td = $(target).closest('td');
                    	
                    	if (td) {
                    		tr = $(td).closest('tr');
                    	}
                    	
                    	if (tr){
                    		col =  _.findIndex(tr.children(), {id : $(td).attr('id')});
                    		body = tr.closest('tbody');
                    	}
                    	
                    	if (body) {
                    		lastRow = body.children().length - 1;
                    		row =  _.findIndex(body.children(), {id : $(tr).attr('id')});
                    	}
                    	
                    	if (event.ctrlKey && event.shiftKey && event.keyCode == 13) { // Ctrl-Shift-Down = copy to all rows
                    		$(target).blur();
                    		setTimeout(function() {
                    			var c = _.find(tbl.getColumns(), function (col) { 
                    					var colid = col.getAggregation('template').getId(),
                    						trgid = target.getAttribute('id').substring(0,colid.length);
                    				
                    					return colid == trgid;
                    				}),
                    				t = (c) ? c.getTemplate() : null,
                    				bindingInfo = (t) ? t.getBindingInfo('value') :  null,
                    				parts = (bindingInfo) ? bindingInfo.parts : null,
                    				firstPart = (parts && parts.length > 0) ? parts[0] : null,
                    				path = (firstPart) ? firstPart.path : null,
                    				linesModel = view.getModel('currentSalesDocumentLines');
                    			
                    			if (path && path != 'StructuredLineID') {
                                    _.each(data, function (r, i) {
                                        if ((core.getModel('currentState').getProperty('/isEditMode')) && !linesModel.getProperty('/' + (i) + '/WBSElement') && !linesModel.getProperty('/' + (i) + '/MarkedAsDeleted') && !linesModel.getProperty('/' + (i) + '/DeletedFlag')) {
                                            linesModel.setProperty('/' + (i) + '/' + path, data[row + startRow][path]);
                                        }
                                    });
                                    view.getModel('currentSalesDocumentLines').setData(data);
                                }
                            });
                    		event.preventDefault();
                    		event.stopPropagation();
                    		return;
                    	} 
                    	
                    	if (event.shiftKey) {
                    		if (event.keyCode == 9) {
                    			hoffset = -1;
                    		}
                    	} else {
                    		if (event.keyCode == 9) {
                    			hoffset = 1;
                    		}
                    	}
                    	if (event.keyCode == 40) voffset = 1;
                    	if (event.keyCode == 38) voffset = -1;
                    	
                    	newrow = row + voffset;
                    	newcol = col + hoffset;
                    	
                    	if (newrow == row && newcol == col) return; // not one of our interesting key presses
                    	
                		$(target).blur();

                    	setTimeout(function() {
                			var c = _.find(tbl.getColumns(), function (col) { return col.getAggregation('template').getId() == target.getAttribute('id').substring(0,target.getAttribute('id').indexOf('-'));}),
	            				t = (c) ? c.getTemplate() : null,
	            				bindingInfo = (t) ? t.getBindingInfo('value') :  null,
	            				parts = (bindingInfo) ? bindingInfo.parts : null,
	            				firstPart = (parts && parts.length > 0) ? parts[0] : null,
	            				path = (firstPart) ? firstPart.path : null,
	            				linesModel = view.getModel('currentSalesDocumentLines');

								if (event.shiftKey) {
									if (event.keyCode != 9) {
										value = linesModel.getProperty('/'+(startRow + row)+'/'+path);
									}
								}
                			if (path && path != 'StructuredLineID') {
    	                    	if (value && (core.getModel('currentState').getProperty('/isEditMode')) && !linesModel.getProperty('/'+(startRow + newrow)+'/WBSElement') && !linesModel.getProperty('/'+(startRow + newrow) + '/MarkedAsDeleted') && !linesModel.getProperty('/'+(startRow + newrow) + '/DeletedFlag')) linesModel.setProperty('/'+(startRow + newrow)+'/'+path,value);
                			}
                			
                    		if ((newrow > lastRow) && (startRow + lastRow < numRows - 1)) {
                        		newrow--;
                        		row--;
                        		tbl.setFirstVisibleRow(startRow+1);
                        	}
                        	
                        	if ((newrow < 0) && (startRow > 0)) {
                        		newrow++;
                        		row++;
                        		tbl.setFirstVisibleRow(startRow-1);
                        	}
                        	
                			setTimeout(function() {
	                        	
	            				if ((voffset && newrow >= 0 && newrow < body.children().length) || 
		                    			(hoffset && newcol >= 0 && newcol < $(body.find('tr')[newrow]).children().length)) {
		                    		newtarget = $($(body.find('tr')[newrow]).find('td')[newcol]).find('input');
		                    		event.preventDefault();
		                    		event.stopPropagation();
		                    	}
		                    	
	                    		if (newtarget) {
	                        		setTimeout(function() {
	                    			
		                    			if (!$(newtarget).visible(true, false, 'both')) $('.sapUiTableCtrlScr').scrollTo($(newtarget));
		                    			$(newtarget).focus();
	
	                        		});
	                    		}
                			});
                    	},10);
                    },

					_reloadSAPAttachments = function(salesDocumentId) {
						return $.Deferred(function(defer) {
							datacontext.salesdocumentattachments.getByForeignKey(salesDocumentId, true).done(function () {
								var salesDocumentAttachments = core.getModel('currentSalesDocumentAttachments'),
									results = datacontext.salesdocumentattachments.getLocalByForeignKey(salesDocumentId);

								salesDocumentAttachments.setData(results);
								defer.resolve();
							}).fail(function (response) {
								defer.reject(response);
							});
						}).promise();
					},
                    
                    _refreshAttachments = function() {
						var documentCategory = core.getModel("currentSalesDocument").getProperty("/DocumentCategory"),
							attachmentsInSAP = core.getModel("currentSalesDocumentAttachments"),
							absoluteUrl,
							newAttachment = false,
							deferred = $.Deferred(function (def) {
							sharepoint.listDocuments(currentCustomerID, currentSalesDocumentID)
								.done(function (attachments) {
									core.getModel('currentAttachments').setData(attachments);
									_.each(attachments, function (attachment) {
										absoluteUrl = sharepoint.absoluteUrl(attachment.ServerRelativeUrl);
										if (absoluteUrl.indexOf('?') != -1) {
											absoluteUrl += '&web=1';
										} else {
											absoluteUrl += '?web=1';
										}
										if (!_.findWhere(attachmentsInSAP.getData(), {DocumentDes: attachment.Name})) { // if not in SAP yet...add it as a link
											console.log("Document " + attachment.Name + " not found in SAP Attachments: ");
											_.each(attachmentsInSAP.getData(), function (sapAttachment) {console.log(sapAttachment.DocumentDes);});
											attachmentsInSAP.getData().push({DocumentCategory: documentCategory, AttachmentLink : absoluteUrl, DocumentDes : attachment.Name, SalesDocumentID : currentSalesDocumentID}); //push new record
											model.createEntry("/SalesDocumentSet(SalesDocumentID='" + currentSalesDocumentID + "')/AttachmentsLink",{DocumentCategory: documentCategory, AttachmentLink : absoluteUrl, DocumentDes : attachment.Name, SalesDocumentID : currentSalesDocumentID});
											newAttachment = true;
											console.log("Document " + attachment.Name +  " attached in SAP as "+absoluteUrl);
										}
									});

									if (newAttachment) {
										model.submitChanges();
										_reloadSAPAttachments().done(function() {
											if (!core.getModel('currentState').getProperty('/isQuote') && !!core.getModel('currentSalesDocument').getProperty('/ReferencedBy')) {
												_checkForRelatedAttachments(core.getModel('currentSalesDocument').getProperty('/ReferencedBy'))
													.done(function () {
														def.resolve();
													});
											} else {
												def.resolve();
											}
										}).fail(function() {
											def.reject('Failed to reload SAP Attachments');
										})
									} else {
										if (!core.getModel('currentState').getProperty('/isQuote') && !!core.getModel('currentSalesDocument').getProperty('/ReferencedBy')) {
											_checkForRelatedAttachments(core.getModel('currentSalesDocument').getProperty('/ReferencedBy'))
												.done(function () {
													def.resolve();
												});
										} else {
											def.resolve();
										}
									}
								}).fail(function (msg) {
									def.reject(msg);
								}).always(function () {
									view.setModel(core.getModel('currentAttachments'), 'currentAttachments');
								});
							});

						return deferred.promise();
                    },
					_checkForRelatedAttachments = function(refDocId){
						var deferred = $.Deferred(function (def) {
							sharepoint.listDocuments(currentCustomerID, refDocId)
								.done(function (attachments) {
									var currentAttachments = core.getModel('currentAttachments').getData(),
										documentCategory = core.getModel("currentSalesDocument").getProperty("/DocumentCategory"),
										attachmentsInSAP = core.getModel("currentSalesDocumentAttachments"),
										newAttachment = false,
										absoluteUrl;

									_.each(attachments, function (attachment) {
										absoluteUrl = sharepoint.absoluteUrl(attachment.ServerRelativeUrl);
										if (absoluteUrl.indexOf('?') != -1) {
											absoluteUrl += '&web=1';
										} else {
											absoluteUrl += '?web=1';
										}
										attachment.isRelated = true;
										currentAttachments.push(attachment);
										if (!_.findWhere(attachmentsInSAP.getData(), {DocumentDes: attachment.Name})) { // if not in SAP yet...add it as a link
											console.log("Document (from Quote) " + attachment.Name + " not found in SAP Attachments: ");
											_.each(attachmentsInSAP.getData(), function (sapAttachment) {console.log(sapAttachment.DocumentDes);});
											attachmentsInSAP.getData().push({DocumentCategory: documentCategory, AttachmentLink : absoluteUrl, DocumentDes : attachment.Name, SalesDocumentID : currentSalesDocumentID}); //push new record
											model.createEntry("/SalesDocumentSet(SalesDocumentID='" + currentSalesDocumentID + "')/AttachmentsLink",{DocumentCategory: documentCategory, AttachmentLink : absoluteUrl, DocumentDes : attachment.Name, SalesDocumentID : currentSalesDocumentID});
											newAttachment = true;
											console.log("Document " + attachment.Name +  " (from Quote) attached in SAP as "+absoluteUrl);
										}
									});

									if (newAttachment) {
										model.submitChanges();
										_reloadSAPAttachments().done(function() {
											core.getModel('currentAttachments').setData(currentAttachments);
											def.resolve();
										}).fail(function() {
											def.reject('Failed to reload SAP Attachments');
										})
									} else {
										core.getModel('currentAttachments').setData(currentAttachments);
										def.resolve();
									}
								}).fail(function (msg) {
									def.reject(msg);
								});
							});

						return deferred.promise();
					},
                    _attachValidationHandlers = function () {
	                	// attach handlers for validation errors
	                    
	                    sap.ui.getCore().attachValidationError(function (evt) {
	                      var control = evt.getParameter("element"), errMsg = '';
	                      if (control && control.setValueState) {
	                        control.setValueState("Error");
	             			if (control.getValueStateText) errMsg = control.getValueStateText();
	             			
	             			errMsg = (errMsg != '') ? errMsg : 'Invalid Value';
	             			
	             			control.setTooltip(new sap.ui.commons.RichTooltip({
	             				text : errMsg
	             			}));
	                      }
	                    });
	                    sap.ui.getCore().attachValidationSuccess(function (evt) {
	                      var control = evt.getParameter("element");
	                      if (control && (control.setValueState) && (control.setTooltip)) {
	                        control.setValueState("None");
	             			control.setTooltip();
	                      }
	                    });
                    },

					_canEdit = function() {
						return 	!(core.getModel('currentState').getProperty('/isQuote') && core.getModel('currentSalesDocument').getProperty('/Status') == 'C');
					},
                    
                    _setCurrentDocumentStates = function() {
                    	var doc = core.getModel('currentSalesDocument').getData(),
                    		details = core.getModel('currentSalesDocumentLines').getData(),
							unsubmittedDetails = _.filter(details, function(row) {
								return (!!row.ItemCategory && row.ItemCategory[0] != 'Y')  || (!!row.ReasonForRejection);
							}),
                    		currentState = core.getModel('currentState');
                    	
                    	currentState.setProperty('/outputType','ZAN1');
                    	currentState.setProperty('/timezone',new Date().toString().match(/\(([A-Za-z\s].*)\)/)[1]);
                    	currentState.setProperty('/timezoneOffset',new Date().toString().match(/([-\+][0-9]+)\s/)[1]);
                    	currentState.setProperty('/LineCount',(details) ? details.length : 0);
                        currentState.setProperty('/isQuote',doc.DocumentCategory == 'B');
                        currentState.setProperty('/isSalesOrder',doc.DocumentCategory == 'C');
                        currentState.setProperty('/isPendingSalesOrder',doc.DocumentCategory == 'C' && doc.SalesOrderStatus != 'E0002');
                        currentState.setProperty('/isSubmittedSalesOrder',doc.DocumentCategory == 'C' && doc.SalesOrderStatus == 'E0002');
                        currentState.setProperty('/canDelete', currentState.getProperty('/isPendingSalesOrder'));

                    	currentState.setProperty('/isEditMode',false);
                    	currentState.setProperty('/isNotEditMode',true);
						currentState.setProperty('/canEdit', _canEdit());
//						currentState.setProperty('/canEdit', (currentState.getProperty('/isQuote') || currentState.getProperty('/isPendingSalesOrder')));

                		view.setModel(currentState,'currentState');
                    },
                    
                    _setupNewDocument = function() {
                    	var doc = core.getModel('currentSalesDocument'),
							customer = core.getModel('currentCustomer'),
                    		customerSelectItems = core.getModel('customerSelectItems'),
                    		shipTos = customerSelectItems.getProperty('/ShipTos') || [],
                    		billTos = customerSelectItems.getProperty('/BillTos') || [];
                    	
                    	doc.setProperty('/CustomerID', currentCustomerID);
						doc.setProperty('/ShipToID', customerSelectItems.getProperty('/DefaultShipToID'));
						doc.setProperty('/BillToID', customerSelectItems.getProperty('/DefaultBillToID'));
						doc.setProperty('/PayerID', customerSelectItems.getProperty('/DefaultPayerID'));
						if (!!customerSelectItems.getProperty('EndCustomers')) doc.setProperty('/EndCustomerID', customerSelectItems.getProperty('/DefaultEndCustomerID'));
						doc.setProperty('/ShippingConditionID', customer.getProperty('/ShippingConditionID'));
                    	handleAddDetailLine();
                    	_toggleEdit(true);
                    },
                    
                    handleDragOver = function(event) {
                        event.stopPropagation();
                        event.preventDefault();
                        event.originalEvent.dataTransfer.dropEffect = 'copy';             	
                    },
                    
                    handleDropFile = function(event) {
                        var dialog = view.byId('detailLineImportConfirmDialog'),
							files = event.originalEvent.dataTransfer.files;
                        	

                        event.stopPropagation();
                        event.preventDefault();

                        if (currentTab == 'attachments') {
                        	if (parseInt(currentSalesDocumentID) == 0) {
                        		sap.m.MessageToast.show('You must save the new document to SAP before you can add attachments.');
                        		return;
                        	}
                        	if ((!!files) && files.length > 0) {
                            	page.setBusyIndicatorDelay(0);
                                page.setBusy(true);

                                setTimeout(function () {
		                        	var reader = new FileReader();
		                        	reader.onload = function (result) {
		                        	    var fileData = '',
		                        	    	model = core.getModel();
		                        	    	byteArray = new Uint8Array(result.target.result);
		                        	    if (result.target.readyState == FileReader.DONE) { // DONE == 2
		                        	    	for (var i = 0; i < byteArray.byteLength; i++) {
		                        	    		fileData += String.fromCharCode(byteArray[i]);
		                        	    	}
											sharepoint.uploadDocument(currentCustomerID, currentSalesDocumentID, result.target.result, files[0].name).done(function(relativeUrl) {
			                        				var documentCategory = core.getModel("currentSalesDocument").getProperty("/DocumentCategory"),
			                        					attachmentsInSAP = core.getModel("currentSalesDocumentAttachments"),
														newAttachment = false,
			                        					absoluteUrl = sharepoint.absoluteUrl(relativeUrl);
			                        				if (absoluteUrl.indexOf('?') != -1) {
			                        					absoluteUrl += '&web=1';
			                        				} else {
			                        					absoluteUrl += '?web=1';
			                        				}
			                        				if (!_.findWhere(attachmentsInSAP.getData(), {DocumentDes: files[0].name})) { // if not in SAP yet...add it as a link
			                        					attachmentsInSAP.getData().push({DocumentCategory: documentCategory, AttachmentLink : absoluteUrl, DocumentDes : files[0].name, SalesDocumentID : currentSalesDocumentID}); //push new record
				                        				model.createEntry("/SalesDocumentSet(SalesDocumentID='" + currentSalesDocumentID + "')/AttachmentsLink",{DocumentCategory: documentCategory, AttachmentLink : absoluteUrl, DocumentDes : files[0].name, SalesDocumentID : currentSalesDocumentID});
														newAttachment = true;
														console.log("Document " + files[0].name +  " attached in SAP as "+absoluteUrl);
			                        				}
													if (newAttachment) model.submitChanges();
													_refreshAttachments();
			    	                        	}).fail(function(msg) {
			    	                        		sap.m.MessageToast.show(msg);
			    	                        	}).always(function () {
			    	                        		page.setBusy(false);
			    	                        	});	
			                        	}
		                        	};
		                        	reader.onerror = function () {
		                        		var msg = "Could not load the requested file to Sharepoint";
    	                        		page.setBusy(false);
	                                	sap.m.MessageToast.show(msg);
		                        	};
		                        	reader.readAsArrayBuffer(files[0]);
                                });
                        	}
                        } else {
	                        if (!_isEmpty()) {
								dialog.removeAllButtons();

								dialog.addStyleClass("sapUiSizeCompact");
								dialog.addButton(new sap.ui.commons.Button({text: "Append", press:function(){
									dialog.close();
									_doImportFile(files, true);
								}}));
								dialog.addButton(new sap.ui.commons.Button({text: "Replace", press:function(){
									dialog.close();
									_doImportFile(files);
								}}));
								dialog.addButton(new sap.ui.commons.Button({text: "Cancel", press:function(){
									dialog.close();
								}}));

								dialog.open();
	                        } else {
	                        	_doImportFile(files);
	                        }
                        }
                    },
                    
                    _doImportFile = function(files, append) {
                    	var reader = new FileReader();
                  
                        reader.onload = (function(file) {
                            return function(e) {
                            	var errors = [],
									missingAddresses = [];
                            	
                                if (e.target.readyState == FileReader.DONE) { // DONE == 2
                                	if (!view.getModel('currentState').getProperty('/isEditMode')) _toggleEdit(true);
               		 				//view.getModel('currentSalesDocumentLines').setData([]);
                                    importer.ImportFromCCW(e.target.result, view.getModel('currentSalesDocument'),
                                    				view.getModel('currentSalesDocumentLines'), errors, missingAddresses,
                                    				_createNewLine, _lookupPartID, _determineItemCategoryForDropShip, append)
										.fail(function (msg) {
											sap.m.MessageBox.show(msg, {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "Import Error",
												actions: sap.m.MessageBox.Action.OK,
											})
										})
                                    	.always(function () {
											busyDlg.close();
                                    		if (errors && errors.length != 0) {
                                    			_presentImportErrors(errors);
                                    		} else {
												if (missingAddresses && missingAddresses.length != 0) {
													_presentAddressErrors(missingAddresses);
												} else {
													_calculateTotals();
												}
											}
										});
                                }
                            };
                          })(files[0]);
                        
                        reader.onerror = (function() {
							busyDlg.close();
                        })();

						busyDlg.setText('Attempting to import file.');
						busyDlg.open();
						
						setTimeout(function () {
							try {
								reader.readAsText(files[0]);
							}
							catch(err) {
								busyDlg.close();
							}
                        });
                    },

					_presentImportErrors = function(errors) {
						var dialog = view.byId('detailLineItemsImportErrorsDialog');

						dialog.addStyleClass("sapUiSizeCompact");

						view.setModel(new sap.ui.model.json.JSONModel(_.uniq(errors, function (error) {
							return error.CustomerPartID;
						})),"importErrors");

						dialog.open();
					},

					_presentAddressErrors = function(errors) {
						var dialog = view.byId('detailLineItemsAddressErrorsDialog'),
							title = view.byId('detailLineItemsAddressErrorsDialog-title');

						dialog.addStyleClass("sapUiSizeCompact");
//						title.addStyleClass("");

						view.setModel(new sap.ui.model.json.JSONModel(_.uniq(errors)),"addressErrors");

						dialog.open();
					},

					_deleteBlankDetailLines = function() {
                    	var detailLinesModel = view.getModel('currentSalesDocumentLines'),
                    		detailLines = jQuery.extend(true, [], detailLinesModel.getData()),
							lengthB4 = detailLines.length;
                    	
                    	detailLines = _.filter(detailLines, function(line) {
								return (!!line.MaterialID);
						});
                    	
                    	if (!!detailLinesModel && (lengthB4 > detailLines.length)) detailLinesModel.setData(detailLines);
                    },
                    
                    handleCancelImportErrorDialog = function(event) {
                 		var dialog = view.byId('detailLineItemsImportErrorsDialog');		
                 		dialog.close();	
                    },

					handleCancelAddressErrorDialog = function(event) {
						var dialog = view.byId('detailLineItemsAddressErrorsDialog');
						dialog.close();
					},
                    
                    handleEmailMasterData = function(event) {
                 		var dialog = view.byId('detailLineItemsImportErrorsDialog'),
                 			material = view.getModel('importErrors').getData(),
                 			i = 0,
                 			l = 0,
                 			sapclient = core.getModel('systemInfo').getProperty('/ClientID'),
                 			body = 'The following material was requested but not found in the SAP catalog for Client ' + sapclient + '.  Please add this material:\n\n';
                 		
                 		l = (!!material) ? material.length : 0;
                 		
                 		for (i=0; i<l; i++) {
                 			body += (!!material[i].ManufacturerID && parseInt(material[i].ManufacturerID) != 0) ? "Manufacturer: [" + material[i].ManufacturerID + "] " : "";
							body += (!!material[i].CustomerPartID) ? "Manufacturer's Part Number: ["+material[i].CustomerPartID+"] " : "";
							body += (!!material[i].Description) ? "Description: ["+material[i].Description+"] " : "";
							body += (!!material[i].ListPrice && parseFloat(material[i].ListPrice) != 0) ? "List Price: ["+material[i].ListPrice+"]\n" : "\n";
                 		}
                 		
                 		dialog.close();	

                 		sap.m.URLHelper.triggerEmail("masterdata@gdt.com","Missing Material",body);                 		
                    },
                    
                    handleDetailLineNotes = function (event) {
                 		var dialog = view.byId('detailLineNotesDialog'),
                 			source = event.getSource(),
							binding = source.getBinding('color'),
							context = binding.getContext(),
							model = binding.getModel(),
							row = model.getProperty(context.getPath()),
							saveRow = jQuery.extend(true, {}, row);
                 		
						dialog.removeAllButtons();
						
             			dialog.addStyleClass("sapUiSizeCompact");			            	                    
                 		dialog.addButton(new sap.ui.commons.Button({text: "OK", enabled: "{currentState>/isEditMode}", press:function(){
                 				var hasNotes = (row.VendorDeliveryNotes || row.BillingNotes) ? true : false;
                 				
                   				model.setProperty(context.getPath()+'/HasNotesFlag', hasNotes);
                 				dialog.close();
                 			}})); 
                 		dialog.addButton(new sap.ui.commons.Button({text: "Cancel", press:function(){
                   			model.setProperty(context.getPath(), saveRow);
                     		
                     		dialog.close();	
                 			}})); 
                 		
                 		view.setModel(new sap.ui.model.json.JSONModel(row),"currentLine");
                 		
                 		dialog.open();                 		                 		
                    },
                    
                    _makeTotalConfiguredItemLikeThis = function(row, model, propertyNames, vendorID) {
                    	var ultimateParentLineID = _findUltimateParentLineID(row, model.getData()),
                    		configuredItemRows = _createIndexChainFromParent(ultimateParentLineID, model.getData(), []),
                    		properties;
                    	
                    	if (typeof propertyNames == 'string') {
                    		properties = [ propertyNames ];
                    	} else {
                    		properties = propertyNames;
                    	}
                    	
                    	_.each(configuredItemRows, function (item, index, list) {
                    		_.each(properties, function (property) {
                    			var val = row[property];
                                if (!model.getProperty('/'+item+'/MarkedAsDeleted') && (!vendorID || (model.getProperty('/'+item+'/VendorID') == vendorID))) {
                                    if (property == 'ItemCategory') {
                                        if (formatter.itemCategoryToStaging(row.ItemCategory)) {
                                            val = _determineItemCategoryForStaging(model.getProperty('/' + item));
                                        } else {
                                            if (formatter.itemCategoryToDropShip(row.ItemCategory)) {
                                                val = _determineItemCategoryForDropShip(model.getProperty('/' + item));
                                            } else {
                                                val = _determineItemCategoryForBroughtIn(model.getProperty('/' + item));
                                            }
                                        }

                                    }
                                    model.setProperty('/' + item + '/' + property, val);
                                }
                    		});
                    	});
                    	
                    	
                    },

                    _makeChildItemsLikeThis = function(row, model, propertyNames) {
                        var children = _findAllChildren(row.SalesDocumentLineID, model.getData()),
                            properties;

                        if (typeof propertyNames == 'string') {
                            properties = [ propertyNames ];
                        } else {
                            properties = propertyNames;
                        }

                        _.each(children, function (item, index, list) {
							var rowIdx = _.findIndex(model.getData(),function (row) {return row.SalesDocumentLineID == item.SalesDocumentLineID ;});
                            _.each(properties, function (property) {
                                var val = row[property];
                                if (!model.getProperty('/'+rowIdx+'/MarkedAsDeleted')) {
                                    if (property == 'ItemCategory') {
                                        if (formatter.itemCategoryToStaging(row.ItemCategory)) {
                                            val = _determineItemCategoryForStaging(model.getProperty('/' + rowIdx));
                                        } else {
                                            if (formatter.itemCategoryToDropShip(row.ItemCategory)) {
                                                val = _determineItemCategoryForDropShip(model.getProperty('/' + rowIdx));
                                            } else {
                                                val = _determineItemCategoryForBroughtIn(model.getProperty('/' + rowIdx));
                                            }
                                        }

                                    }
                                    model.setProperty('/' + rowIdx + '/' + property, val);
                                }
                            });
                        });


                    },

                    _createIndexChainFromParent = function(parentLineID, rows, array) {
                    	var idx = _.findIndex(rows, {SalesDocumentLineID: parentLineID});
                    	
                    	if (idx != -1) {
                    		array.push(idx);
                    		_.each(rows, function (row, index, list) {
                    			if (row.ParentLineID == parentLineID) {
                    				array = _createIndexChainFromParent(row.SalesDocumentLineID, list, this);
                    			}
                    		}, array);
                    	}
                    	
                    	return array;
                    },
                    
                    _findUltimateParentLineID = function(row, rows) {
                    	var parentLine = null;
                    	
                    	if (!row.ParentLineID || parseInt(row.ParentLineID) == 0) return row.SalesDocumentLineID;
                    	
                    	parentLine = _.findWhere(rows, {SalesDocumentLineID : row.ParentLineID});
                    	
                    	if (!parentLine) return row.SalesDocumentLineID;
                    	
                    	return _findUltimateParentLineID(parentLine, rows);
                    },
                    
                    
                    _isEmpty = function() {
                    	var details = view.getModel('currentSalesDocumentLines').getData();
                    	
                    	if (!details || details.length == 0) return true;

						if (details.length > 1) return false;

						if (!details[0].MaterialID) return true;
                    	
                    	return false;
                    },
                    
                    handleChangeHeaderCustomerPOID = function(event) {
                    	var source = event.getSource(),
							binding = source.getBinding('value'),
							row = {},
							customerPOID = source.getValue(),
							lineModel = view.getModel('currentSalesDocumentLines'),
							lines = lineModel.getData();
                    	
                    	if (!!customerPOID) {
                    		customerPOID = customerPOID;
                    		binding.setValue(customerPOID);
                    	}
                    	
                    	for (var i = 0, len = (!!lines) ? lines.length : 0; i < len; i++) {
                    		row = lines[i];
                    		if (!row.WBSElement) row.CustomerPOID = customerPOID;
                    	}
                    	
                    	lineModel.refresh(true);                    	
                    	
                    },
                    
                handleChangeHeaderReqDate = function(event) {
                	var source = event.getSource(),
					binding = source.getBinding('dateValue'),
					row = {},
					reqdate = binding.getValue(),
					lineModel = view.getModel('currentSalesDocumentLines'),
					lines = lineModel.getData();
            	
            	for (var i = 0, len = (!!lines) ? lines.length : 0; i < len; i++) {
            		row = lines[i];
					if (!row.WBSElement) row.DeliveryDate = reqdate;
            	}
            	
            	lineModel.refresh(true);                    	
            	
            },
            
            _findPartnerID = function(value, collection) {
            	var partner =  _.findWhere(
            	_.map(core.getModel('customerSelectItems').getProperty('/'+collection), function(n) {
            		return {PartnerID: n.PartnerID, text: ((n.PartnerID) ? parseInt(n.PartnerID,10) + ' - ' : '') + ((n.PartnerName) ? n.PartnerName : '') + ((n.Street) ? ', ' + n.Street : '') + ((n.Street2) ? ', ' + n.Street2 : '') + ((n.Street3) ? ', ' + n.Street3 : '') + ((n.Street4) ? ', ' + n.Street4 : '')+ ((n.City) ? ', ' + n.City : '') + ((n.State) ? ', ' + n.State : '') + ((n.Zip) ? ', ' + n.Zip : '') + ((n.Country) ? ', ' + n.Country : '')};
            	}), {text: value});
            	
            	return (partner) ? partner.PartnerID : 0;
            },
            
                
            handleChangeHeaderShipTo = function(event) {
            	var source = event.getSource(),
				row = {},
				model = view.getModel('currentSalesDocument'),
				lineModel = view.getModel('currentSalesDocumentLines'),
				partnerID = _findPartnerID(source.getValue(),'ShipTos'),
				lines = lineModel.getData();
        	
            	if (!partnerID) {
        			source.setTooltip(new sap.ui.commons.RichTooltip({
         				text : 'Ship To Party does not exist.  Please select from the displayed options.'
         			}));
        			source.setValueState(sap.ui.core.ValueState.Error);
            		event.preventDefault();
            		return;
            	}
            	
            	source.setValueState(sap.ui.core.ValueState.None);
    			source.setTooltip();
            	
            	model.setProperty('/ShipToID', partnerID);
            	
       		 	sap.m.MessageBox.confirm("Do you wish to reset all detail lines to this Ship To address?", function (confirmation) {
   		 			if (confirmation != 'CANCEL') {
	   		         	for (var i = 0, len = (!!lines) ? lines.length : 0; i < len; i++) {
	   		        		row = lines[i];
							if (!row.WBSElement) row.ShipToID = partnerID;
	   		        	}
	   		        	
	   		        	lineModel.refresh(true);                    	
   		 			}
   		 		}, "Change all detail lines?");
        },
        
        handleChangeHeaderBillTo = function(event) {
        	var source = event.getSource(),
			model = view.getModel('currentSalesDocument'),
			partnerID = _findPartnerID(source.getValue(),'BillTos');
    	
        	if (!partnerID) {
    			source.setTooltip(new sap.ui.commons.RichTooltip({
     				text : 'Bill To Party does not exist.  Please select from the displayed options.'
     			}));
    			source.setValueState(sap.ui.core.ValueState.Error);
        		event.preventDefault();
        		return;
        	}
        	
        	source.setValueState(sap.ui.core.ValueState.None);
			source.setTooltip();
        	
        	model.setProperty('/BillToID', partnerID);
        	
   		 },

		handleChangeHeaderPayer = function(event) {
			var source = event.getSource(),
			model = view.getModel('currentSalesDocument'),
			partnerID = _findPartnerID(source.getValue(),'Payers');

			if (!partnerID) {
				source.setTooltip(new sap.ui.commons.RichTooltip({
					text : 'Payer does not exist.  Please select from the displayed options.'
				}));
				source.setValueState(sap.ui.core.ValueState.Error);
				event.preventDefault();
				return;
			}

			source.setValueState(sap.ui.core.ValueState.None);
			source.setTooltip();

			model.setProperty('/PayerID', partnerID);

		},

		handleChangeHeaderEndCustomer = function(event) {
			var source = event.getSource(),
			model = view.getModel('currentSalesDocument'),
			partnerID = _findPartnerID(source.getValue(),'EndCustomers');

			if (!partnerID) {
				source.setTooltip(new sap.ui.commons.RichTooltip({
						text : 'End Customer does not exist.  Please select from the displayed options.'
					}));
				source.setValueState(sap.ui.core.ValueState.Error);
				event.preventDefault();
				return;
			}

			source.setValueState(sap.ui.core.ValueState.None);
			source.setTooltip();

			model.setProperty('/EndCustomerID', partnerID);

		},

        handleSuggestPartner = function(event) {
    	    var term = event.getParameter("suggestValue"),
		    	source = event.getSource(),
		    	binding = source.getBinding('value'),
		    	partners = null,
		    	path = binding.getPath(),
		    	suggestions = [];

            if (!path && !! binding.getBindings()) {
                binding = binding.getBindings()[0];
                path = binding.getPath();
            }
    	    if (path && path[0] != '/') path = '/' + path;

    	    switch (path) {
		    	case '/ShipToID' :
		    		partners = view.getModel('customerSelectItems').getData()["ShipTos"];
		    		break;
		    	case '/BillToID' :
		    		partners = view.getModel('customerSelectItems').getData()["BillTos"];
		    		break;
		    	case '/PayerID' :
		    		partners = view.getModel('customerSelectItems').getData()["Payers"];
		    		break;
		    	case '/EndCustomerID' :
		    		partners = view.getModel('customerSelectItems').getData()["EndCustomers"];
		    		break;
    	    }

    	    if (partners) {
		    	suggestions = $.grep(partners, function(n){
		    		var target = ((n.PartnerID) ? parseInt(n.PartnerID,10) + ' - ' : '') + ((n.PartnerName) ? n.PartnerName : '') + ((n.Street) ? ', ' + n.Street : '')  + ((n.Street2) ? ', ' + n.Street2 : '')  + ((n.Street3) ? ', ' + n.Street3 : '')  + ((n.Street4) ? ', ' + n.Street4 : '') + ((n.City) ? ', ' + n.City : '') + ((n.State) ? ', ' + n.State : '') + ((n.Zip) ? ', ' + n.Zip : '')+ ((n.Country) ? ', ' + n.Country : '');
		 	      return target.match(new RegExp(term, "i"));
		 	    });
        	}

		    source.destroySuggestionItems();
		    for (var i = 0, len = (!!suggestions) ? suggestions.length : 0; i < len; i++) {
		    	source.addSuggestionItem(new sap.ui.core.Item({
		    		text: parseInt(suggestions[i].PartnerID,10) + ' - ' + suggestions[i].PartnerName + ((suggestions[i].Street) ? ', ' + suggestions[i].Street : '') + ((suggestions[i].Street2) ? ', ' + suggestions[i].Street2 : '') + ((suggestions[i].Street3) ? ', ' + suggestions[i].Street3 : '') + ((suggestions[i].Street4) ? ', ' + suggestions[i].Street4 : '') + ((suggestions[i].City) ? ', ' + suggestions[i].City : '') + ((suggestions[i].State) ? ', ' + suggestions[i].State : '') + ((suggestions[i].Zip) ? ', ' + suggestions[i].Zip : '') + ((suggestions[i].Country) ? ', ' + suggestions[i].Country : ''),
		    	}));
		    }
        },
                            
		handleMfrHelp = function (controller) {
			this.inputId = controller.oSource.sId;
			// create value help dialog
			if (!this._valueHelpDialog) {
			  this._valueHelpDialog = sap.ui.xmlfragment(
				"gdt.salesui.fragment.DetailMfrSelectDialog",
				this
			  );
			  view.addDependent(this._valueHelpDialog);
			}

			// open value help dialog
			this._valueHelpDialog.open();
		  },

		  handleMfrHelpSearch = function (evt) {
			var value = evt.getParameter("value");
			var filter = new sap.ui.model.Filter(
			  "ManufacturerName",
			  sap.ui.model.FilterOperator.Contains, value
			);
			evt.getSource().getBinding("items").filter([filter]);
		  },

		  handleMfrHelpClose = function (evt) {
			var selectedItem = evt.getParameter("selectedItem"),
				details = view.getModel('currentSalesDocumentLines');
			if (selectedItem) {

			  var control = view.byId(this.inputId),
				  rowid = control.data("rowid"),
				  row = {},
				  binding = control.getBinding('value');
			  binding.setValue(selectedItem.getDescription());
			  if (binding.getPath() == 'ManufacturerID') {
				  row = _findRow(rowid)[0];
				  row.VendorID = selectedItem.getDescription();
				  details.refresh(false);
			  }
			}
			evt.getSource().getBinding("items").filter([]);
		  },

		_pad = function (n, width, z) {
			  var 	paddingChar = z || '0',
					stringToPad = n + '';
			  return stringToPad.length >= width ? stringToPad : new Array(width - stringToPad.length + 1).join(paddingChar) + stringToPad;
		},

		handleAddDetailLine = function(event) {
			var details = view.getModel('currentSalesDocumentLines'),
				detailsArray = details.getData(),
				ui5tbl = view.byId('lineItemsTable'),
				tbl = $('#'+view.byId('lineItemsTable').getId()),
				startRow = ui5tbl.getFirstVisibleRow(),
				numRows = $(tbl).find('tr:not(:has(th))').length;

			detailsArray.push(_createNewLine());
			details.refresh(false);

			setTimeout(function () {
				if (startRow < detailsArray.length - numRows) {
					ui5tbl.setFirstVisibleRow(detailsArray.length - numRows);
				};
			},1000);
		},

		_createNewLine = function(detailsArray) {
			var salesDocument = view.getModel('currentSalesDocument'),
				salesDocumentID = salesDocument.getProperty('/SalesDocumentID'),
				deliveryDate = salesDocument.getProperty('/RequestedDeliveryDate'),
				shipToID = salesDocument.getProperty('/ShipToID'),
				wbsElement = salesDocument.getProperty('/WBSElement'),
				otstAddressID = salesDocument.getProperty('/OTSTAddressID'),
				otstCity = salesDocument.getProperty('/OTSTCity'),
				otstName = salesDocument.getProperty('/OTSTName'),
				otstPhone = salesDocument.getProperty('/OTSTPhone'),
				otstState = salesDocument.getProperty('/OTSTState'),
				otstStreet = salesDocument.getProperty('/OTSTStreet'),
				otstZip = salesDocument.getProperty('/OTSTZip'),
				customerPOID = salesDocument.getProperty('/CustomerPOID'),
				maxLineNum = 0,
				newLine = jQuery.extend(true, {}, core.getModel('blankDetailLine').getData()),
				userid = core.getModel('systemInfo').getProperty('/Uname'),
				today = new Date(Date.now()),
				maxStructuredLineNum = 0;

			if (!detailsArray) {
				detailsArray = view.getModel('currentSalesDocumentLines').getData();
			}

			for (key in detailsArray) {
				var lineNum = (!!detailsArray[key].SalesDocumentLineID) ? parseInt(detailsArray[key].SalesDocumentLineID) : 0,
					//structuredLineNum = (!!detailsArray[key].StructuredLineID) ? parseInt(detailsArray[key].StructuredLineID.substring(0,detailsArray[key].StructuredLineID.indexOf('.'))) : 0;
						structuredLineNum = (!!detailsArray[key].StructuredLineID) ? parseInt(detailsArray[key].StructuredLineID) : 0;
						if (lineNum > maxLineNum) {
					maxLineNum = lineNum;
				}
				if (structuredLineNum > maxStructuredLineNum) {
					maxStructuredLineNum = structuredLineNum;
				}
			}

			newLine.QTY = "1";
            newLine.SmartNetDuration = '';
			newLine.MaterialGroup = 'Z2'; // Default to Hardware
			newLine.SalesDocumentLineID = _pad(maxLineNum + 10,6);
			newLine.StructuredLineID = (maxStructuredLineNum + 1).toString() + '.0';
			newLine.SalesDocumentID = salesDocumentID;
			newLine.SalesDocumentID = view.getModel('currentSalesDocument').getProperty('/SalesDocumentID');
			newLine.CustomerPOLineID = (maxLineNum + 10).toString();
			newLine.DeliveryDate = deliveryDate;
			newLine.ShipToID = shipToID;
			newLine.ItemCategory = _determineItemCategoryForDropShip(newLine);
			newLine.WBSElement = wbsElement;
			newLine.OTSTAddressID = otstAddressID;
			newLine.OTSTCity = otstCity;
			newLine.OTSTName = otstName;
			newLine.OTSTPhone = otstPhone;
			newLine.OTSTState = otstState;
			newLine.OTSTStreet = otstStreet;
			newLine.OTSTZip = otstZip;
			newLine.CustomerPOID = customerPOID;
			newLine.CreatedBy = userid;
			newLine.CreatedOn = today;
			newLine.UpdatedBy = userid;
			newLine.LastUpdatedOn = today;
			newLine.Selected = true;

			return newLine;
		},

		handleDeleteButtonPress = function(event) {
			var currentState = core.getModel('currentState'),
				currentDocument = core.getModel('currentSalesDocument');

			sap.m.MessageBox.confirm("Are you sure you wish to delete this " +
					(currentState.getProperty('/isQuote') ? "Quote?" : "Sales Order?") +
					".  This operation cannot be undone!", function (confirmation) {
				if (confirmation != 'CANCEL') {
					datacontext.salesdocuments.remove(currentDocument.getProperty('/SalesDocumentID')).done(function(){
					core.getModel("currentState").setProperty('/isEditMode', false);
					core.getModel("currentState").setProperty('/isNotEditMode', true);
					eventBus.publish("master","salesDocAltered", currentDocument.getData());
					_exit();
				}).fail(function(err){
					var uniqueList=err.split('\n').filter(function(item,i,allItems){
					    return i==allItems.indexOf(item);
					}).join(',');
					var msg;
					if(uniqueList){
						msg = uniqueList;
					}
					sap.m.MessageBox.show((msg) ? msg : "SalesUI Could not delete this Document from SAP.", {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "SAP Error",
						actions: sap.m.MessageBox.Action.OK,
						onClose: null});	
				});
				}
			}, "Confirm Delete Document");
		},

		_deleteDetailLines = function () {
			var deferred,
				currentDocumentLines = core.getModel('currentSalesDocumentLines'),
				rows = currentDocumentLines.getData(),
				linesToDelete = _.where(rows, {DeletedFlag: true}),
				l = (!!linesToDelete) ? linesToDelete.length : 0;

			deferred = $.Deferred(function (def) {
				if (l > 0) {
					sap.m.MessageBox.confirm("Are you sure you wish to delete these " + l + " line items?", function (confirmation) {
						if (confirmation != 'CANCEL') {
							_.each(rows, function (row) {
								if (!!row.DeletedFlag && !!row.ReasonForRejection) {
									row.MarkedAsDeleted = true;
									row.DeletedFlag = false;
								}
							});
							currentDocumentLines.setData(_.reject(rows, function (row) {
								return row.DeletedFlag;
							}));
							view.setModel(core.getModel('currentSalesDocumentLines'), 'currentSalesDocumentLines');
							_calculateTotals();
							def.resolve();
						} else {
							def.reject('Delete lines canceled');
						}
					}, "Confirm Delete Line");
				} else {
					def.resolve();
				}
			});

			return deferred.promise();
		},
		
		

		handlePartIDHelp = function (event) {
			var dialog = view.byId('detailLinePartSearchDialog'),
				busy = view.byId('partSearchBusy'),
				searchFn = null,
				source = event.getSource(),
				binding = source.getBinding('value'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = model.getProperty(context.getPath()),
				saveRow = jQuery.extend(true, {}, row),
				manufacturerPartID = source.getValue().toUpperCase();


			dialog.addStyleClass("sapUiSizeCompact");

			dialog.attachEventOnce("confirm", null, function(evt) {
					var mfrPartID = evt.getParameter("selectedItem").getCells()[0].getText(),
						mfrID = _.findWhere(view.getModel('globalSelectItems').getProperty('/Manufacturers'),{ManufacturerName:evt.getParameter("selectedItem").getCells()[1].getText()}).ManufacturerID;

					model.setProperty(context.getPath()+binding.getPath(), mfrPartID);
					if (binding.getPath() == 'CustomerPartID' && model.getProperty(context.getPath()+'/ManufacturerID') != mfrID) {
						model.setProperty(context.getPath()+'/ManufacturerID', mfrID);
					}
					source.setValue(mfrPartID);
					_doChangePartID(source);
				});

			searchFn = function(evt) {
				var value = evt.getParameter("value");

				value = value.toUpperCase();

				busy.open();
				setTimeout(function () {
					core.getModel().read("/MaterialsSet?$filter=CustomerId eq '' and ManufacturerNo eq '"+ row.ManufacturerID +"' and ManufacturerPartId eq'" + value + "'and ALL eq 'S'",  {
						success: function(data, response) {
							var globalSelectItems = view.getModel('globalSelectItems');
							data.results.unshift({MfrpartId: '', Description: '', ListPrice:'', ManufacturerNo: ''});
							globalSelectItems.setProperty('/MaterialsSet', data.results);
							setTimeout(function () {
								busy.close();
							});
						},
						error: function(data, response){
							setTimeout(function () {
								busy.close();
							});
						}

					});
				});

				dialog.attachEventOnce("search", null, searchFn);
				dialog.attachEventOnce("change", null, searchFn);
			};

			event.getParameters().value = manufacturerPartID;
			searchFn(event);

			dialog.attachEventOnce("cancel", null, function(){
				model.setProperty(context.getPath(), saveRow);
			});


			setTimeout(function () {
				core.getModel().read("/MaterialsSet?$filter=CustomerId eq '' and ManufacturerNo eq '"+ row.ManufacturerID +"' and ManufacturerPartId eq'" + manufacturerPartID + "'and ALL eq 'S'",  {
					success: function(data, response) {
						var globalSelectItems = view.getModel('globalSelectItems');
						data.results.unshift({MfrpartId: '', Description: '', ListPrice:'', ManufacturerNo: ''});
						globalSelectItems.setProperty('/MaterialsSet', data.results);
						dialog.setBusy(false);
					},
					error: function(data, response){
						dialog.setBusy(false);
					}

				});
			});

			dialog.open(manufacturerPartID);
		},

		handleChangePartID = function(event){
			_doChangePartID(event.getSource());
		},

		_calculateExtendedValue = function(row, qty, unitValue) {
			var extendedValue = unitValue * qty;

			return Math.round(extendedValue * 100.0) / 100.0; // round to pennies
		},

		_lookupPartID = function(row, manufacturerPartID, override, isCustomerPartID, success, fail, localOnly) {
			var key = {
						CustomerID : core.getModel('currentCustomer').getProperty('/CustomerID'),
						ManufacturerID : row.ManufacturerID,
						MaterialID : '',
						MfrPartID : (!!manufacturerPartID) ? (($.isNumeric(manufacturerPartID)) ?  manufacturerPartID.toUpperCase().trim().replace(/^0+/, '') : manufacturerPartID.toUpperCase().trim()) : '',
				},
				def = null,
				localVal = null,
				successFn = function (data, success, deferred) {
					var listPrice = parseFloat((override) ? data.ListPrice : row.ListPrice),
						materialID = (!!data.MaterialID) ? data.MaterialID.replace(/^0+/, '') : null,
						vdrMatch = null,
						mfr = null,
						mfrs = view.getModel('globalSelectItems').getData()["Manufacturers"] || [],
						vdrs = view.getModel('globalSelectItems').getData()["Vendors"] || [],
						gdtDiscount = parseFloat((override) ? ((!!data.GDTDiscount) ? data.GDTDiscount : 0.00) : row.GDTDiscount),
						gdtDiscountPercent = (listPrice != 0) ? (gdtDiscount * -100 / listPrice) : 0.00,
						qty = parseFloat(row.QTY),
						unitCost = Math.round((listPrice + gdtDiscount) * 100.0) / 100.0,
						customerDiscount = parseFloat((override) ? ((!!data.CustomerDiscount) ? data.CustomerDiscount : 0.00) : row.CustomerDiscount),
						customerDiscountPercent = (listPrice != 0) ? (customerDiscount * -100 / listPrice) : 0.00,
						unitPrice = Math.round((listPrice + customerDiscount) * 100.0) / 100.0,
						extendedCost,
						extendedPrice,
						grossProfit,
						grossProfitPercentage;

					if (!override) {
						if (!!row.GDTDiscountPercent) {
							gdtDiscountPercent = row.GDTDiscountPercent;
							gdtDiscount = Math.round(listPrice * gdtDiscountPercent) / -100.0;
							unitCost = Math.round((listPrice + gdtDiscount) * 100.0) / 100.0;
						}

						if (!!row.CustomerDiscountPercent) {
							customerDiscountPercent = row.CustomerDiscountPercent;
							customerDiscount = Math.round(listPrice * customerDiscountPercent) / -100.0;
							unitPrice = Math.round((listPrice + customerDiscount) * 100.0) / 100.0;
						}
					}

					extendedCost = _calculateExtendedValue(row, qty, unitCost);
					extendedPrice = _calculateExtendedValue(row, qty, unitPrice);
					grossProfit = extendedPrice - extendedCost;
					grossProfitPercentage = (extendedPrice > 0) ? Math.round(((grossProfit / extendedPrice) * 100.0) * 1000.0) / 1000.0 : 0.0;


					if (materialID && materialID != '') {
						row.MaterialGroup = data.MaterialGroup;
						row.MARAMaterialGroup = data.MARA_MaterialGroup;
						row.EDelivery = data.EDelivery;
						row.ListPrice = listPrice.toString();
						row.UnitCost = unitCost.toString();
						row.ExtendedCost = extendedCost.toString();
						row.UnitPrice = unitPrice.toString();
						row.ExtendedPrice = extendedPrice.toString();
						row.GrossProfitPercentage = grossProfitPercentage.toString();
						row.GrossProfit = grossProfit.toString();
						row.GDTDiscount = gdtDiscount.toString();
						row.CustomerDiscount = customerDiscount.toString();
						row.GDTDiscountPercent = gdtDiscountPercent.toString();
						row.CustomerDiscountPercent = customerDiscountPercent.toString();
						if (isCustomerPartID) {
							row.ManufacturerID = data.ManufacturerID;
							row.CustomerPartID = data.MfrPartID;
							row.CustomerMaterialID = materialID;
							row.ManufacturerPartID = row.CustomerPartID;
							row.MaterialID = materialID;
							row.Description = (override) ? data.Description : (row.Description) ? row.Description : data.Description;
							if (!row.VendorID) {
								row.VendorID = data.DefaultVendorID;
								if (!row.VendorID) {
									mfr = _.findWhere(mfrs, {ManufacturerID: row.ManufacturerID});
									if (mfr) {
										vdrMatch = _.findWhere(vdrs, {SortL: mfr.SortL});
										if (vdrMatch) row.VendorID = vdrMatch.ManufacturerID;
									}
								}
							}
						} else {
							row.MaterialID = materialID;
							row.ManufacturerPartID = data.MfrPartID;
						}
					} else {
						if (!isCustomerPartID) {
							row.MaterialID = null;
						} else {
							row.CustomerMaterialID = null;
						}
					}

					if (formatter.itemCategoryToStaging(row.ItemCategory)) {
						row.ItemCategory = _determineItemCategoryForStaging(row);
					} else {
						if (formatter.itemCategoryToDropShip(row.ItemCategory)) {
							row.ItemCategory = _determineItemCategoryForDropShip(row);
						} else {
							row.ItemCategory = _determineItemCategoryForBroughtIn(row);
						}
					}

					if (!!success) success(row);

					if (!!deferred) deferred.resolve(row);

					return row;
				},
				failFn = function (data, fail, deferred) {
					var response = null,
						message = '',
						error = {},
						errordetails = [],
						msg = "SalesUI Could not fetch the material details for " + manufacturerPartID + " from SAP.";

					if (data && data.response && data.response.body) {
						response = $.parseJSON(data.response.body);
					}

					if (response && response.error) {
						error = response.error;
						if (error.innererror && error.innererror.errordetails && error.innererror.errordetails.length > 0) {
							errordetails = error.innererror.errordetails;
							for (var i = 0, len = errordetails.length; i < len; i++) {
								if (errordetails[i].message && errordetails[i].message.length > 0) {
									if (message.length != 0) message += '\n';
									message += errordetails[i].message;
								}
							}
							msg = message;
						} else {
							if (response.error.message && response.error.message.value) {
								msg = response.error.message.value;
							}
						}
					}

					if (!!fail) fail(row);

					if (!!deferred) {
						deferred.resolve(row); // Do not reject promise...otherwise all other updates will fail.
						sap.m.MessageToast.show(msg);
					}

					return row;
				};

			if (key.MfrPartID.length === 0) {
				if (!localOnly) {
					return $.Deferred(function (defer) {
						defer.resolve(row);
					});
				}
				return null;
			}

			if (key.MfrPartID.length == 9 && parseInt(key.MfrPartID).toString() == key.MfrPartID) { // GDT SAP Material ID
				key.MaterialID = key.MfrPartID;
				key.MfrPartID = '';
			}

			if (!localOnly) {
				def = $.Deferred(function (deferred) {
					datacontext.materials.get(key)
						.done(function(data) {
							successFn(data, success, deferred);
						}).fail(function(data) {
							failFn(data, fail, deferred);
						});
				});
				return def.promise();
			}

			localVal = datacontext.materials.getLocal(key);

			if (!!localVal) {
				return successFn(localVal);
			}

			return failFn("Material " + key.MfrPartID + " not found");

		},

		_doChangePartID = function(source) {

			var	binding = source.getBinding('value'),
				context = binding.getContext(),
				rowModel = binding.getModel(),
				row = (context) ? rowModel.getProperty(context.getPath()) : rowModel.getData(),
				manufacturerPartID = source.getValue().toUpperCase(),
				page = view.byId('detailPage'),
				isCustomerPartID = (binding.getPath() == 'CustomerPartID');


			page.setBusyIndicatorDelay(0);
			page.setBusy(true);

			setTimeout(function () {

				_lookupPartID(row, manufacturerPartID, true, isCustomerPartID, function(data) {
					if ((isCustomerPartID && data.CustomerMaterialID) || (!isCustomerPartID && data.MaterialID)) {
						source.setValueState(sap.ui.core.ValueState.None);
						source.setTooltip();

						data.HasDistroFlag = (data.ManufacturerID != data.VendorID || _pad(data.MaterialID, 18) != _pad(data.CustomerMaterialID, 18));

						if (context) {
							rowModel.setProperty(context.getPath(),data);
						} else {
							rowModel.setData(data);
						}
						if (formatter.itemCategoryToStaging(data.ItemCategory)) {
							data.ItemCategory = _determineItemCategoryForStaging(data);
						} else {
							if (formatter.itemCategoryToDropShip(data.ItemCategory)) {
								data.ItemCategory = _determineItemCategoryForDropShip(data);
							} else {
								data.ItemCategory = _determineItemCategoryForBroughtIn(data);
							}
						}
						_calculateTotals();
					} else {
						source.setTooltip(new sap.ui.commons.RichTooltip({
							text : 'Part number does not exist in the Master Data for this Manufacturer.  If you believe it is correct, please contact the Master Data Maintenance group.'
						}));
						source.setValueState(sap.ui.core.ValueState.Error);
					};
					page.setBusy(false);
				}, function() {
					source.setTooltip(new sap.ui.commons.RichTooltip({
						text : 'Part number does not exist in the Master Data for this Manufacturer.  If you believe it is correct, please contact the Master Data Maintenance group.'
					}));
					source.setValueState(sap.ui.core.ValueState.Error);
					page.setBusy(false);
				})
			});
		},

		_findTrForRow = function(row) {
			var ui5tbl = view.byId('lineItemsTable'),
				data = view.getModel('currentSalesDocumentLines').getData(),
				startRow = ui5tbl.getFirstVisibleRow(),
				lastRow = 0,
				numRows = (data) ? data.length : 0,
				tbl = $('#'+view.byId('lineItemsTable').getId()),
				currentDocumentLines = view.getModel('currentSalesDocumentLines').getData(),
				rowidx = _.findIndex((currentDocumentLines) ? view.getModel('currentSalesDocumentLines').getData() : [], {StructuredLineID: row.StructuredLineID});

			if (!tbl || rowidx < 0) return null;

			if (rowidx < startRow) return null;

			rowidx -= startRow;

			lastRow = $(tbl).find('tr:not(:has(th))').length - 1;

			if (rowidx > lastRow) return null;

			return $(tbl).find('tr:not(:has(th))')[rowidx];
		},

		_findTrForRowInUnfrozenSection = function(row) {
			var ui5tbl = view.byId('lineItemsTable'),
				data = view.getModel('currentSalesDocumentLines').getData(),
				startRow = ui5tbl.getFirstVisibleRow(),
				lastRow = 0,
				numRows = (data) ? data.length : 0,
				tbl = $('#'+view.byId('lineItemsTable').getId()),
				$parent = $(tbl).closest('div'),
				$tbls = $parent.find('table'),
				currentDocumentLines = view.getModel('currentSalesDocumentLines').getData(),
				rowidx = _.findIndex((currentDocumentLines) ? view.getModel('currentSalesDocumentLines').getData() : [], {SalesDocumentLineID: row.SalesDocumentLineID});

			if (!tbl || rowidx < 0) return null;

			if ($tbls.length <= 1) return null;

			if (rowidx < startRow) return null;

			rowidx -= startRow;

			lastRow = $($tbls[1]).find('tr:not(:has(th))').length - 1;

			if (rowidx > lastRow) return null;

			return $($tbls[1]).find('tr:not(:has(th))')[rowidx];
		},

		_setErrorInRowIndicator = function(tr, on, classname) {
			var $tr = $(tr);

			if (on) {
				if ($tr && !$tr.hasClass(classname)) $tr.addClass(classname);
			} else {
				if ($tr && $tr.hasClass(classname)) $tr.removeClass(classname);
			}

		},

		handleChangeLineID = function (event) {
			var source = event.getSource(),
				binding = source.getBinding('value'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = model.getProperty(context.getPath()),
				parentRow = {},
				_rows = [],
				ui5tbl = view.byId('lineItemsTable'),
				tbl = $('#'+view.byId('lineItemsTable').getId()),
				startRow = ui5tbl.getFirstVisibleRow(),
				newStartRow,
				numRows = $(tbl).find('tr:not(:has(th))').length,
				thisRowIdx = _.findIndex(model.getData(), function(line) {
					return line.SalesDocumentLineID == row.SalesDocumentLineID;
				}),
				thisRowNewIdx,
				refreshAllLines = false,
				params = {parentLineID: '', rows: [], sortedRows: [], result: false},
				structuredLineID = source.getValue(),
				parentPartIdx = (structuredLineID && structuredLineID.lastIndexOf) ? structuredLineID.lastIndexOf(".") : -1,
				topParentPartIdx = (structuredLineID && structuredLineID.indexOf) ? structuredLineID.indexOf(".") : -1,
				parentPart = (parentPartIdx > 0) ? structuredLineID.substring(0,parentPartIdx) : "",
				childPart = (parentPartIdx > 0) ? structuredLineID.substring(parentPartIdx + 1) : structuredLineID,
				canonicalLineID = (structuredLineID.lastIndexOf(".") != -1 && parseInt(structuredLineID.substring(structuredLineID.lastIndexOf(".") + 1)) == 0) ? structuredLineID.substring(0, structuredLineID.lastIndexOf(".")) : structuredLineID;

			if (!(parentPartIdx == -1 || (parentPartIdx == topParentPartIdx && parseInt(childPart) == 0))) {
				// This line id indicates that there is a parent line
				_rows = _findRowByStructuredLineID(parentPart);
				if (!!_rows && _rows.length >= 1) {
					parentRow = _rows[0];
					row.ParentLineID = parentRow.SalesDocumentLineID;
				} else {
					source.setTooltip(new sap.ui.commons.RichTooltip({
						text : 'Line  refers to a non-existent parent (' + parentPart + ')'
					}));
					source.setValueState(sap.ui.core.ValueState.Error);
					event.preventDefault();
					source.focus();
					return false;
				}
			} else {
				row.ParentLineID = '000000';
			}


			_rows = _findRowByStructuredLineID(canonicalLineID);

			if (!!_rows && _rows.length != 1) {
				source.setTooltip(new sap.ui.commons.RichTooltip({
					text : 'Duplicate line number (be aware that line number ' + canonicalLineID + ' is considered the same as line number ' + canonicalLineID + '.0)'
				}));
				source.setValueState(sap.ui.core.ValueState.Error);
				event.preventDefault();
				source.focus();
				return false;
			}

			//model.setProperty(context.getPath(),row);


			if (_renumberChildren(row.SalesDocumentLineID, structuredLineID)) {
				refreshAllLines = true;
			}

			params.rows = $.extend(true, [], view.getModel('currentSalesDocumentLines').getData());
			params.parentLineID = '000000';

			params = _reorderChildren(params);

			view.byId('detailPage').setBusyIndicatorDelay(0);

			if (params.sortedRows && params.sortedRows.length > 0) {
				_rows = params.sortedRows;
				_repointLines(_rows);
				view.getModel('currentSalesDocumentLines').setData(_rows);
			} else {
				if (refreshAllLines) {
					view.getModel('currentSalesDocumentLines').refresh(true);
				}
			}

			thisRowNewIdx = _.findIndex(_rows, function(line) {
				return line.StructuredLineID == structuredLineID;
			});


			if (thisRowNewIdx != thisRowIdx) { // Row has moved on screen so find it again.
				console.log('Old Start ' + startRow);
				console.log('Old Row Idx ' + thisRowIdx);
				console.log('Pos was ' + (thisRowIdx - startRow));
				console.log('New Row Idx ' + thisRowNewIdx);
				console.log('New Start ' + (thisRowNewIdx - (thisRowIdx - startRow)));
				newStartRow = thisRowNewIdx - (thisRowIdx - startRow);

				if (newStartRow < 0) {
					event.preventDefault();
					event.cancelBubble();
					setTimeout(function() {
						ui5tbl.setFirstVisibleRow(0);
						setTimeout(function() {
							$($($(tbl).find('tr:not(:has(th))')[(thisRowIdx - startRow) + newStartRow]).find('input')[2]).focus();
						},500);
					},0)
				} else {
					if (newStartRow > (_rows.length - numRows)) {
						ui5tbl.setFirstVisibleRow(_rows.length - numRows);
						setTimeout(function() {
							$($($(tbl).find('tr:not(:has(th))')[(numRows - 1)]).find('input')[2]).focus();
						},500);
					} else {
						ui5tbl.setFirstVisibleRow(newStartRow);
					}
				}
			}
		},
		_repointLines = function (rows) {
			var lineNoLookup = [],
				newLineNo = '',
				oldLineNo = '',
				lineIdx = 1;

			for (var i = 0, len = (!!rows) ? rows.length : 0; i < len; i++) {
				oldLineNo = rows[i].SalesDocumentLineID;
				newLineNo = ((lineIdx++) * 10).toString();
				lineNoLookup[oldLineNo] = newLineNo;
				rows[i].SalesDocumentLineID = newLineNo;
				if (lineNoLookup[rows[i].ParentLineID]) rows[i].ParentLineID = lineNoLookup[rows[i].ParentLineID];
			}
		},
		_renumberChildren = function (parentLineID, parentStructuredID) {
			var canonicalParentLineID = (parentStructuredID.lastIndexOf(".") != -1 && parseInt(parentStructuredID.substring(parentStructuredID.lastIndexOf(".") + 1)) == 0) ? parentStructuredID.substring(0, parentStructuredID.lastIndexOf(".")) : parentStructuredID,
				children = _findLinesByParentLineID(parentLineID),
				child = {},
				structuredLineID = '',
				parentPartIdx = 0,
				parentPart = '',
				childOfZero = false,
				childPart =  '';

			if (!children || children.length == 0) return false;

			for (var i = 0, len = children.length; i < len; i++) {
				child = children[i];
				structuredLineID = child.StructuredLineID;
				parentPartIdx = (structuredLineID && structuredLineID.lastIndexOf) ? structuredLineID.lastIndexOf(".") : -1;
				parentPart = (parentPartIdx > 0) ? structuredLineID.substring(0,parentPartIdx) : "";
				childPart = (parentPartIdx > 0) ? structuredLineID.substring(parentPartIdx + 1) : "";
				childOfZero = (parentPart.lastIndexOf(".") != -1 && parseInt(parentPart.substring(parentPart.lastIndexOf(".") + 1)) == 0);
				if (childOfZero) {
					console.log(canonicalParentLineID);
				}
				child.StructuredLineID = canonicalParentLineID + ((childOfZero) ? '.0.' : '.') + childPart;

				_renumberChildren(child.SalesDocumentLineID, child.StructuredLineID);
			}

			return true;
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
		_findAllChildren = function (parentLineID, rows) {
			var children = _findLinesByParentLineID(parentLineID, rows).sort(_srt({key:'SalesDocumentLineID',dotted:true})),
				arr = [],
				allChildren = [];

			if (!children || children.length == 0) return allChildren;

			for (var i = 0, len = children.length; i < len; i++) {
				allChildren.push(children[i]);
				arr = _findAllChildren(children[i].SalesDocumentLineID, rows);
				for (var j = 0, lenj = arr.length; j < lenj; j++) {
					allChildren.push(arr[j]);
				}
			}

			return allChildren;
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
		_findLinesByParentLineID = function (parentLineID, rows){
			var currentSalesDocumentLines = rows || view.getModel('currentSalesDocumentLines').getData();

			return $.grep(currentSalesDocumentLines, function(n){
			  return (n.ParentLineID == parentLineID);
			});
		},

		_isReadyForSubmission = function(details) {
			var isReadyForSubmission = true,
				lines = view.getModel('currentSalesDocumentLines').getData();

			details.reason = '';

			_.each(lines, function(line) {
				var materialSeries = _determineMaterialSeries(line);

				if (!(materialSeries == materialSeries_ProfessionalServices  || materialSeries == materialSeries_Placeholder) && !line.VendorID) {
					isReadyForSubmission = false;
					details.reason += 'VendorID missing for line ' + line.StructuredLineID +'.\r\n';
				}
			});

			return isReadyForSubmission;
		},

		handleSubmitSalesOrder = function (event) {
			var msg = '',
				canSave = _canSave();

			if (!!core.getModel('currentState').getProperty('/isEditMode')) {
				if (canSave) {

					busyDlg.setText('Saving document in SAP.');
					busyDlg.open();

					setTimeout(function() {
						//_deleteDetailLines()
						_checkSelectedLines().done(function() {
							_doSave().done(function(id) {
								sap.m.MessageToast.show("Sales Document " + id + " has been saved.");
								_doSubmitSalesOrder();
							}).fail(function(msg) {
								sap.m.MessageBox.show((msg) ? msg : "SalesUI Could not save this record to SAP.", {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: "SAP Error",
									actions: sap.m.MessageBox.Action.OK,
									onClose: null});
							}).always(function() {
								busyDlg.close();
							});
						}).fail(function() {
							busyDlg.close();
						});
					},10);

				} else {
					msg = 'Document cannnot be saved, please correct the highlighted errors and try again.';
					console.log(msg);
					sap.m.MessageToast.show(msg);
				}
			} else {
				_doSubmitSalesOrder();
			}
		},
		_doSubmitSalesOrder = function() {
			var currentSalesDocument = view.getModel('currentSalesDocument'),
				currentState = view.getModel('currentState'),
				validityCheckDetails = {},
				lines = view.getModel('currentSalesDocumentLines').getData();

			if (!_isReadyForSubmission(validityCheckDetails)) {
				sap.m.MessageToast.show("Sales Order cannot be submitted yet:\n" + ((validityCheckDetails.reason) ? validityCheckDetails.reason : 'Unspecified reasons.') + "\n  Please address these issues and re-try.");
				return;
			}

			sap.m.MessageBox.confirm("Submitting this Sales Order will automatically create the Purchase Requisitions.  All further changes will have to be made by Purchasing.  Are you sure you want to Submit this Sales Order?",
					function(confirmation) {
						if (confirmation == 'OK') {
							currentState.setProperty('/isPendingSalesOrder',false);
							currentState.setProperty('/isSubmittedSalesOrder',true);
							for (var i = 0, len = (lines) ? lines.length : 0; i < len; i++) {
								if (formatter.itemCategoryToStaging(lines[i].ItemCategory)) {
									lines[i].ItemCategory = _determineItemCategoryForStaging(lines[i], true);
								} else {
									if (formatter.itemCategoryToDropShip(lines[i].ItemCategory)) {
										lines[i].ItemCategory = _determineItemCategoryForDropShip(lines[i], true);
									} else {
										lines[i].ItemCategory = _determineItemCategoryForBroughtIn(lines[i], true);
									}
								}
							}

							busyDlg.setText('Submitting Sales Order in SAP.');
							busyDlg.open();

							setTimeout(function() {
								_doSave().fail(function (msg) {
									currentState.setProperty('/isPendingSalesOrder', true);
									currentState.setProperty('/isSubmittedSalesOrder', false);
									sap.m.MessageBox.show(msg, {
										icon: sap.m.MessageBox.Icon.ERROR,
										title: "SAP Error",
										actions: sap.m.MessageBox.Action.OK,
									});
								}).always(function() {
									busyDlg.close();
								});
							});
						}
					},
					"Confirm Submit Sales Order");
		},

		handleDetailSelect = function(event) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo(
					"detail", {
						salesDocId : view.getModel('currentSalesDocument').getProperty('/SalesDocumentID'),
						customerId : view.getModel('currentSalesDocument').getProperty('/CustomerID'),
						tab : event.getParameter("selectedKey")
					}, true);
		},

		_calculateTotals = _.debounce(function() {
			var currentDocumentLines = view.getModel('currentSalesDocumentLines'),
				materialSeries,
				totalHardwarePrice = 0,
				totalHardwareCost = 0,
				totalOtherPrice = 0,
				totalOtherCost = 0,
				totalHardwareGP,
				totalOtherGP,
				totalHardwareGPP,
				totalOtherGPP,
				totalPrice,
				totalCost,
				totalGPP,
				totalGP,
				totals = view.getModel('currentTotals'),
				rows = (currentDocumentLines) ? currentDocumentLines.getData() : [];

			if (!totals) return;

			for (key in rows) {
				materialSeries = _determineMaterialSeries(rows[key]);

                if (!rows[key].ReasonForRejection && !rows[key].MarkedForDeletion) {
                    if (materialSeries == materialSeries_ProfessionalServices) {
                        totalOtherPrice += Math.round(parseFloat(rows[key].ExtendedPrice) * 100.0) / 100.0; // Round to pennies
                        totalOtherCost += Math.round(parseFloat(rows[key].ExtendedCost) * 100.0) / 100.0; // Round to pennies
                    } else {
                        totalHardwarePrice += Math.round(parseFloat(rows[key].ExtendedPrice) * 100.0) / 100.0; // Round to pennies
                        totalHardwareCost += Math.round(parseFloat(rows[key].ExtendedCost) * 100.0) / 100.0; // Round to pennies
                    }
                }

				_setErrorInRowIndicator(_findTrForRow(rows[key]), (rows[key].GrossProfit < 0),'negativeGP');
				_setErrorInRowIndicator(_findTrForRowInUnfrozenSection(rows[key]), (rows[key].GrossProfit < 0),'negativeGP');
				_setErrorInRowIndicator(_findTrForRow(rows[key]), (!!rows[key].ReasonForRejection && !rows[key].MarkedAsDeleted), 'rejected');
				_setErrorInRowIndicator(_findTrForRowInUnfrozenSection(rows[key]), (!!rows[key].ReasonForRejection && !rows[key].MarkedAsDeleted), 'rejected');
				_setErrorInRowIndicator(_findTrForRow(rows[key]), (!!rows[key].ReasonForRejection && !!rows[key].MarkedAsDeleted), 'markedAsDeleted');
				_setErrorInRowIndicator(_findTrForRowInUnfrozenSection(rows[key]), (!!rows[key].ReasonForRejection && !!rows[key].MarkedAsDeleted), 'markedAsDeleted');
				// Turn the background color of line item to Green if ItemCategory starts with 'Y' .submitted
				_setErrorInRowIndicator(_findTrForRow(rows[key]), ( (rows[key].ItemCategory.substring(0,1) == 'Y' && rows[key].ReasonForRejection == '' ) && !rows[key].MarkedAsDeleted ),'submitted');
			}

			totalHardwareGP = Math.round((totalHardwarePrice - totalHardwareCost) * 100.0) / 100.0;  // Round to pennies
			totalHardwareGPP = (totalHardwarePrice > 0) ? Math.round(((totalHardwareGP * 100.0) / totalHardwarePrice) * 1000.0) / 1000.0 : 0; // round to 3 dp
			totalOtherGP = Math.round((totalOtherPrice - totalOtherCost) * 100.0) / 100.0;  // Round to pennies
			totalOtherGPP = (totalOtherPrice > 0) ?  Math.round(((totalOtherGP * 100.0) / totalOtherPrice) * 1000.0) / 1000.0 : 0; // round to 3 dp
			totalPrice = Math.round((totalHardwarePrice + totalOtherPrice) * 100.0) / 100.0;  // Round to pennies
			totalCost = Math.round((totalHardwareCost + totalOtherCost) * 100.0) / 100.0;  // Round to pennies
			totalGP = Math.round((totalPrice - totalCost) * 100.0) / 100.0;  // Round to pennies
			totalGPP = (totalPrice > 0) ? Math.round(((totalGP * 100.0) / totalPrice) * 1000.0) / 1000.0 : 0; // round to 3 dp


			totals.setProperty('/HWRevenue', totalHardwarePrice);
			totals.setProperty('/HWCost', totalHardwareCost);
			totals.setProperty('/HWGP', totalHardwareGP);
			totals.setProperty('/HWGPP', totalHardwareGPP);
			totals.setProperty('/ServicesRevenue', totalOtherPrice);
			totals.setProperty('/ServicesCost', totalOtherCost);
			totals.setProperty('/ServicesGP', totalOtherGP);
			totals.setProperty('/ServicesGPP', totalOtherGPP);
			totals.setProperty('/TotalRevenue', totalPrice);
			totals.setProperty('/TotalCost', totalCost);
			totals.setProperty('/TotalGP', totalGP);
			totals.setProperty('/TotalGPP', totalGPP);

			totals.refresh(true);
		},100),

		handleCreateSalesOrder = function(event) {
			var currentSalesDocument = view.getModel('currentSalesDocument'),
				customerPOID = currentSalesDocument.getProperty('/CustomerPOID'),
				msg = '',
				canSave = _canSave();

			if (!!core.getModel('currentState').getProperty('/isEditMode')) {
				if (_isDirty() && canSave) {

					busyDlg.setText('Saving document in SAP.');
					busyDlg.open();

					setTimeout(function() {
						 //_deleteDetailLines
						_checkSelectedLines().done(function() {
							_doSave().done(function(id) {
								sap.m.MessageToast.show("Sales Document " + id + " has been saved.");
								view.byId('createSalesOrderDialog').open();
								view.byId('createSalesOrderCPOID').focus();
								if (customerPOID && customerPOID != null) {
									view.byId('createSalesOrderOK').setEnabled(true);
								} else {
									view.byId('createSalesOrderOK').setEnabled(false);
								}
							}).fail(function(msg) {
								sap.m.MessageBox.show((msg) ? msg : "SalesUI Could not save this record to SAP.", {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: "SAP Error",
									actions: sap.m.MessageBox.Action.OK,
									onClose: null});
							}).always(function() {
								busyDlg.close();
							});
						}).fail(function() {
							busyDlg.close();
						});
					},10);

				} else {
					if (!canSave) {
						msg = 'Document cannnot be saved, please correct the highlighted errors and try again.';
						console.log(msg);
						sap.m.MessageToast.show(msg);
					} else {
						msg = 'No changes have been made, Save cancelled.';
						console.log(msg);
						sap.m.MessageToast.show(msg);
						_toggleEdit(true);
					}
				}
			} else {
				view.byId('createSalesOrderDialog').open();
				view.byId('createSalesOrderCPOID').focus();
				if (customerPOID && customerPOID != null) {
					view.byId('createSalesOrderOK').setEnabled(true);
				} else {
					view.byId('createSalesOrderOK').setEnabled(false);
				}
			}
		},

		handleCreateSalesOrderCPOIDChange = function(event, a, b, c) {
			var source = event.getSource(),
				value = source.getValue();

			if (value && value != null) {
//Begin of Change:Check Duplicate PO: SXVASAMSETTI;02/16/16				
				if( value.length > 1 ){
					value = encodeURIComponent(value);
		       _checkDuplicatePO(value);
				}
				else{ 
			   _clearWarning();  
				}
// End of Change:				
				view.byId('createSalesOrderOK').setEnabled(true);
			} else {
				view.byId('createSalesOrderOK').setEnabled(false);
			}
		},

//--Begin of Change:Once confirmed,revert to normal state of UI	:SXVASAMSETTI- 02/16/16  
		_clearWarning = function(){
			view.byId("Warning").setText('').removeStyleClass("warning");
			view.byId("createSalesOrderCPOID").setValueState("None");	
		},
		//--End of Change	
		
		handleConfirmCreateSalesOrder = function(event) {
			var today = new Date(Date.now()),
			salesDocumentLines = view.getModel('currentSalesDocumentLines'),
			currentSalesDocument = view.getModel('currentSalesDocument'),
			currentState = view.getModel('currentState'),
			lines = [],
			tbl = view.byId('lineItemsTable'),
			userid = core.getModel('systemInfo').getProperty('/Uname'),
			customerPOID = currentSalesDocument.getProperty('/CustomerPOID');

			view.byId('createSalesOrderDialog').close();

//--Begin of Change:Once confirmed,revert to normal state of UI	:SXVASAMSETTI- 02/16/16  		
			_clearWarning( );
//--End of Change	
			
			_toggleEdit(true);

			currentSalesDocument.setProperty('/ReferencedBy',currentSalesDocument.getProperty('/SalesDocumentID'));
			currentSalesDocument.setProperty('/SalesDocumentID','0000000000');
			currentSalesDocument.setProperty('/CreatedBy',userid);
			currentSalesDocument.setProperty('/DocumentDate',null);
			currentSalesDocument.setProperty('/CreatedOn',today);
			currentSalesDocument.setProperty('/DocumentCategory','C');

			currentState.setProperty('/isQuote',false);
			currentState.setProperty('/isSalesOrder',true);
			currentState.setProperty('/isPendingSalesOrder',true);
			currentState.setProperty('/isSubmittedSalesOrder',false);

			lines = salesDocumentLines.getData();

			_.each(lines, function (line) {
				line.SalesDocumentID = '0000000000';
				line.CustomerPOID = customerPOID;
				line.CreatedBy = userid;
				line.CreatedOn = today;
				if (formatter.itemCategoryToStaging(line.ItemCategory)) {
					line.ItemCategory = _determineItemCategoryForStaging(line);
				} else {
					if (formatter.itemCategoryToDropShip(line.ItemCategory)) {
						line.ItemCategory = _determineItemCategoryForDropShip(line);
					} else {
						line.ItemCategory = _determineItemCategoryForBroughtIn(line);
					}
				}
			});

			salesDocumentLines.refresh(true);

			tbl.setFirstVisibleRow(0),
			_resizeTable();

			sap.m.MessageToast.show("Edit new Sales Order and Save or Cancel when done");
		},

		handleCancelCreateSalesOrder = function(event) {
			//Begin of Change:Clear the values & states: SXVASAMSETTI;02/16/16			
			_clearWarning( );
			view.byId("createSalesOrderCPOID").setValue("");
			//End of Change
			view.byId('createSalesOrderDialog').close();
		},

		handleCopyQuote = function(event) {
			var today = new Date(Date.now()),
				today_plus30 = new Date(Date.now()),
				lines = [],
				userid = core.getModel('systemInfo').getProperty('/Uname'),
				header = view.getModel('currentSalesDocument').getData(),
				salesDocumentLines = view.getModel('currentSalesDocumentLines');

			today_plus30.setDate(today_plus30.getDate() + 30);

			_toggleEdit(true);
			header.SalesDocumentID = '0000000000';
			header.CreatedBy = userid;
			header.CreatedOn = today;
			header.Description = '';
			header.HeaderText = '';
			header.RequestedBy = '';
			header.ValidFrom = today;
			header.ValidTo = today_plus30;
			header.ShipToID = header.CustomerID;
			header.Notes = '';
			header.PurchasingNotes = '';
			header.WarehouseNotes = '';
			header.BOLNotes = '';
			header.BillingNotes = '';
			header.Attention = '';

			lines = _.filter(salesDocumentLines.getData(), function (line) { return !line.WBSElement; });

			lines.forEach(function (line) {
				line.SalesDocumentID = '0000000000';
				line.ShipToID = header.CustomerID;
				line.VendorDeliveryNotes = '';
				line.BillingNotes = '';
				line.HasNotesFlag = false;
				line.DealID = '';
				line.CreatedBy = userid;
				line.CreatedOn = today;
				line.CreatedBy = userid;
				line.LastUpdatedOn = today;
				line.UpdatedBy = userid;
                _determineItemCategoryForDropShip(line);
			});


			view.getModel('currentSalesDocument').setData(header);
			salesDocumentLines.setData(lines);
			_calculateTotals();

			sap.m.MessageToast.show("Edit new quote and Save or Cancel when done");
		},

// Begin of Change: Copy of Selected SO Items and append to the list :SXVASAMSETTI		
		handleCopySOLines = function(event) {
			var today    = new Date(Date.now()),
			today_plus30 = new Date(Date.now()),
			lines = [],
			itemIDs = [],
			checkID = '',
			copyLines = [],
		    selectedLines = [],
			maxLine,		
			salesDocumentLines = view.getModel('currentSalesDocumentLines');
		    today_plus30.setDate(today_plus30.getDate() + 30);
         
		lines = salesDocumentLines.getData();		
		selectedLines = _.filter(lines, function (line) { return !!line.DeletedFlag; });
		if(selectedLines.length == 0){sap.m.MessageToast.show("Please select line items"); return;}
	    copyLines = (JSON.parse(JSON.stringify(selectedLines))); //Cloning the data ie,,copy of data
		maxLine   = _.max(lines, function (line) { return line.ZZLineID; });
		var maxLineID   = Math.trunc( maxLine.ZZLineID);
		var maxSDLineID =	parseInt(maxLine.SalesDocumentLineID);
		var parentLineID;
		var decimalVal = 0;
		var userid = core.getModel('systemInfo').getProperty('/Uname');
		selectedLines.forEach(function (line) {line.DeletedFlag = false;} );
		copyLines.forEach(function (line) {
/*			line.SalesDocumentID = '0000000000';
			line.ShipToID = header.CustomerID;
			line.VendorDeliveryNotes = '';
			line.BillingNotes = '';
			line.HasNotesFlag = false;
			line.DealID = ''; */

			maxSDLineID = parseInt(maxSDLineID) ;
			line.CustomerPOLineID = (maxSDLineID + 10).toString();
			line.SalesDocumentLineID = maxSDLineID = _pad(maxSDLineID + 10,6);
			line.DeletedFlag = false;
//* Forming structure Line ID
			itemIDs = line.ZZLineID.split('.');
			if(checkID != itemIDs[0] ){ 
				maxLineID++ ; 
				checkID = itemIDs[0]; 
				parentLineID = maxSDLineID
			    line.ParentLineID = '000000';
				decimalVal = 0;
			}
			else{
		    line.ParentLineID = parentLineID;	
			};
/*			if(itemIDs.length > 2){
				line.StructuredLineID = line.ZZLineID  = maxLineID + '.' + itemIDs[1] + '.' + itemIDs[2];
			}
			else{
			line.StructuredLineID = line.ZZLineID  = maxLineID + '.' + itemIDs[1];
			};	*/		
//*******************
			line.StructuredLineID = line.ZZLineID = maxLineID + '.' + decimalVal ; decimalVal++;
			line.DeliveryDate  = new Date( line.DeliveryDate );
			line.CreatedBy     = userid;
			line.CreatedOn     = today;
			line.CreatedBy     = userid;
			line.LastUpdatedOn = today;
			line.UpdatedBy     = userid;
           // _determineItemCategoryForDropShip(line);
			lines.push(line);
		});

		salesDocumentLines.setData(lines);
		_calculateTotals();
		sap.m.MessageToast.show("Line Items are copied and appended to the List");
	},
//End of Change: SXVASAMSETTI	
	
		_toggleEdit = function (confirmation) {
			var currentState  = view.getModel('currentState'),
				documentModel = view.getModel('currentSalesDocument'),
				linesModel    = view.getModel('currentSalesDocumentLines'),
				customerModel = view.getModel('currentCustomer'),
				unsubmittedDetails,
				docCat     = '',
				isEditMode = !currentState.getProperty('/isEditMode'),
				currentDocumentCopy,
				currentLinesCopy,
				currentCustomerCopy,
				currentCustomerID;

			if (!confirmation || confirmation == 'CANCEL') return;

			currentState.setProperty('/isEditMode', isEditMode);
			currentState.setProperty('/isNotEditMode', !isEditMode);
			currentState.setProperty('/canEdit', (isEditMode == false) && _canEdit());

			if (isEditMode) {
                copies.setProperty('/currentDocumentCopy',jQuery.extend(true, {}, documentModel.getData()));
                copies.setProperty('/currentLinesCopy',jQuery.extend(true, [], linesModel.getData()));
                copies.setProperty('/currentCustomerCopy',jQuery.extend(true, {}, customerModel.getData()));
			} else {
                currentDocumentCopy = copies.getProperty('/currentDocumentCopy');
                currentLinesCopy = copies.getProperty('/currentLinesCopy');
                currentCustomerCopy = copies.getProperty('/currentCustomerCopy');
                currentCustomerID = customerModel.getData().CustomerID;

				if (currentDocumentCopy && currentDocumentCopy.SalesDocumentID) {
					_deleteBlankDetailLines();
					documentModel.setData(currentDocumentCopy);
					linesModel.setData(currentLinesCopy);
					customerModel.setData(currentCustomerCopy);
					docCat = view.getModel('currentSalesDocument').getProperty('/DocumentCategory');
					currentState.setProperty('/isQuote',docCat == 'B');
					currentState.setProperty('/isSalesOrder',docCat == 'C');
					currentState.setProperty('/isPendingSalesOrder',documentModel.getProperty('/DocumentCategory') == 'C' && documentModel.getProperty('/SalesOrderStatus') != 'E0002');
					currentState.setProperty('/isSubmittedSalesOrder',documentModel.getProperty('/DocumentCategory') == 'C' && documentModel.getProperty('/SalesOrderStatus') == 'E0002');
					currentState.setProperty('/canDelete', currentState.getProperty('/isPendingSalesOrder'));
					copies.setProperty('/currentDocumentCopy',null);
					copies.setProperty('/currentLinesCopy',[]);
					copies.setProperty('/currentCustomerCopy',null);
					if (parseInt(core.getModel('currentSalesDocument').getProperty('/SalesDocumentID')) == 0) {
						handleNavButtonPress();
					}
				} else {
					splitApp.toDetail(splitApp.getInitialDetail());
					splitApp.showMaster();
					currentSalesDocumentID = null;
					router.navTo("master",{from: "customer", customerId: currentCustomerID,}, true);
				}
			}
		},

		_canSave = function () {
			var lines = view.getModel('currentSalesDocumentLines').getData(),
				retVal = true;

			_.each(lines,function(line) {
				_parentIDFix(line);

				// Last minute validation checks here
			});

			return retVal;
		},

		_parentIDFix = function (line) {
			if (line.ParentLineID == '000000' || line.ParentLineID == '0') {
				line.ParentLineID = '';
			}

			return
		},

		handleOutputTypeSelectDefault = function(event) {
			var defaultButton = (core.getModel('currentState').getProperty('/isQuote')) ? view.byId('defaultOutputTypeQ') : view.byId('defaultOutputTypeSO');

			defaultButton.focus(true);
		},

		//PDF Display
		handleOutputRequest = function(event) {
			var actionSheet = view.byId('outputActionSheet');

			if (actionSheet.isOpen()) {
				actionSheet.close();
			} else {
				actionSheet.openBy(event.getSource());
			}
		},

// Begin of changes:SXVASAMSETTI; Partial Submission changes
		//Display Delete Options
		handleDeleteRequest = function(event) {
			var actionSheet = view.byId('deleteActionSheet');

			if (actionSheet.isOpen()) {
				actionSheet.close();
			} else {
				actionSheet.openBy(event.getSource());
			}
		},
		
		handleToggleSelection=function(event){
			salesDocumentLines = view.getModel('currentSalesDocumentLines');
			lines = salesDocumentLines.getData();	
			lines.forEach(function (line){
				if((line.ItemCategory.substring(0,1) == 'Z') || !!line.ReasonForRejection ){ 
				   if(event.mParameters.pressed){line.Selected = true;}
				   else{line.Selected = false}
				   }
				  } );
			salesDocumentLines.setData(lines);
		},
		
		handleSelectColumn=function(event){
		var source = event.getSource( );
		source.setShowColumnVisibilityMenu(true);
		source.setEnableColumnFreeze(true);
		if(event.mParameters.column.sId.indexOf('selectionID') >= 0){
			source.setShowColumnVisibilityMenu(false);
			source.setEnableColumnFreeze(false);		
		}
		
		},
		
      
	      handleOpenDeleteDialog=function(event){
	    	  if( event.oSource.sId.indexOf('DeleteLineItems') >= 0){
	    		  if(_checkIsLinesAreSelected())
	    		  handleSaveButtonPress('DELETE_LINES');
	    	  }else{
	    		  handleDeleteButtonPress( );
	    	  }	    	 
	      },		
		
	      handleCancelDeleteDialog=function(){
	    	 
	    	  view.byId('deleteDialogID').close();
	    	  sap.m.MessageToast.show('Deletion Cancelled');
	      },
		
      
	      _checkIsLinesAreSelected = function(){
	    	  if(_.findWhere(core.getModel('currentSalesDocumentLines').getData(), {Selected:true})) return true; 
	    	  sap.m.MessageToast.show("Please Select lines");
	    	  return false;
	      }

	      _checkSelectedLines = function(action) {
				var deferred,l,msg ,rejmsg,popupmsg,
					currentDocumentLines = core.getModel('currentSalesDocumentLines'),
					rows = currentDocumentLines.getData();
			 if(action == 'DELETE_LINES')
				{
					var	selectedLines = _.filter(rows, function(row){return (row.Selected &&  (row.ItemCategory.substring(0,1) == 'Z') || (row.Selected && !!row.ReasonForRejection && !row.MarkedAsDeleted )) });
						l = (!!selectedLines) ? selectedLines.length : 0;
						msg = "Are you sure you wish to delete these " + l + " line items?";
						rejmsg = 'Deletion of lines are canceled' ;
						popupmsgTitle = 'Confirm Deletion';
				}else{
					// For save, all lines to be selected by default
					_.each(rows,function(row){row.Selected = true});
				    var	unSelectedLines = _.filter(rows, function(row){ 
						return (row.Selected == false &&  row.ItemCategory.substring(0,1) == 'Z'  ) });
						l = (!!unSelectedLines) ? unSelectedLines.length : 0;	
						msg = "Some Line Items(~ " + l + ") are not selected which will not be saved.Do you still want to continue?";
						rejmsg = 'Saving lines are canceled';
						popupmsgTitle  = 'Confirm Save Document';
				}

				deferred = $.Deferred(function (def) {
					if (l > 0) {
						
						sap.m.MessageBox.confirm(msg, function (confirmation) {
							if (confirmation != 'CANCEL') {
								if(action == 'DELETE_LINES'){
								_.each(rows, function (row) {
									if (!!row.Selected && !!row.ReasonForRejection) {
										row.MarkedAsDeleted = true;
										row.Selected = false;
									}
								});
								currentDocumentLines.setData(_.reject(rows, function (row) {
									return (row.Selected && ( (row.ItemCategory.substring(0,1) == 'Z') || !!row.ReasonForRejection ));
								}));
								
								}else{
									currentDocumentLines.setData(_.filter(rows, function (row) {
										return row.Selected;
									}));	
									
								}
								
								view.setModel(core.getModel('currentSalesDocumentLines'), 'currentSalesDocumentLines');
								_calculateTotals();
								def.resolve();
							} else {
								def.reject(rejmsg);
							}
						}, popupmsgTitle);
					} else {
						def.resolve();
					}
				});

				return deferred.promise();
			},
				      
		// End of change: SXVASAMSETTI, Partial Submission Changes
		
		handleDetailedSOConfirmationPDFRequest = function(event) {
			_doOutput('ZBA5','P');
		},

		handleSummarySOConfirmationPDFRequest = function(event) {
			_doOutput('ZBA6','P');
		},

		handleStdQuotePDFRequest = function(event) {
			_doOutput((core.getModel('currentState').getProperty('/isQuote')) ? 'ZAN1' : 'ZBA1','P');
		},

		handleDetailedQuotePDFRequest = function(event) {
			_doOutput((core.getModel('currentState').getProperty('/isQuote')) ? 'ZAN2' : 'ZBA2','P');
		},

		handleEngineeringQuotePDFRequest = function(event) {
			_doOutput('ZAN3','P');
		},

		handleDetailedEngineeringQuotePDFRequest = function(event) {
			_doOutput('ZAN4','P');
		},

		handleBudgetSheetPDFRequest = function(event) {
			_doOutput('ZBA4','P');
		},

		handleExcelExportRequest = function(event) {
			_doOutput('ZAN4','E');
		},

		handleEDIOutputRequest = function(event) {
			_doOutput('ZBA0','P');
		},

		handleEngineeringQuoteSummaryPDFRequest = function(event) {
			_doOutput('ZAN5','P');
		},

		handleDetailedEngineeringQuoteSummaryPDFRequest = function(event) {
			_doOutput('ZAN6','P');
		},

		_doOutput = function(outputType, fileType) {
			var salesDocument = view.getModel('currentSalesDocument'),
			salesDocumentID = salesDocument.getProperty('/SalesDocumentID'),
			customerID = salesDocument.getProperty('/CustomerID'),
			shipToID = salesDocument.getProperty('/ShipToID'),
			docCat = salesDocument.getProperty('/DocumentCategory');
			//docCat = view.getModel('currentSalesDocument').getProperty('/DocumentCategory');

			sRead = "/PrintDocumentSet(CustomerID='" + customerID + "',DocumentNo='" + salesDocumentID + "',DocCat='" + docCat + "',FileType='"+fileType+"',OutputType='"+outputType+"')/$value";
			 window.open(model.sServiceUrl + sRead );

			},

			handleOpenSharepointLibrary = function(event) {
				var baseUrl = sharepoint.fullyReferenceRelativeUrl('sites/SAPDocs/Documents/Forms/AllItems.aspx?RootFolder=');
				sharepoint.ensureSalesDocFolder(currentCustomerID, currentSalesDocumentID).done(function (root) {
						sap.m.URLHelper.redirect(baseUrl+encodeURIComponent(root), true);
					});
			},


			handleExportToExcelRequest = function(event) {
				var data = new sap.ui.model.json.JSONModel(_.filter(core.getModel('currentSalesDocumentLines').getData(), function(row) {
						return (!row.DeletedFlag && !row.MarkedAsDeleted && !row.ReasonForRejection);
					})),
					xprt = new sap.ui.core.util.Export({
						exportType: new sap.ui.core.util.ExportTypeCSV({charset : "utf-16",}),
						models: data,
						rows : { path : '/'},
						columns : [
							{name: 'Line', template : { content : {path: 'StructuredLineID'}}},
							{name: 'Ref Ln', template : { content : {path: 'CustomerPOLineID'}}},
							{name: 'Qty', template : { content : {path: 'QTY'}}},
							{name: 'Ordered', template : { content : {path: 'QtyOrdered'}}},
							{name: 'Received', template : { content : {path: 'QtyReceived'}}},
							{name: 'Shipped', template : { content : {path: 'QtyShipped'}}},
							{name: 'Billed', template : { content : {path: 'QtyBilled'}}},
							{name: 'Manufacturer', template : { content : {path: 'ManufacturerID'}}},
							{name: 'Part # Requested', template : { content : {path: 'ManufacturerPartID'}}},
							{name: 'Description', template : { content : {path: 'Description'}}},
							{name: 'Vendor', template : { content : {path: 'VendorID'}}},
							{name: 'Part # To Order', template : { content : {path: 'CustomerPartID'}}},
							{name: 'List Price', template : { content : {path: 'ListPrice'}}},
							{name: 'GDT Disc.', template : { content : {path: 'GDTDiscount'}}},
							{name: 'GDT Disc. %', template : { content : {path: 'GDTDiscountPercent'}}},
							{name: 'Unit Cost', template : { content : {path: 'UnitCost'}}},
							{name: 'Ext. Cost', template : { content : {path: 'ExtendedCost'}}},
							{name: 'Cust. Disc.', template : { content : {path: 'CustomerDiscount'}}},
							{name: 'Cust. Disc. %', template : { content : {path: 'CustomerDiscountPercent'}}},
							{name: 'Unit Price', template : { content : {path: 'UnitPrice'}}},
							{name: 'Ext. Price', template : { content : {path: 'ExtendedPrice'}}},
							{name: 'GP', template : { content : {path: 'GrossProfit'}}},
							{name: 'GP %', template : { content : {path: 'GrossProfitPercentage'}}},
							{name: 'ItemCategory', template : { content : {path: 'ItemCategory'}}},
							{name: 'ShipToID', template : { content : {path: 'ShipToID'}}},
							{name: 'Deal ID / DART', template : { content : {path: 'DealID'}}},
							{name: 'Delivery Date', template : { content : {path: 'DeliveryDate'}}},
							{name: 'CCW Quote #', template : { content : {path: 'ExternalQuoteID'}}},
							{name: 'SmartNet Line Type', template : { content : {path: 'SmartNetLineType'}}},
							{name: 'SmartNet Part # Covered', template : { content : {path: 'SmartNetCoveredMaterial'}}},
							{name: 'SmartNet S/N', template : { content : {path: 'SmartNetCoveredSerialNumber'}}},
							{name: 'SmartNet Old S/N', template : { content : {path: 'SmartNetReplacedSerialNumber'}}},
							{name: 'SmartNet Contract #', template : { content : {path: 'SmartNetContractNumber'}}},
							{name: 'SmartNet Service Level', template : { content : {path: 'SmartNetServiceLevel'}}},
							{name: 'SmartNet Begin Date', template : { content : {path: 'SmartNetBeginDate'}}},
							{name: 'SmartNet End Date', template : { content : {path: 'SmartNetEndDate'}}},
							{name: 'SmartNet Duration', template : { content : {path: 'SmartNetDuration'}}},
							{name: 'WBSElement', template : { content : {path: 'WBSElement'}}},
						]});

				xprt.saveFile(core.getModel('currentSalesDocument').getProperty('/SalesDocumentID')).always(function() {
					this.destroy();
				});

				//data.saveFile(core.getModel('currentSalesDocument').getProperty('/SalesDocumentID'));

			//	var salesDocument = view.getModel('currentSalesDocument'),
			//	salesDocumentID = salesDocument.getProperty('/SalesDocumentID'),
			//	shipToID = salesDocument.getProperty('/ShipToID');
         //
			//	docCat = salesDocument.getProperty('/DocumentCategory');
			//	//docCat = view.getModel('currentSalesDocument').getProperty('/DocumentCategory');
         //
			//	sRead = "/PrintDocumentSet(CustomerID='" + shipToID + "',DocumentNo='" + salesDocumentID + "',DocCat='" + docCat + "',FileType='E')/$value";
         //
			//	var hyperlink = document.createElement('a');
			//	hyperlink.href = model.sServiceUrl + sRead;
			//	hyperlink.target = '_blank';
			//	hyperlink.download = 'DocumentNo_'+ salesDocumentID + '.xls' || model.sServiceUrl + sRead;
         //
			//	var mouseEvent = new MouseEvent('click', {
			//		view: window,
			//		bubbles: true,
			//		cancelable: true,
			//	});
         //
			//	hyperlink.dispatchEvent(mouseEvent);
			//	(window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
			//	//var pom = document.createElement('a');
			////	pom.setAttribute('sRead', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
			////	pom.setAttribute('download', 'filename');
			// //   pom.click();
		 ////	window.open(model.sServiceUrl + sRead );
         //
				},

		 // PDF Print
		handlePrintRequest = function(event) {
			var salesDocument = view.getModel('currentSalesDocument'),
			salesDocumentID = salesDocument.getProperty('/SalesDocumentID'),
			shipToID = salesDocument.getProperty('/ShipToID');
			docCat = salesDocument.getProperty('/DocumentCategory');
			//docCat = view.getModel('currentSalesDocument').getProperty('/DocumentCategory');

			sRead = "/PrintDocumentSet(CustomerID='" + shipToID + "',DocumentNo='" + salesDocumentID + "',DocCat='" + docCat + "',FileType='P')/$value";
			var lvprrint = window.open(model.sServiceUrl + sRead );
			lvprrint.print();
		},
		handleBSDialogCloseButton = function (oEvent) {
			 oEvent.getSource().getParent().close();
		},

		_findRow = function (lineid){
			var currentSalesDocumentLines = view.getModel('currentSalesDocumentLines');

			return $.grep(currentSalesDocumentLines.getData(), function(n){
			  return n.SalesDocumentLineID == lineid;
			});
		},

		_findRowByStructuredLineID = function (structuredLineID){
			var currentSalesDocumentLines = view.getModel('currentSalesDocumentLines');

			if (!structuredLineID || structuredLineID.length == 0) return [];

			return $.grep(currentSalesDocumentLines.getData(), function(n){
			  return !n.MarkedAsDeleted && !n.DeletedFlag && ((n.StructuredLineID == structuredLineID) || (n.StructuredLineID == structuredLineID + ".0") || (n.StructuredLineID + ".0" == structuredLineID));
			});
		},

		handleDetailOnSelectLines = function(event) {
			var source = event.getSource(),
			binding = source.getBinding('selected'),
			context = binding.getContext(),
			model = binding.getModel(),
			currentState = view.getModel('currentState'),
			rows = view.getModel('currentSalesDocumentLines'),
			rowsArray = rows.getData(),
			children,
			l,
			idx = -1,
			i,
			row = model.getProperty(context.getPath());

			if (!!row.ItemCategory && (row.ItemCategory.substring(0,1) == 'Y' && !row.ReasonForRejection)) return;

			children = _findAllChildren(row.SalesDocumentLineID, rowsArray);

			l = (!!children) ? children.length : 0;

			for (i = 0; i < l; i++) {
				idx = _.indexOf(rowsArray,children[i]);
				if (idx != -1) {
					children[i].Selected = row.Selected;
					rows.setProperty('/'+idx,children[i]);
				}
			}
          //  _calculateTotals();
		},

		handleDropShipSelect = function (event) {
			var source = event.getSource(),
				binding = source.getBinding('selected'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = model.getProperty(context.getPath());

			row.ItemCategory = (event.getParameter('selected')) ? _determineItemCategoryForDropShip(row) : _determineItemCategoryForBroughtIn(row);

			model.setProperty(context.getPath(),row);

			_makeTotalConfiguredItemLikeThis(row, model, ["ItemCategory"]);
		},

		handleStagingSelect = function (event) {
			var source = event.getSource(),
				binding = source.getBinding('selected'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = model.getProperty(context.getPath());

			row.ItemCategory = (event.getParameter('selected')) ? _determineItemCategoryForStaging(row) : _determineItemCategoryForBroughtIn(row);

			model.setProperty(context.getPath(),row);

			_makeTotalConfiguredItemLikeThis(row, model, ["ItemCategory"]);
		},

		_determineMaterialSeries = function(row) {
			var materialSeries = (row && row.MaterialID) ? row.MaterialID : '';

			materialSeries = materialSeries.replace(/^0+/, '');
			if (!!materialSeries && materialSeries.length > 1) {
				materialSeries = materialSeries.substring(0,1);
			}

			return parseInt(materialSeries);
		},

		_determineItemCategoryForStaging = function(row, isSubmitted) {
			var currentState = view.getModel('currentState'),
				isQuote = currentState.getProperty('/isQuote'),
				edelivery = (!!row.EDelivery) ? (row.EDelivery === 'EDELIVERY') : false,
				materialSeries = _determineMaterialSeries(row);

			if (edelivery) return (_determineItemCategoryForDropShip(row, isSubmitted));

			if (!!materialSeries && materialSeries == materialSeries_Placeholder) { // Non-Corporial - Roll-up, Discount, Trade-in etc.
				return (isQuote) ? 'ZGDT' : (isSubmitted) ? 'YGDT' : 'ZGDT';
			}
			if (!materialSeries || materialSeries == materialSeries_Hardware) { // Hardware
				return (isQuote) ? 'ZHBC' : ((isSubmitted) ? 'YBAC' : 'ZBAC');
			}

			if (materialSeries == materialSeries_FinishedGoods) { // Finished Goods
				return (isQuote) ? 'AGN' : ((isSubmitted) ? 'YTAN' : 'ZTAN');
			}

			// Professional Services
			return (isQuote) ? 'ZPFS' : ((isSubmitted) ? 'YTAO' : 'ZTAO');

		},

		_determineItemCategoryForDropShip = function(row, isSubmitted) {
			var currentState = view.getModel('currentState'),
				isQuote = currentState.getProperty('/isQuote'),
				materialSeries = _determineMaterialSeries(row);


			if (!!materialSeries && materialSeries == materialSeries_Placeholder) { // Non-Corporial - Roll-up, Discount, Trade-in etc.
				return (isQuote) ? 'ZGDT' : (isSubmitted) ? 'YGDT' : 'ZGDT';
			}
			if (!materialSeries || materialSeries == materialSeries_Hardware) { // Hardware
				return (isQuote) ? 'ZHDS' : ((isSubmitted) ? 'YB1' : 'ZB1');
			}

			if (materialSeries == materialSeries_FinishedGoods) { // Finished Goods
				return (isQuote) ? 'AGN' : ((isSubmitted) ? 'YTAN' : 'ZTAN');
			}

			// Professional Services
			return (isQuote) ? 'ZPFS' : ((isSubmitted) ? 'YTAO' : 'ZTAO');

		},

		_determineItemCategoryForBroughtIn = function(row, isSubmitted) {
			var currentState = view.getModel('currentState'),
				isQuote = currentState.getProperty('/isQuote'),
				edelivery = (!!row.EDelivery) ? (row.EDelivery === 'EDELIVERY') : false,
				materialSeries = _determineMaterialSeries(row);

			if (edelivery) return (_determineItemCategoryForDropShip(row, isSubmitted));

			if (!!materialSeries && materialSeries == materialSeries_Placeholder) { // Non-Corporial - Roll-up, Discount, Trade-in etc.
				return (isQuote) ? 'ZGDT' : (isSubmitted) ? 'YGDT' : 'ZGDT';
			}
			if (!materialSeries || materialSeries == materialSeries_Hardware) { // Hardware
				return (isQuote) ? 'ZHBI' : ((isSubmitted) ? 'YBAB' : 'ZBAB');
			}

			if (materialSeries == materialSeries_FinishedGoods) { // Finished Goods
				return (isQuote) ? 'AGN' : ((isSubmitted) ? 'YTAN' : 'ZTAN');
			}

			// Professional Services
			return (isQuote) ? 'ZPFS' : ((isSubmitted) ? 'YTAO' : 'ZTAO');

		},

		handleChangeDetailLineShipTo = function (event) {
			var source = event.getSource(),
			//binding = source.getBinding('value').getBindings()[0],
				binding = source.getBinding('value'),
			context = binding.getContext(),
			model = binding.getModel(),
			partnerID = _findPartnerID(source.getValue(),'ShipTos'),
			row = model.getProperty(context.getPath()),
            forceRefresh = false;

            if (('' + binding.getValue() == 'ONETIME') && (binding.getValue() != source.getValue())) {
                row.OTSTAddressID = '0000000000';
                row.OTSTName = '';
                row.OTSTStreet = '';
                row.OTSTStreet2 = '';
                row.OTSTStreet3 = '';
                row.OTSTCity = '';
                row.OTSTState = '';
                row.OTSTZip = '';
                row.OTSTCountry = '';
                row.OTSTPhone = '';
                forceRefresh = true;
            }
			if (!partnerID) {
				source.setTooltip(new sap.ui.commons.RichTooltip({
					text : 'Ship To Party does not exist.  Please select from the displayed options.'
				}));
				source.setValueState(sap.ui.core.ValueState.Error);
				event.preventDefault();
				return;
			}

			source.setValueState(sap.ui.core.ValueState.None);
			source.setTooltip();

			row.ShipToID = partnerID;

			_makeTotalConfiguredItemLikeThis(row, model, ["ShipToID", "OTSTAddressID", "OTSTName", "OTSTStreet", "OTSTStreet2", "OTSTStreet3", "OTSTCity", "OTSTState", "OTSTZip", "OTSTCountry", "OTSTPhone"]);
            if (forceRefresh)  model.refresh(true);

		},

		handleChangeDetailLineDealID = function (event) {
			var source = event.getSource(),
			binding = source.getBinding('value'),
			context = binding.getContext(),
			model = binding.getModel(),
			row = model.getProperty(context.getPath());

			row.DealID = source.getValue();

			_makeTotalConfiguredItemLikeThis(row, model, ["DealID"], row.VendorID);
		},

		// One Time Ship To
		handleViaHeaderPress = function (event) {
			var currentDocument = view.getModel('currentSalesDocument');
			_popViaDialog(currentDocument.getData(), currentDocument, true);

		},

		// One Time Ship To
		handleViaDetailPress = function (event) {
			var source = event.getSource(),
				row = {},
				rowid = source.data('rowid'),
				currentDocumentLines = view.getModel('currentSalesDocumentLines');

			if (!rowid) return;

			row = _findRow(rowid);

			_popViaDialog(row[0], currentDocumentLines, false);

		 },

		 handleCloseViaDialog = function(event) {
			 var dialog = view.byId("NewViaAddress"),
				 currentVia = view.getModel('currentVia'),
				 zipMissing = !currentVia.getProperty('/Zip') && (!!currentVia.getProperty('/Name') || !!currentVia.getProperty('/Street') || !!currentVia.getProperty('/Street2') || !!currentVia.getProperty('/Street3') || !!currentVia.getProperty('/City') || !!currentVia.getProperty('/State') || !!currentVia.getProperty('/Country') || !!currentVia.getProperty('/Phone') ),
				 nameMissing = !currentVia.getProperty('/Name') && (!!currentVia.getProperty('/Street') || !!currentVia.getProperty('/Street2') || !!currentVia.getProperty('/Street3') || !!currentVia.getProperty('/City') || !!currentVia.getProperty('/State') || !!currentVia.getProperty('/Country') || !!currentVia.getProperty('/Phone') ),
				 streetMissing = !currentVia.getProperty('/Street') && (!!currentVia.getProperty('/Name') || !!currentVia.getProperty('/Street2') || !!currentVia.getProperty('/Street3') || !!currentVia.getProperty('/City') || !!currentVia.getProperty('/State') || !!currentVia.getProperty('/Country') || !!currentVia.getProperty('/Phone')),
				 cityMissing = !currentVia.getProperty('/City') && (!!currentVia.getProperty('/Name') || !!currentVia.getProperty('/Street') || !!currentVia.getProperty('/Street2') || !!currentVia.getProperty('/Street3') || !!currentVia.getProperty('/State') || !!currentVia.getProperty('/Country') || !!currentVia.getProperty('/Phone') ),
				 stateMissing = !currentVia.getProperty('/State') && (!!currentVia.getProperty('/Name') || !!currentVia.getProperty('/Street') || !!currentVia.getProperty('/Street2') || !!currentVia.getProperty('/Street3') || !!currentVia.getProperty('/City') || !!currentVia.getProperty('/Country') || !!currentVia.getProperty('/Phone') );

			 var _required = function(field, message){
				 sap.m.MessageToast.show(message);
				 event.preventDefault();
				 event.cancelBubble();
				 view.byId(field).setValueState(sap.ui.core.ValueState.Error);

			 };

			 if (zipMissing) {
				 _required('OTSTZip', 'One Time Ship To (Via) address cannot be saved without a zip code.');
			 } else {
				 view.byId('OTSTZip').setValueState(sap.ui.core.ValueState.None);
			 }
			 if (nameMissing) {
				 _required('OTSTName', 'One Time Ship To (Via) address cannot be saved without a name.');
			 } else {
				 view.byId('OTSTName').setValueState(sap.ui.core.ValueState.None);
			 }
			 if (streetMissing) {
				 _required('OTSTStreet', 'One Time Ship To (Via) address cannot be saved without a street.');
			 } else {
				 view.byId('OTSTStreet').setValueState(sap.ui.core.ValueState.None);
			 }
			 if (cityMissing) {
				 _required('OTSTCity', 'One Time Ship To (Via) address cannot be saved without a city.');
			 } else {
				 view.byId('OTSTCity').setValueState(sap.ui.core.ValueState.None);
			 }
			 if (stateMissing) {
				 _required('OTSTState', 'One Time Ship To (Via) address cannot be saved without a state.');
			 } else {
				 view.byId('OTSTState').setValueState(sap.ui.core.ValueState.None);
			 }
			 if (!zipMissing && !nameMissing && !streetMissing && !cityMissing && !stateMissing){
				 dialog.close();
			 } else {
				 return false;
			 }
		 },

		 _popViaDialog = function(via, model, allDetails) {
			var currentVia = view.getModel('currentVia'),
				currentViaCopy = {},
				dialog = view.byId("NewViaAddress");

			if (!!via.OTSTAddressID || !!via.OTSTZip) {
				currentVia.setProperty('/ID', via.OTSTAddressID);
				currentVia.setProperty('/Name',via.OTSTName);
				currentVia.setProperty('/Street',via.OTSTStreet);
				currentVia.setProperty('/Street2',via.OTSTStreet2);
				currentVia.setProperty('/Street3',via.OTSTStreet3);
				currentVia.setProperty('/City',via.OTSTCity);
				currentVia.setProperty('/State',via.OTSTState);
				currentVia.setProperty('/Country',via.OTSTCountry);
				currentVia.setProperty('/Zip',via.OTSTZip);
				currentVia.setProperty('/Phone',via.OTSTPhone);
			} else {
				currentVia.setProperty('/ID', '0000000000');
				currentVia.setProperty('/Name','');
				currentVia.setProperty('/Street','');
				currentVia.setProperty('/Street2','');
				currentVia.setProperty('/Street3','');
				currentVia.setProperty('/City','');
				currentVia.setProperty('/State','');
				currentVia.setProperty('/Country','');
				currentVia.setProperty('/Zip','');
				currentVia.setProperty('/Phone','');
			}

			currentViaCopy = jQuery.extend(true, {}, currentVia.getData());

			_processViaData = function(event, data) {
				var currentVia = view.getModel('currentVia'),
					linesModel = view.getModel('currentSalesDocumentLines'),
					lines = linesModel.getData(),
					row = {};

				if (!_deepCompare(currentVia.getData(),data.oldVia)) {
//					data.via.OTSTAddressID = currentVia.getProperty('/ID');
					data.via.OTSTAddressID = '0000000000';
					data.via.OTSTName = currentVia.getProperty('/Name');
					data.via.OTSTStreet = currentVia.getProperty('/Street');
					data.via.OTSTStreet2 = currentVia.getProperty('/Street2');
					data.via.OTSTStreet3 = currentVia.getProperty('/Street3');
					data.via.OTSTCity = currentVia.getProperty('/City');
					data.via.OTSTState = currentVia.getProperty('/State');
					data.via.OTSTCountry = currentVia.getProperty('/Country');
					data.via.OTSTZip = currentVia.getProperty('/Zip');
					data.via.OTSTPhone = currentVia.getProperty('/Phone');

					_makeTotalConfiguredItemLikeThis(data.via, data.model, ["OTSTAddressID","OTSTName","OTSTStreet","OTSTStreet2","OTSTStreet3","OTSTCity","OTSTState","OTSTCountry","OTSTZip","OTSTPhone"]);
					data.model.refresh(true);
				}

				if (data.allDetails) {
					for (var i = 0, len = (!!lines) ? lines.length : 0; i < len; i++) {
						row = lines[i];
						row.OTSTAddressID = currentVia.getProperty('/ID');
						row.OTSTName = currentVia.getProperty('/Name');
						row.OTSTStreet = currentVia.getProperty('/Street');
						row.OTSTStreet2 = currentVia.getProperty('/Street2');
						row.OTSTStreet3 = currentVia.getProperty('/Street3');
						row.OTSTCity = currentVia.getProperty('/City');
						row.OTSTState = currentVia.getProperty('/State');
						row.OTSTCountry = currentVia.getProperty('/Country');
						row.OTSTZip = currentVia.getProperty('/Zip');
						row.OTSTPhone = currentVia.getProperty('/Phone');
					}

					linesModel.refresh(true);
				}

				dialog.detachAfterClose(_processViaData, this);
			};
			dialog.attachAfterClose({ oldVia: currentViaCopy, via: via, model: model, allDetails: allDetails }, _processViaData, this);
			dialog.open();

		 },

		handleEditCancelButtonPress = function(event) {

			var currentState = view.getModel('currentState'),
				isEditMode = !currentState.getProperty('/isEditMode');

			if (isEditMode) {
                _toggleEdit(true);
			} else {
				if (_isDirty()) {
					 sap.m.MessageBox.confirm("Changes have been made, are you sure you wish to discard them?", _toggleEdit, "Confirm Cancel Edit");
				} else {
					_toggleEdit(true);
				}
			}
		},

		_isDirty = function() {
			var currentDocumentCopy = copies.getProperty('/currentDocumentCopy'),
				currentCustomerCopy = copies.getProperty('/currentCustomerCopy'),
				currentLinesCopy = copies.getProperty('/currentLinesCopy'),
				lines = view.getModel('currentSalesDocumentLines').getData(),
				toOmit = [ 'LineItems' ],
				detailLinesDifferent = false;

			if (!currentDocumentCopy || !currentCustomerCopy || !currentLinesCopy) return true;



			if (_.reject(currentLinesCopy, function(line) { return !line.MaterialID; }).length != _.reject(lines, function(line) { return !line.MaterialID; }).length) return true;

			if (currentDocumentCopy.DocumentCategory == 'B') {
				toOmit.push('RequestedDeliveryDate');  // User cannot see this change so don't enforce if quote.
			}

			_.each(currentLinesCopy, function(line) {
				var newLine = _.findWhere(lines, {SalesDocumentLineID : line.SalesDocumentLineID});

				if (!newLine) {
					detailLinesDifferent = (!!line.ManufacturerPartID) ? true : detailLinesDifferent;
				} else {
					_parentIDFix(line);
					_parentIDFix(newLine);
					if (!_.isEqual(line, newLine)) detailLinesDifferent = true;
				}
			});

			return 	!_.isEqual(_.omit(currentDocumentCopy, toOmit), _.omit(view.getModel('currentSalesDocument').getData(), toOmit)) ||
					!_.isEqual(view.getModel('currentCustomer').getData(), currentCustomerCopy) ||
					detailLinesDifferent;

		},

		// Save Button
		handleSaveButtonPress = function(event) {
			var msg = '',
				canSave = _canSave();

			if (function(){if(event != 'DELETE_LINES') return (_isDirty() && canSave) ; return true; }()) {
               
				if(event == 'DELETE_LINES')
					{
					busyDlg.setText('Deleting Document Line Items in SAP');
					}else{
				busyDlg.setText('Saving document in SAP.');
					}
				busyDlg.open();

				setTimeout(function() {
					//  _deleteDetailLines
					_checkSelectedLines(event).done(function() {
						_doSave().done(function(id) {
							sap.m.MessageToast.show("Sales Document " + id + " has been saved.");
						}).fail(function(msg) {
							sap.m.MessageBox.show((msg) ? msg : "SalesUI Could not save this record to SAP.", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "SAP Error",
								actions: sap.m.MessageBox.Action.OK,
								onClose: null});
						}).always(function() {
							busyDlg.close();
						});
					}).fail(function() {
						busyDlg.close();
					});
				},10);

			} else {
				if (!canSave) {
					msg = 'Document cannnot be saved, please correct the highlighted errors and try again.';
                    console.log(msg);
					sap.m.MessageToast.show(msg);
				} else {
					msg = 'No changes have been made, Save cancelled.';
                    console.log(-10, msg);
					sap.m.MessageToast.show(msg);
					_toggleEdit(true);
				}
			}
		},

		handleSaveAndExitButtonPress = function(event) {
			var msg = '',
				canSave = _canSave();

			if (_isDirty() && canSave) {

				busyDlg.setText('Saving document in SAP.');
				busyDlg.open();

				setTimeout(function() {
					_deleteDetailLines().done(function() {
						_doSave().done(function(id) {
							sap.m.MessageToast.show("Sales Document " + id + " has been saved.");
						}).fail(function(msg) {
							sap.m.MessageBox.show((startupMsg) ? startupMsg : "SalesUI Could not save this record to SAP.", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "SAP Error",
								actions: sap.m.MessageBox.Action.OK,
								onClose: null});
						}).always(function() {
							busyDlg.close();
						});
					}).fail(function() {
						busyDlg.close();
					});
				},10);

			} else {
				if (!canSave) {
					msg = 'Document cannnot be saved, please correct the highlighted errors and try again.';
					sap.m.MessageToast.show(msg);
				} else {
					msg = 'No changes have been made, Save cancelled.';
					_toggleEdit(true);
					_exit();
					sap.m.MessageToast.show(msg);
				}
			}
		},

		_doSave = function(exit) {
			var currentState = view.getModel('currentState'),
				deferred = null;

				deferred = $.Deferred(function (def) {
					var timeout = 0,
						unsubmitted,
						currentLines = view.getModel('currentSalesDocumentLines'),
						currentSalesDocument = view.getModel('currentSalesDocument'),
						newSalesDocument = currentSalesDocument.getData();

					delete newSalesDocument._bCreate;

					_deleteBlankDetailLines();

					if (!newSalesDocument.RequestedDeliveryDate || newSalesDocument.RequestedDeliveryDate < Date.now()) {
						newSalesDocument.RequestedDeliveryDate = new Date(Date.now());
					}

					if (newSalesDocument.HeaderText && newSalesDocument.HeaderText.length > 40) {
						newSalesDocument.HeaderText = newSalesDocument.HeaderText.substring(0,40);
					}

					_.each(currentLines.getData(),function(line) {
						_parentIDFix(line);
						if (line.MaterialID) line.MaterialID = _pad(line.MaterialID, 18);
						if (line.CustomerMaterialID) line.CustomerMaterialID = _pad(line.CustomerMaterialID, 18);
					});

					newSalesDocument.LineItems = currentLines.getData();

					unsubmitted = _.find(newSalesDocument.LineItems, function(row) {
						return (!!row.ItemCategory && row.ItemCategory.substring(0,1) != 'Y') || (!!row.ReasonForRejection && !row.MarkedAsDeleted);
					});
					if (!!unsubmitted && unsubmitted.length != 0) {
						newSalesDocument.SalesOrderStatus = 'E0001';
					} else {
						newSalesDocument.SalesOrderStatus = 'E0002';
					}
					console.log("initiating Save...");
					datacontext.salesdocuments.create(newSalesDocument).done(function(data) {
						var msg = '';

							busyDlg.setText('Document '+data.SalesDocumentID+' created, reloading from SAP.');
							console.log("Save successful.");

							if (data.SalesDocumentID && data.CustomerID) {
								currentState.setProperty('/isEditMode',false);
								currentState.setProperty('/isNotEditMode', true);
								currentState.setProperty('/canEdit', _canEdit());
//								currentState.setProperty('/canEdit', (currentState.getProperty('/isQuote') || currentState.getProperty('/isPendingSalesOrder')));
								copies.setProperty('/currentDocumentCopy',null);
								copies.setProperty('/currentLinesCopy',[]);
								copies.setProperty('/currentCustomerCopy',null);

									if (!exit) {
										setTimeout(function() {
											_refreshSalesDocumentFromServer(data.SalesDocumentID, true).done(function() {
												eventBus.publish("master","salesDocAltered", data);
												sap.ui.core.UIComponent.getRouterFor(view).navTo("detail", {
														salesDocId : data.SalesDocumentID,
														customerId : data.CustomerID,
														refresh : true,
														tab : 'lineItems'
													}, true);
												def.resolve(data.SalesDocumentID);
											}).fail(function() {
												sap.m.MessageBox.show("SalesUI Saved this record to SAP but could not retrieve it again.  You will be returned to the document selection list.  If Document " + data.SalesDocumentID + " is not in that list, wait a few seconds and hit the refresh button.", {
													icon: sap.m.MessageBox.Icon.ERROR,
													title: "SAP Error",
													actions: sap.m.MessageBox.Action.OK,
													onClose: function () {
														if (page) {
															splitApp.toDetail(splitApp.getInitialDetail());
															splitApp.showMaster();
														}
														currentSalesDocumentID = null;
														core.getModel('currentSalesDocument').setProperty('/SalesDocumentID','');
														sap.ui.core.UIComponent.getRouterFor(view).navTo("master",
															{
																from: "detail",
																customerId: data.CustomerID
															}, true);
													}
												});
												def.resolve(data.SalesDocumentID);
											});
										}, timeout);
									} else {
										def.resolve(data.SalesDocumentID);
									}

							} else {
								if (data && data.error && data.error.message && data.error.message.value) {
									msg = data.error.message.value;
								}
								def.reject(msg);
							}
						}).fail(function(msg) {
							def.reject(msg);
							_toggleEdit();
						});
					});

			return deferred.promise();
		},

//Begin of Change: To get the results of Duplicate PO :Change by SXVASAMSETTI, 02/16/16			
	_checkDuplicatePO = function(CustPOID){
			datacontext.customersPO.get(CustPOID).done( function(data){
				if(!data.Exist == ''){
					view.byId("Warning").setText('The entered PO already exist').addStyleClass("warning");
					view.byId("createSalesOrderCPOID").setValueState("Warning");
					
				}else{
					_clearWarning( );
				}
				
			} );		
		},
//End of Change		
		
		_deepCompare = function  () {
			var i, l, leftChain = [], rightChain = [];

					function compare2Objects (x, y) {

					// remember that NaN === NaN returns false
					// and isNaN(undefined) returns true
					if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
						 return true;
					}

					// Compare primitives and functions.
					// Check if both arguments link to the same object.
					// Especially useful on step when comparing prototypes
					if (x === y) {
						return true;
					}

					// Works in case when functions are created in constructor.
					// Comparing dates is a common scenario. Another built-ins?
					// We can even handle functions passed across iframes
					if ((typeof x === 'function' && typeof y === 'function') ||
					   (x instanceof Date && y instanceof Date) ||
					   (x instanceof RegExp && y instanceof RegExp) ||
					   (x instanceof String && y instanceof String) ||
					   (x instanceof Number && y instanceof Number)) {
						return x.toString() === y.toString();
					}

					// At last checking prototypes as good a we can
					if (!(x instanceof Object && y instanceof Object)) {
						return false;
					}

					if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
						return false;
					}

					if (x.constructor !== y.constructor) {
						return false;
					}

					if (x.prototype !== y.prototype) {
						return false;
					}

					// Check for infinitive linking loops
					if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
						 return false;
					}

					// Quick checking of one object beeing a subset of another.
					// todo: cache the structure of arguments[0] for performance
					for (var p in y) {
						if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
							return false;
						}
						else if (typeof y[p] !== typeof x[p]) {
							return false;
						}
					}

					for (var p in x) {
						if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
							return false;
						}
						else if (typeof y[p] !== typeof x[p]) {
							return false;
						}

						switch (typeof (x[p])) {
							case 'object':
							case 'function':

								leftChain.push(x);
								rightChain.push(y);

								if (!compare2Objects (x[p], y[p])) {
									return false;
								}

								leftChain.pop();
								rightChain.pop();
								break;
							default:
								if (x[p] !== y[p]) {
									return false;
								}
								break;
						}
					}

					return true;
				  }

			if (arguments.length < 1) {
				return true;
			  }

			  for (i = 1, l = arguments.length; i < l; i++) {

				  leftChain = []; //Todo: this can be cached
				  rightChain = [];

				  if (!compare2Objects(arguments[0], arguments[i])) {
					  return false;
				  }
			  }

			  return true;
			},

		handleSuggestMfr = function(event) {
			var term = event.getParameter("suggestValue"),
				source = event.getSource(),
				mfrs = view.getModel('globalSelectItems').getData()["Manufacturers"] || [],
				vdrs = view.getModel('globalSelectItems').getData()["Vendors"] || [],
				isMfr = (source.getBinding('value').getPath() == 'ManufacturerID'),
				suggestions = [];


			suggestions = $.grep((isMfr) ? mfrs : vdrs, function(n){
			  return n.ManufacturerName.match(new RegExp(term, "i"));
			});

			source.destroySuggestionItems();
			for (var i = 0, len = (!!suggestions) ? suggestions.length : 0; i < len; i++) {
				source.addSuggestionItem(new sap.ui.core.Item({
					text: suggestions[i].ManufacturerName,
				}));
			}
		},

		handleChangeMfrID = function(event) {
			var source = event.getSource(),
				manufacturerName = source.getValue(),
				binding = source.getBinding('value'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = (context) ? model.getProperty(context.getPath()) : model.getData(),
				saveRow = $.extend(true, {}, row),
				mfrs = view.getModel('globalSelectItems').getData()["Manufacturers"] || [],
				vdrs = view.getModel('globalSelectItems').getData()["Vendors"] || [],
				results = [],
				vdrMatch = null,
				found = false,
				isMfr = (source.getBinding('value').getPath() == 'ManufacturerID'),
				mfrorvendor = (binding.getPath() == 'ManufacturerID') ? "Manufacturer" : "Vendor";

			if (manufacturerName) {
				source.setValueState(sap.ui.core.ValueState.None);
				results = $.grep((isMfr) ? mfrs : vdrs, function(n){
					return n.ManufacturerName.toLowerCase() == manufacturerName.toLowerCase();
				});
				if (!results || results.length == 0) {
					results = $.grep((isMfr) ? mfrs : vdrs, function(n){
						return n.ManufacturerID == manufacturerName;
					});
				}
				if (!!results && results.length == 1) {
					if (isMfr) {
						row.ManufacturerID = results[0].ManufacturerID;
						row.MaterialID = '';
						row.ManufacturerPartID = '';
						row.CustomerPartID = '';
						row.CustomerMaterialID = '';
						vdrMatch = _.findWhere(vdrs, {SortL : results[0].SortL});
						if (vdrMatch) row.VendorID = vdrMatch.ManufacturerID;
					} else {
						row.VendorID = results[0].ManufacturerID;
						if (row.VendorID != saveRow.VendorID) {
							if (!row.ParentLineID || row.ParentLineID == '000000') {
								_makeTotalConfiguredItemLikeThis(row, model, ["VendorID"]);
							} else {
								if (row.ItemCategory.substring(0, 1) !== 'Y') {
									sap.ui.commons.MessageBox.show("You have selected a different vendor for a child of a configured item.\nDoes this item need to come to GDT for Staging?",
										sap.ui.commons.MessageBox.Icon.WARNING,
										"Stage Configured Item?",
										[sap.ui.commons.MessageBox.Action.YES, sap.ui.commons.MessageBox.Action.NO],
										function (resp) {
											if (resp == 'YES') {
												row.ItemCategory = _determineItemCategoryForStaging(row);
												_makeTotalConfiguredItemLikeThis(row, model, ["ItemCategory"]);
											}
										},
										sap.ui.commons.MessageBox.Action.YES);
								}
							}
						}

					}
					if (source.getValueState() == sap.ui.core.ValueState.Error) {
						source.setValueState(sap.ui.core.ValueState.None);
						source.setTooltip();
					}
					if (isMfr) {
						model.setProperty(context.getPath(),row);
					} else {
						model.setProperty('/VendorID', results[0].ManufacturerID);
	//	    	             			model.setProperty('/HasDistroFlag', (row.ManufacturerID != row.VendorID || row.ManufacturerPartID != row.CustomerPartID));
					}
					found = true;
				}

				if (!found) {
					source.setTooltip(new sap.ui.commons.RichTooltip({
						text : mfrorvendor + manufacturerName + ' is not in Master Data.  If this is the correct name, please contact Master Data Management.',
					}));
					source.setValueState(sap.ui.core.ValueState.Error);
					return false;
				}
			} else {
				if (binding.getPath() == 'ManufacturerID') {
					row.ManufacturerID = 0;
				} else {
					row.VendorID = 0;
				}
				source.setTooltip(new sap.ui.commons.RichTooltip({
					text : mfrorvendor + ' is a required field, please enter.',
				}));
				source.setValueState(sap.ui.core.ValueState.Error);
				return false;
			}
		},

		handleOutputTypeChanged = function (event) {
			var button = event.getParameter('button'),
				text = button.getText();

			switch (text.toLowerCase()) {
				case 'std' :
					core.getModel('currentState').setProperty('/outputType', 'ZAN1');
					break;
				case 'detailed' :
					core.getModel('currentState').setProperty('/outputType', 'ZAN2');
					break;
				case 'engineering' :
					core.getModel('currentState').setProperty('/outputType', 'ZAN3');
					break;
				case 'dtl.eng.' :
					core.getModel('currentState').setProperty('/outputType', 'ZAN4');
					break;
			}
		},

		handlePressBillingBlock = function (event) {
			var currentSalesDocument = view.getModel('currentSalesDocument'),
				billingBlock = currentSalesDocument.getProperty('/BillingBlock');

			if (billingBlock == '') {
				sap.m.MessageBox.confirm("Setting a Billing Block will prevent any further billing activities against this Sales Order until it is cleared.  Are you sure you wish to set a Billing Block?",
				function(confirmation) {
					if (confirmation == 'OK') {
						currentSalesDocument.setProperty('/BillingBlock', 'Z1');
						_doSave();
					}
				},
				"Confirm Set Billing Block");
			} else {
				sap.m.MessageBox.confirm("Clearing this Billing Block allow this Sales Order to be billed to the customer when deliveries are complete or immediately if the deliveries are already complete.  Are you sure you wish to clear the Billing Block?",
						function(confirmation) {
							if (confirmation == 'OK') {
								currentSalesDocument.setProperty('/BillingBlock', '');
								_doSave();
							}
						},
						"Confirm Clear Billing Block");
			}
		 },

		 _cleanDocument = function() {
			core.getModel('currentTotals').setData({});
			core.getModel('currentSalesDocumentLines').setData([]);
			core.getModel('currentSalesDocument').setData({});
			core.getModel('currentAttachments').setData([]);
			core.getModel('currentVia').setData({});

		 },

		 handleExitButtonPress = function(event) {
			 _exit();
		 },

		 _exit = function() {
			 if (core.getModel("currentState").getProperty("/isEditMode")) {
				 sap.m.MessageToast.show("Cannot exit to Customer selection page whilst in Edit Mode.");
				 return false;
			 }

			 _cleanDocument();
			 splitApp.toDetail(splitApp.getInitialDetail());
			 splitApp.showMaster();

			 router.navTo("customer",{from: "customer", customerId: currentCustomerID}, true);
		 },

		 handleNavButtonPress = function (event) {
			 if (core.getModel("currentState").getProperty("/isEditMode")) {
				 sap.m.MessageToast.show("Cannot return to Document selection page whilst in Edit Mode.");
				 return false;
			 }

			 _cleanDocument();
			 splitApp.toDetail(splitApp.getInitialDetail());
			 splitApp.showMaster();

			 if (!!event) event.preventDefault();
			 router.navTo("master",{from: "customer", customerId: currentCustomerID}, true);
		 },

		 handleRefresh = function (event) {
			 if (core.getModel("currentState").getProperty("/isEditMode")) {
				 sap.m.MessageToast.show("Cannot refresh page whilst in Edit Mode.");
				 return false;
			 }

			_refreshSalesDocumentFromServer(core.getModel('currentSalesDocument').getProperty('/SalesDocumentID'), true);
			var iconTabBar = view.byId("iconTabBar");
			 if (iconTabBar && (iconTabBar.getSelectedKey() == 'docflow'))
			 _refreshDocumentFlowFromServer(core.getModel('currentSalesDocument').getProperty('/ReferencedBy') || core.getModel('currentSalesDocument').getProperty('/SalesDocumentID') ,true);
         },

		handlePaste = function(event) {
			var e = event.originalEvent,
				data = (e.type == 'paste') ? e.clipboardData.getData('text') : '',
				target = event.target,
				tbl = view.byId('lineItemsTable'),
				rows = view.getModel('currentSalesDocumentLines').getData(),
				done = false,
				td = null,
				tr = null,
				body = null,
				startRow = tbl.getFirstVisibleRow(),
				lastRow = 0,
				numRows = (data) ? rows.length : 0,
				pasteRowNum = 0,
				pasteColNum = 0,
				tokens = [],
				tokencount = 0;

			if (numRows == 0) return;

			page.setBusyIndicatorDelay(0);
			page.setBusy(true);

			setTimeout(function() {
				var details = view.getModel('currentSalesDocumentLines'),
					errors = [],
					detailsArray = _.map(details.getData(), _.clone);

				td = $(target).closest('td');

				if (td) {
					tr = $(td).closest('tr');
				}

				if (tr){
					pasteColNum =  _.findIndex(tr.children(), {id : $(td).attr('id')});
					body = tr.closest('tbody');
				}

				if (body) {
					lastRow = body.children().length - 1;
					pasteRowNum =  _.findIndex(body.children(), {id : $(tr).attr('id')});
				}

				if (core.getModel('currentState').getProperty('/isEditMode')) {
					tokens = _.without(data.split(/\r\n|\r|\n/g),'');    // split('\r');
					tokencount = tokens.length;

					tokens = _.map(tokens, function (token) {  // strip commas and $ or % signs
						if (token.replace(/[^0-9$.,]/g, '') == token) {
							return token.replace(/[^0-9.]/g, '');
						}

						return token;
					});

					for (var i = 0; i < (tokencount - (numRows - (startRow + pasteRowNum))); i++) {
						detailsArray.push(_createNewLine(detailsArray));
					}
					setTimeout(function () {
						var c = _.find(tbl.getColumns(), function (col) {
								var colid = col.getAggregation('template').getId(),
									trgid = target.getAttribute('id').substring(0, colid.length);

								return colid == trgid;
							}),
							mfr = null,
							t = (c) ? c.getTemplate() : null,
							bindingInfo = (t) ? t.getBindingInfo('value') : null,
							parts = (bindingInfo) ? bindingInfo.parts : null,
							firstPart = (parts && parts.length > 0) ? parts[0] : null,
							keys = [],
                            shipTos = core.getModel('customerSelectItems').getProperty('/ShipTos'),
							addressIDs = [],
							missingAddresses = [],
							customerID = core.getModel('currentCustomer').getProperty('/CustomerID'),
							path = (firstPart) ? firstPart.path : null;

						if (path) {
							if (path == 'CustomerPartID' || path == 'ManufacturerPartID') {
								_.each(tokens, function(token) {
									var key = {
											CustomerID : customerID,
											ManufacturerID : '0',
											MaterialID : '',
											MfrPartID : ($.isNumeric(token)) ?  token.toUpperCase().trim().replace(/^0+/, '') : token.toUpperCase().trim(),
										};

									if (key.MfrPartID.length == 9 && parseInt(key.MfrPartID).toString() == key.MfrPartID) { // GDT SAP Material ID
										key.MaterialID = key.MfrPartID;
										key.MfrPartID = '';
									}
									if(!!key.MaterialID || !!key.MfrPartID) keys.push(key);
								});
								keys = _.uniq(keys, function(key) { return key.MaterialID + key.MfrPartID; });
								keys = _.filter(keys, function(key) { return !datacontext.materials.getLocal(key);});
								if (keys.length > 0) {
									try {
										datacontext.materials.load(keys).done(function () {
											var result;
											_.each(detailsArray, function (r, i) {
												if ((i >= (startRow + pasteRowNum)) && ((i - (startRow + pasteRowNum)) < tokencount)) {
													result = _lookupPartID(detailsArray[i], tokens[i - (startRow + pasteRowNum)], true, (path == 'CustomerPartID'), null, null, true);
													if (!!result) {
														if (!!result.MaterialID) {
															detailsArray[i] = result;
														} else {
															result.CustomerPartID = tokens[i - (startRow + pasteRowNum)];
															errors.push(result);
														}
													}
												}
											});
											if (errors.length == 0) {
												details.setData(detailsArray);
												_calculateTotals();
											} else {
												errors = _.uniq(errors, function (error) {
													return error.CustomerPartID;
												});
												_presentImportErrors(errors);
											}
											page.setBusy(false);
										}).fail(function (msg) {
											sap.m.MessageToast.show(msg);
											page.setBusy(false);
										});
									} catch (e) {
										sap.m.MessageToast.show("Couldn't load the pasted part numbers.");
										page.setBusy(false);
									}
								} else {
									_.each(detailsArray, function (r, i) {
										if ((i >= (startRow + pasteRowNum)) && ((i - (startRow + pasteRowNum)) < tokencount)) {
											detailsArray[i] = _lookupPartID(detailsArray[i], tokens[i - (startRow + pasteRowNum)], true, (path == 'CustomerPartID'), null, null, true);
										}
									});
									details.setData(detailsArray);
									_calculateTotals();
									page.setBusy(false);
								}
							} else {
								if (path == 'ShipToID') {
									_.each(tokens, function(token) {
										var address = addressHelper.find(token, shipTos);

										if (!!address) {
											addressIDs.push(address.PartnerID);
										} else {
											missingAddresses.push(token);
										}
									});
									if (missingAddresses.length == 0) {
                                        _.each(detailsArray, function (r, i) {
                                            if ((i >= (startRow + pasteRowNum)) && ((i - (startRow + pasteRowNum)) < tokencount)) {
                                                detailsArray[i][path] = addressIDs[i - (startRow + pasteRowNum)];
                                            }
                                        });
                                        details.setData(detailsArray);
                                        _calculateTotals();
                                        page.setBusy(false);
									} else {
										missingAddresses = _.uniq(missingAddresses);
										_presentAddressErrors(missingAddresses);
                                        page.setBusy(false);
									}
								} else {
									_.each(rows, function (r, i) {
										if ((i >= (startRow + pasteRowNum)) && ((i - (startRow + pasteRowNum)) < tokencount)) {
											switch (path) {
												case 'ManufacturerID' :
													mfr = _.findWhere(view.getModel('globalSelectItems').getProperty('/Manufacturers'), {ManufacturerName: tokens[i - (startRow + pasteRowNum)]});
													detailsArray[i][path] = (!!mfr) ? mfr.ManufacturerID : '';
													break;
												case 'VendorID' :
													mfr = _.findWhere(view.getModel('globalSelectItems').getProperty('/Vendors'), {ManufacturerName: tokens[i - (startRow + pasteRowNum)]});
													detailsArray[i][path] = (!!mfr) ? mfr.ManufacturerID : '';
													break;
												default :
													detailsArray[i][path] = tokens[i - (startRow + pasteRowNum)];
													break;
											}
										}
									});
									details.setData(detailsArray);
									_calculateTotals();
									page.setBusy(false);
								}
							}
						}
					});
				}
			});
			event.preventDefault();
			event.stopPropagation();

		},

		handleClearRejected = function(event) {
			var source = event.getSource(),
				binding = source.getBinding('visible').getBindings()[0], // Complex binding expression
				context = binding.getContext(),
				model = binding.getModel(),
				row = model.getProperty(context.getPath());

			if (!core.getModel('currentState').getProperty('/isEditMode')) return;
			if (!!row.WBSElement) return;
			if (!row.ReasonForRejection) return;
			if (!!row.MarkedAsDeleted) return;
			if (!!row.DeletedFlag) return;

			sap.m.MessageBox.confirm("Clearing the reason for rejection will resubmit this line to Procurement when you hit 'Save'.  Are you sure you wish to clear the reason for rejection?", function (confirmation) {
				if (confirmation != 'CANCEL') {
					model.setProperty(context.getPath() + '/ReasonForRejection', '');
					model.setProperty(context.getPath() + '/Selected', false);
                    row = model.getProperty(context.getPath());
                    _makeChildItemsLikeThis(row, model, 'ReasonForRejection');
					_calculateTotals();
				}
			}, "Clear Reason for Rejection?");


		},

		handleChangeDetailLineDeliveryDate = function(event) {
			var source = event.getSource(),
				binding = source.getBinding('dateValue'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = (context) ? model.getProperty(context.getPath()) : model.getData();

			_makeTotalConfiguredItemLikeThis(row, model, ["DeliveryDate"]);
		},

		handleChangeCustomerPOID = function(event) {
			var source = event.getSource(),
				binding = source.getBinding('value'),
				context = binding.getContext(),
				model = binding.getModel(),
				row = (context) ? model.getProperty(context.getPath()) : model.getData();

			_makeTotalConfiguredItemLikeThis(row, model, ["CustomerPOID"]);
		};

		return {
			onInit : onInit,
			onBeforeRendering : onBeforeRendering,
			onAfterRendering : onAfterRendering,
			handleDetailDeleteSelect : handleDetailDeleteSelect,
			handleDragOver : handleDragOver,
			handleDropFile : handleDropFile,
			handleChangeHeaderCustomerPOID : handleChangeHeaderCustomerPOID,
			handleChangeHeaderReqDate : handleChangeHeaderReqDate,
			handleChangeHeaderShipTo : handleChangeHeaderShipTo,
			handleMfrHelp : handleMfrHelp,
			handleMfrHelpSearch : handleMfrHelpSearch,
			handleMfrHelpClose : handleMfrHelpClose,
			handleAddDetailLine : handleAddDetailLine,
			handlePartIDHelp : handlePartIDHelp,
			handleChangePartID : handleChangePartID,
			handleChangeLineID : handleChangeLineID,
			handleSubmitSalesOrder : handleSubmitSalesOrder,
			handleDetailSelect : handleDetailSelect,
			handleCreateSalesOrder : handleCreateSalesOrder,
			handleCreateSalesOrderCPOIDChange : handleCreateSalesOrderCPOIDChange,
			handleConfirmCreateSalesOrder : handleConfirmCreateSalesOrder,
			handleCancelCreateSalesOrder : handleCancelCreateSalesOrder,
			handleCopyQuote : handleCopyQuote,
			handleCopySOLines:handleCopySOLines,
			handleOutputRequest : handleOutputRequest,
			handleExportToExcelRequest : handleExportToExcelRequest,
			handlePrintRequest : handlePrintRequest,
			handleDropShipSelect : handleDropShipSelect,
			handleStagingSelect : handleStagingSelect,
			handleViaHeaderPress : handleViaHeaderPress,
			handleViaDetailPress : handleViaDetailPress,
			handleCloseViaDialog : handleCloseViaDialog,
			handleEditCancelButtonPress : handleEditCancelButtonPress,
			handleSaveButtonPress : handleSaveButtonPress,
			handleSaveAndExitButtonPress : handleSaveAndExitButtonPress,
			handleSuggestMfr : handleSuggestMfr,
			handleChangeMfrID : handleChangeMfrID,
			handlePressBillingBlock : handlePressBillingBlock,
			handleCancelImportErrorDialog : handleCancelImportErrorDialog,
			handleEmailMasterData : handleEmailMasterData,
			handleDetailLineNotes : handleDetailLineNotes,
			handleChangeDetailLineShipTo : handleChangeDetailLineShipTo,
			handleOpenSharepointLibrary : handleOpenSharepointLibrary,
			handleNavButtonPress : handleNavButtonPress,
			handleSuggestPartner : handleSuggestPartner,
			handleChangeHeaderPayer : handleChangeHeaderPayer,
			handleChangeHeaderBillTo : handleChangeHeaderBillTo,
			handleChangeHeaderEndCustomer : handleChangeHeaderEndCustomer,
			handleOutputTypeChanged : handleOutputTypeChanged,
			handleStdQuotePDFRequest : handleStdQuotePDFRequest,
			handleOutputTypeSelectDefault : handleOutputTypeSelectDefault,
			handleDetailedQuotePDFRequest : handleDetailedQuotePDFRequest,
			handleEngineeringQuotePDFRequest : handleEngineeringQuotePDFRequest,
			handleDetailedEngineeringQuotePDFRequest : handleDetailedEngineeringQuotePDFRequest,
			handleBudgetSheetPDFRequest : handleBudgetSheetPDFRequest,
			handleExcelExportRequest : handleExcelExportRequest,
			handleTableKeyDown : handleTableKeyDown,
			handleChangeDetailLineDealID : handleChangeDetailLineDealID,
			handleExitButtonPress : handleExitButtonPress,
			handleDeleteButtonPress : handleDeleteButtonPress,
			handleRefresh : handleRefresh,
			handlePaste : handlePaste,
			handleChangeCustomerPOID : handleChangeCustomerPOID,
			handleChangeDetailLineDeliveryDate : handleChangeDetailLineDeliveryDate,
			handleCancelAddressErrorDialog : handleCancelAddressErrorDialog,
			handleClearRejected: handleClearRejected,
			handleSummarySOConfirmationPDFRequest : handleSummarySOConfirmationPDFRequest,
			handleDetailedSOConfirmationPDFRequest : handleDetailedSOConfirmationPDFRequest,
			handleEDIOutputRequest : handleEDIOutputRequest,
			handleDetailedEngineeringQuoteSummaryPDFRequest : handleDetailedEngineeringQuoteSummaryPDFRequest,
			handleEngineeringQuoteSummaryPDFRequest : handleEngineeringQuoteSummaryPDFRequest,
			handleOpenDeleteDialog:handleOpenDeleteDialog,
		};



	}($, sap.ui.getCore(), _, gdt.salesui.data.DataImporter, gdt.salesui.data.DataContext, gdt.salesui.util.AddressHelper, gdt.salesui.util.Sharepoint, gdt.salesui.util.Formatter, gdt.salesui.vm.SalesDocumentDetail));
