$.sap.declare("gdt.salesui.data.DataContext");
$.sap.require("gdt.salesui.data.DataService");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataContext = (function($, core, _, dataservice) {
	    var entitySet = function(idname, foreignKey, nullKey, getFunction, loadFunction, getByForeignKeyFunction, updateFunction, createFunction, removeFunction, neverLocal,sendFunction) {
	        var _items = {},
				_failedGets = {},
	        	_requests = [],
	        	_emptySets = [],
	            _add = function(newObj, key) {
	        		if (!newObj && !key) return;
	        		if (!!nullKey && ($.type(idname) === "string") && !!newObj && (newObj[idname] == nullKey)) return;
					if (!key) {
						if ($.type(idname) === "string") {
							key = newObj[idname];
						} else {
							key = '';
							_.each(idname, function (part) {
								key += ((!!newObj[part]) ? newObj[part] : '');
							});
						}
					}

					if (!!newObj) {
						_items[key] = newObj;
						_failedGets[key] = false;
					} else {
						_failedGets[key] = true;
					}
	            },
	            _remove = function(id) {
	            	var key = id;
	            	
	            	if (!key) return;
	            	if ($.type(id) !== "string") {
						if ($.type(idname) === "string") {
							key = id[idname];
						} else {
							key = '';
							_.each(idname, function(part) { key += ((!!id[part]) ? id[part] : ''); });
						}
	            	}
	            	
	            	delete _items[key];
	            },
				isKnownBad = function(id) {
					var key = id;

					if (!key) return false;

					if ($.type(id) !== "string") {
						if ($.type(idname) === "string") {
							key = id[idname];
						} else {
							key = '';
							_.each(idname, function(part) { key += ((!!id[part]) ? id[part] : ''); });
						}
					}
					return !!_failedGets[key] ? true : false;
				},
	            getLocal = function(id) {
					var key = id;

					if (!key) return null;

					if ($.type(id) !== "string") {
						if ($.type(idname) === "string") {
							key = id[idname];
						} else {
							key = '';
							_.each(idname, function(part) { key += ((!!id[part]) ? id[part] : ''); });
						}
					}
	                return !!_items[key] ? jQuery.extend(true, {}, _items[key]) : null;
	            },
	            getLocalByForeignKey = function(key) {
	            	if (!key) return [];
	            	if (!foreignKey) return [];
	            	
	            	return _.map(_.filter(_items, function(item){ 
			            		return item[foreignKey] == key; 
			            	}), function (item) {
	            				return jQuery.extend(true, {}, item);
	            	});
	            },
	            getAllLocal = function() {
	                return _.toArray(_items);
	            },
	            get = function(id, forceRefresh) {
                    if (!!neverLocal) forceRefresh = true;
	                return $.Deferred(function(def) {
	                    var result = null,
							key = null,
	                    	req = null;

						if ($.type(idname) === "string") {
							key = id;
						} else {
							key = '';
							_.each(idname, function(part) {
								key += ((!!id[part]) ? id[part] : '');
							});
						}

						result = getLocal(key);

						req = _requests[key];
	                    
	                    if (!!result && forceRefresh) {
	                    	_remove(result);
	                    	result = null;
	                    }
	                    
	                    if (!!result) {  // Not force refresh and result local so we're done!
	                    	def.resolve(result);
	                    	return;
	                    }
	
	                    // The result isn't local or we forced a refresh

	                    if (!!req) { // Already attempting to load this so resolve/reject based on that promise
	                    	req.done(function (res) {
	                    		def.resolve(res);
	                    	}).fail(function (response) {
	                    		def.reject(response);
	                    	});
	                    	return;
	                    }
	                    
	                    // Ok have to go get it...
	                    
	                    _requests[key] = def; // Queue the request so we don't duplicate.
	                    
	                    
	                    if (!getFunction) {
	                    	def.reject('Get function not defined');
	                    	return;
	                    }
	                    
                        getFunction(id).done(function(data) {
                        		_add(data, key);
                                def.resolve(data);
                            }).fail(function(response) {
                                console.log(response);
                                def.reject(response);
                            }).always(function() {
								delete _requests[key];
							});
	                }).promise();
	            },
	            
	            
	            
	            
	            
	            getByForeignKey = function(key, forceRefresh) {
	                return $.Deferred(function(def) {
	                    var results = getLocalByForeignKey(key),
	                    	req = _requests[foreignKey+key];
	                    
	                    if (!!results && results.length > 0 && forceRefresh) {
	                    	_.each(results, function(result) { _remove(result); });
	                    	results = [];
	                    } else {
	                    	if (forceRefresh && !!_emptySets[foreignKey+key]) {
	                    		delete _emptySets[foreignKey+key];
	                    	}
	                    }
	                    
	                    if (!foreignKey) {
	                    	def.reject('Foreign key not defined');
	                    	return;
	                    }

	                    if (!!results && results.length > 0) {  // Not force refresh and result local so we're done!
	                    	def.resolve(results);
	                    	return;
	                    }
	
	                    // The result isn't local or we forced a refresh

	                    if (!!req) { // Already attempting to load this so resolve/reject based on that promise
	                    	req.done(function () {
	                    		def.resolve();
	                    	}).fail(function (response) {
	                    		def.reject(response);
	                    	});
	                    	return;
	                    }
	                    
	                    // Ok have to go get it...
	                    
	                    if (forceRefresh) delete _emptySets[foreignKey+key];
	                    
	                    if (!!_emptySets[foreignKey+key]) {
	                    	def.resolve([]);
	                    	return;
	                    }
	                    
	                    _requests[foreignKey+key] = def; // Queue the request so we don't duplicate.
	                    	                    
	                    if (!getByForeignKeyFunction) {
	                    	def.reject('Get by foreign key function not defined');
	                    	return;
	                    }
	                    
	                    getByForeignKeyFunction(key).done(function(data) {
	                    		if (!data || data.length == 0) {
// MG Disable for now, causes issues when we get a bad read attempt after saving
// 	                    			_emptySets[foreignKey+key] = true;
	                    		} 
                        		_.each(data, function(result) {
                        			_add(result);
                        			});
                                def.resolve();
                        		delete _requests[foreignKey+key];
                            }).fail(function(response) {
                                console.log(response);
                                def.reject(response);
							}).always(function() {
								delete _requests[foreignKey+key];
							});
                	}).promise();	            
                },
	            load = function(id) {
	                return $.Deferred(function(def) {
	                    if (!loadFunction) {
	                        console.error('Load function not defined');
	                        def.reject('Load function not defined');
	                        return;
	                    }
	
	                    loadFunction(id).done(function(results) {
	                    		_.each(results, function(result, idx) {
									var key = null;
									if (!!id && ($.type(id) !== "string")) {
										key = '';
										_.each(id[idx], function(part) { key += ((!!part) ? part : '');});
									}
		                    		_add(result, key);
	                    		});
	                            def.resolve();
	                        }).fail(function(response) {
	                            def.reject(response);
	                        });
	                }).promise();
	            },
	            update = function(updatedObj) {
	                return $.Deferred(function(def) {
	                    if (!updateFunction) {
	                        console.error('Update function not defined');
	                        def.reject('Update function not defined');
	                        return;
	                    }
	
	                    updateFunction(updatedObj).done(function(data) {
	                    		_add(data);
	                            def.resolve(data);
	                        }).fail(function(response) {
	                            console.log(response);
	                            def.reject(response);
	                        });
	                }).promise();
	            },
	            create = function(newObj) {
	                return $.Deferred(function(def) {
	                    if (!createFunction) {
	                        console.error('Create function not defined');
	                        def.reject('Create function not defined');
	                        return;
	                    }
	
	                    createFunction(newObj).done(function(data) {
	                            def.resolve(data);
	                        }).fail(function(response) {
	                            console.log(response);
	                            def.reject(response);
	                        });
	                }).promise();
	            },
	            remove = function(id) {
	                return $.Deferred(function(def) {
	                    if (!removeFunction) {
	                        console.error('Remove function not defined');
	                        def.reject('Remove function not defined');
	                        return;
	                    }
	
	                    removeFunction(id).done(function(data) {
	                    		_remove(id);
	                            def.resolve(data);
	                        }).fail(function(response) {
	                            console.log(response);
	                            def.reject(response);
	                        });
	                }).promise();
	            };
	            
	            send = function(content){
	            	return $.Deferred(function(def) {
	                    if (!sendFunction) {
	                        console.error('send function not defined');
	                        def.reject('send function not defined');
	                        return;
	                    }
	
	                    sendFunction(content).done(function(data) {
	                            def.resolve(data);
	                        }).fail(function(response) {
	                            console.log(response);
	                            def.reject(response);
	                        });
	                }).promise();	            	
	            	
	            	
	            };
	            
	            
	        return {
	            create: create,
				isKnownBad: isKnownBad,
	            getAllLocal: getAllLocal,
	            getLocal: getLocal,
	            getLocalByForeignKey: getLocalByForeignKey,
	            get: get,
	            getByForeignKey: getByForeignKey,
	            load: load,
	            remove: remove,
	            update: update,
	            send:send
	        };
	    },        
	    //----------------------------------
	    // Repositories
	    //----------------------------------
		userprefs = new entitySet('UserID', null, null,null, dataservice.userprefs.load, null, null, null, null,null),
		customers = new entitySet('CustomerID', null, null, dataservice.customers.get, dataservice.customers.load, null, null, null, null,null),
	    customerbalances = new entitySet('Customer', null, null, dataservice.customerbalances.get, null, null, null, null, null,null),
	    customershiptos = new entitySet('PartnerID', 'CustomerID', null, null, null, dataservice.customershiptos.getByForeignKey, null, null, null,null),
	    customerbilltos = new entitySet('PartnerID', 'CustomerID', null, null, null, dataservice.customerbilltos.getByForeignKey, null, null, null,null),
	    customerpayers = new entitySet('PartnerID', 'CustomerID', null, null, null, dataservice.customerpayers.getByForeignKey, null, null, null,null),
	    customerendcustomers = new entitySet('PartnerID', 'CustomerID', null, null, null, dataservice.customerendcustomers.getByForeignKey, null, null, null,null),
	    customersalesadmins = new entitySet('PartnerName', 'CustomerID', null, null, null, dataservice.customersalesadmins.getByForeignKey, null, null, null,null),
	    customeracctmgrs = new entitySet('PartnerID', 'CustomerID', null, null, null, dataservice.customeracctmgrs.getByForeignKey, null, null, null,null),
	    salesdocuments = new entitySet('SalesDocumentID', 'CustomerID', '0000000000', dataservice.salesdocuments.get, null, dataservice.salesdocuments.getByForeignKey, null, dataservice.salesdocuments.create, dataservice.salesdocuments.remove, true,null),
	    salesdocumentlines = new entitySet(['SalesDocumentID','SalesDocumentLineID'], 'SalesDocumentID', null, null, null, dataservice.salesdocumentlines.getByForeignKey, null, null, null, true,null),
	    salesdocumentattachments = new entitySet('InstId_b', 'SalesDocumentID', null, null, null, dataservice.salesdocumentattachments.getByForeignKey, null, null, null, true,null),
		materials = new entitySet(['CustomerID', 'ManufacturerID', 'MaterialID', 'MfrPartID'], null, null, dataservice.materials.get, dataservice.materials.load, null, null, null, null,null),
		rejectionreasons = new entitySet('ReasonCode', null, null, null, dataservice.rejectionreasons.load, null, null, null, null,null),	
//The below is added to fetch Customers PO Existance :SXVASAMSETTI	
		customersPO = new entitySet('CustomerPOID', null, null, dataservice.customers.getPO,null, null, null, null, null,null),
//The below line is added to fetch document flow lines: SXVASAMSETTI
		documentFlow = new entitySet('DocumentID', 'DocumentID', null, dataservice.documentflow.get,null, dataservice.documentflow.getByForeignKey, null, null, null,null),		
//The below line is added to fetch Sales Order Available Quantities		
		SoAvailableQty = new entitySet('DocumentID', 'DocumentID', null, dataservice.SoAvailableQty.get,null, dataservice.SoAvailableQty.getByForeignKey, null, null, null,null),
//The below line is added to Send Mail notification about MasterData Creation:SXVASAMSETTI
		EmailNotification = new entitySet('MailContent', null, null,null,null, null, null, null, null,null,dataservice.EmailNotification.send),
//The below line is added to Create Line Item Table Layout Variant :SXVASAMSETTI
		variant = new entitySet('VariantID','Vbtyp', null, dataservice.variant.get, dataservice.variant.load, null, dataservice.variant.update, dataservice.variant.create, dataservice.variant.remove, true,null),
		
		datacontext = {
	    customers: customers,
	    customersPO:customersPO, //added by SXVASAMSETTI
		userprefs: userprefs,
		customerbalances: customerbalances,
	    customershiptos: customershiptos,
	    customerbilltos: customerbilltos,
	    customerpayers: customerpayers,
	    customerendcustomers: customerendcustomers,
	    customersalesadmins: customersalesadmins,
	    customeracctmgrs: customeracctmgrs,
	    salesdocuments: salesdocuments,
	    salesdocumentlines: salesdocumentlines,
	    salesdocumentattachments: salesdocumentattachments,
		materials: materials,
		rejectionreasons: rejectionreasons,
		documentFlow:documentFlow,   //added by SXVASAMSETTI
		SoAvailableQty:SoAvailableQty,
		EmailNotification:EmailNotification,
		variant:variant
	};
	
	return datacontext;

})($,sap.ui.getCore(),_, gdt.salesui.data.DataService);
