$.sap.declare("gdt.salesui.util.Sharepoint");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");
$.sap.require("gdt.salesui.data.DataLoader");

gdt.salesui.util.Sharepoint = (function($, core, _, dataloader) {
	var _sharepointBaseUrl = ((window.location.hostname === "localhost") ? "proxy" : "") + '/sites/SAPDocs',
		_contextRequest,
		_sharepointDigestTimeout = 30000,
		_sharepointDigestToken = null,
		_refreshDigest = function() {
			if (!_contextRequest) {
				_contextRequest = $.Deferred(function (def) {
					$.ajax({
						url: _sharepointBaseUrl + "/_api/contextinfo",
						method: "POST",
						headers: {"Accept": "application/json; odata=verbose"},
						success: function (data) {
							_sharepointDigestTimeout = (data.d.GetContextWebInformation.FormDigestTimeoutSeconds) * 500; // renew when half way through life
							_sharepointDigestToken = data.d.GetContextWebInformation.FormDigestValue;
							console.log('Sharepoint Digest Refreshed: ' + _sharepointDigestToken);
							console.log('Refresh in (secs) : ' + _sharepointDigestTimeout / 1000);
							_contextRequest = null;
							def.resolve();
							setTimeout(_refreshDigest, _sharepointDigestTimeout);
						},
						error: function (data, errorCode, errorMessage) {
							var msg = 'Sharepoint Digest Refresh Failed!' + ' (' + data.status + ' ' + data.statusText + ')';
							console.error(msg);
							_contextRequest = null;
							def.reject(msg);
							setTimeout(_refreshDigest, 30000);
						}
					});
				});
			}
			
			return _contextRequest.promise();
		},
				
		_initialized = false,

		ensureInitialized = function() {
			var deferred = $.Deferred(function (def) {
				if (_initialized) {
					def.resolve();
				} else {
					_refreshDigest().done(function() {
						_intialized = true;
						def.resolve();
					}).fail(function (msg) {
						def.reject(msg);
					});
				}
			});
			
			return deferred.promise();
		},
	
		ensureClientFolder = function() {
			var clientFolderRelativeUrl = null,
				sapclient = core.getModel('systemInfo').getProperty('/ClientID'),
				deferred = $.Deferred(function (def) {
				ensureInitialized().done(function () {
					$.ajax({
					    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('Documents')/Folders('Client-" + sapclient + "')",
					    method: "GET",
					    headers: { "Accept": "application/json; odata=verbose"},
					    success: function (data) {
                            console.log(data);
				    		clientFolderRelativeUrl = data.d.ServerRelativeUrl;
							console.log('Sharepoint Folder Exists : ' + clientFolderRelativeUrl);
							def.resolve(clientFolderRelativeUrl);
					    },
					    error: function (data, errorCode, errorMessage) {
					    	var msg = 'Error when attempting to retrieve Sharepoint Folder for SAP-Client:  ' + sapclient + ' (' + data.status + ' ' +  data.statusText + ')';
					    	if (data.status == 404) { // Folder doesn't exist yet so create it 
								$.ajax({
								    url: _sharepointBaseUrl + "/_api/web/folders",
								    method: "POST",
								    headers: {  "Accept": "application/json; odata=verbose",
								    			"X-RequestDigest": _sharepointDigestToken,
								    			"content-type" : "application/json;odata=verbose"
								    	},
								    data: JSON.stringify({ '__metadata' : { 'type' : 'SP.Folder' }, 
								    		'ServerRelativeUrl' : 'Documents/Client-' + sapclient 
								    	}),
								    success: function (d2) {
								    	clientFolderRelativeUrl = d2.d.ServerRelativeUrl;
										def.resolve(clientFolderRelativeUrl);
										console.log('Sharepoint Folder Created for SAP-Client: ' + sapclient);
								    },
								    error: function (d2) {
								    	var msg = 'Sharepoint Create Folder failed for SAP-Client: ' + sapclient + ' (' + d2.status + ' ' +  d2.statusText + ')';
								    	console.error(msg);
								    	def.reject(msg);
								    }
								});					    		
					    	} else { // Something else when wrong so report error
						    	console.error(msg);
						    	def.reject(msg);
					    	}
					    }
					});
				}).fail(function (msg) {
					def.reject(msg);
				});
			});
			
			return deferred.promise();
		},

		ensureCustomerFolder = function(customerID) {
			var customerFolderRelativeUrl = null,
				sapclient = core.getModel('systemInfo').getProperty('/ClientID'),
				deferred = $.Deferred(function (def) {
					ensureClientFolder().done(function () {
						dataloader.loadCustomerInfo(customerID).done(function() {
							var customerName = core.getModel('currentCustomer').getProperty('/CustomerName').replace(/[\/&#\?\.]+/g,'').replace("'","");
							
							$.ajax({
							    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('Documents/Client-" + sapclient + "')/Folders?$filter=startswith(Name,'" + customerID + "')",
							    method: "GET",
							    headers: { "Accept": "application/json; odata=verbose"},
							    success: function (data) {
							    	if (data.d.results.length == 0) {
										$.ajax({
										    url: _sharepointBaseUrl + "/_api/web/folders",
										    method: "POST",
										    headers: {  "Accept": "application/json; odata=verbose",
										    			"X-RequestDigest": _sharepointDigestToken,
										    			"content-type" : "application/json;odata=verbose"
										    	},
										    data: JSON.stringify({ '__metadata' : { 'type' : 'SP.Folder' }, 
										    		'ServerRelativeUrl' : 'Documents/Client-' + sapclient + '/'+customerID + ' - ' + customerName 
										    	}),
										    success: function (data) {
									    		customerFolderRelativeUrl = data.d.ServerRelativeUrl;
												def.resolve(customerFolderRelativeUrl);
												console.log('Sharepoint Folder Created: ' + customerID);
										    },
										    error: function (data, errorCode, errorMessage) {
										    	var msg = 'Sharepoint Create Folder Failed!' + ' (' + data.status + ' ' +  data.statusText + ')';
										    	console.error(msg);
										    	def.reject(msg);
										    }
										});					    		
							    	} else {
							    		customerFolderRelativeUrl = data.d.results[0].ServerRelativeUrl;
										console.log('Sharepoint Folder Exists : ' + customerFolderRelativeUrl);
										def.resolve(customerFolderRelativeUrl);
							    	}
							    },
							    error: function (data, errorCode, errorMessage) {
							    	var msg = 'Error when attempting to retrieve Sharepoint Folder:  ' + customerID + ' (' + data.status + ' ' +  data.statusText + ')';
							    	console.error(msg);
							    	def.reject(msg);
							    }
							});
						}).fail(function(msg) {
							def.reject(msg);
						});
				}).fail(function (msg) {
					def.reject(msg);
				});
			});
			
			return deferred.promise();
		},

		ensureSalesDocFolder = function(customerID, salesDocID) {
			var salesDocRelativeUrl = null,
				deferred = $.Deferred(function (def) {
					ensureCustomerFolder(customerID).done(function (customerFolderRelativeUrl) {
						$.ajax({
						    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('"+customerFolderRelativeUrl+"')/Folders?$filter=startswith(Name,'" + salesDocID + "')",
						    method: "GET",
						    headers: { "Accept": "application/json; odata=verbose"},
						    success: function (data) {
						    	if (data.d.results.length == 0) {
									$.ajax({
									    url: _sharepointBaseUrl + "/_api/web/folders",
									    method: "POST",
									    headers: {  "Accept": "application/json; odata=verbose",
									    			"X-RequestDigest": _sharepointDigestToken,
									    			"content-type" : "application/json;odata=verbose"
									    	},
									    data: JSON.stringify({ '__metadata' : { 'type' : 'SP.Folder' }, 
									    		'ServerRelativeUrl' : customerFolderRelativeUrl+'/'+salesDocID
									    	}),
									    success: function (data) {
									    	salesDocRelativeUrl = data.d.ServerRelativeUrl;
											def.resolve(salesDocRelativeUrl);
											console.log('Sales Document Folder Created: ' + salesDocRelativeUrl);
									    },
									    error: function (data, errorCode, errorMessage) {
									    	var msg = 'Sharepoint Create Folder Failed!' + ' (' + data.status + ' ' +  data.statusText + ')';
									    	console.error(msg);
									    	def.reject(msg);
									    }
									});					    		
						    	} else {
						    		salesDocRelativeUrl = data.d.results[0].ServerRelativeUrl;
									console.log('Sales Document Folder Exists @ ' + salesDocRelativeUrl);
									def.resolve(salesDocRelativeUrl);
						    	}
						    },
						    error: function (data, errorCode, errorMessage) {
						    	var msg = 'Error when attempting to retrieve Sharepoint Folder:  ' + customerID + ' (' + data.status + ' ' +  data.statusText + ')';
						    	console.error(msg);
						    	def.reject(msg);
						    }
						});
					}).fail(function (msg) {
						def.reject(msg);
					});
				});
			
			return deferred.promise();
		},

		listDocuments = function(customerID, salesDocID) {
			var deferred = $.Deferred(function (def) {
					ensureSalesDocFolder(customerID, salesDocID).done(function (salesDocFolderUrl) {
						$.ajax({
						    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('" + salesDocFolderUrl + "')/Files",
						    method: "GET",
						    headers: { "Accept": "application/json; odata=verbose"},
						    success: function (data) {
                                console.log(data);
									def.resolve(data.d.results);
						    },
						    error: function (data, errorCode, errorMessage) {
						    	var msg = 'Error when attempting to retrieve Sharepoint Files for:  ' + customerID + ' (' + data.status + ' ' +  data.statusText + ')';
						    	console.error(msg);
						    	def.reject(msg);
						    }
						});
					}).fail(function (msg) {
						def.reject(msg);
					});
				});
			
			return deferred.promise();
		},
		
		uploadDocument = function(customerID, salesDocID, fileData, filename) {
			var salesDocumentRelativeUrl = null,
				deferred = $.Deferred(function (def) {
					ensureSalesDocFolder(customerID, salesDocID).done(function (salesDocFolderUrl) {
						$.ajax({
						    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('" + salesDocFolderUrl + "')/Files/add(overwrite=true,url='" + filename + "')",
						    method: "POST",
						    processData: false,
						    headers: {  "Accept": "application/json; odata=verbose",
				    					"X-RequestDigest": _sharepointDigestToken,
				    					"Content-Type" : "application/octet-stream"
				    				},
						    data: fileData,
						    success: function (data) {
						    	salesDocumentRelativeUrl = data.d.ServerRelativeUrl;
								console.log('Document ' + filename + ' uploaded to ' + salesDocumentRelativeUrl);
								_checkInAndPublish(salesDocumentRelativeUrl, def);
						    },
						    error: function (data, errorCode, errorMessage) {
						    	var msg = 'Error when attempting to upload file to sharepoint @:  ' + salesDocFolderUrl + ' (' + data.status + ' ' +  data.statusText + ')';
						    	
						    	if (data.status == 423) { // File exists already, must be checked out first
						    		_getServerRelativeUrlForFile(salesDocFolderUrl, filename).done(function (url) {
						    			salesDocumentRelativeUrl = url;
						    			
										$.ajax({
											url: _sharepointBaseUrl + "/_api/web/getfilebyserverrelativeurl('" + salesDocumentRelativeUrl + "')/checkout",
											method: "POST",
										    processData: false,
										    headers: {  "Accept": "application/json; odata=verbose",
								    					"X-RequestDigest": _sharepointDigestToken,
								    					"Content-Type" : "application/octet-stream"
								    				},
										    data: fileData,
										    success: function (data) {
												$.ajax({
												    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('" + salesDocFolderUrl + "')/Files/add(overwrite=true,url='" + filename + "')",
												    method: "POST",
												    processData: false,
												    headers: {  "Accept": "application/json; odata=verbose",
										    					"X-RequestDigest": _sharepointDigestToken,
										    					"Content-Type" : "application/octet-stream"
										    				},
												    data: fileData,
												    success: function (data) {
												    	salesDocumentRelativeUrl = data.d.ServerRelativeUrl;
														console.log('Document ' + filename + ' uploaded to ' + salesDocumentRelativeUrl);
														_checkInAndPublish(salesDocumentRelativeUrl, def);
												    },
												    error: function (data, errorCode, errorMessage) {
												    	console.error(msg);
												    	def.reject(msg);
												    }
												});
										    },
										    error: function (data, errorCode, errorMessage) {
										    	var msg = 'Error when attempting to checkout file from sharepoint @:  ' + salesDocumentRelativeUrl + ' (' + data.status + ' ' +  data.statusText + ')';
	
										    	console.error(msg);
										    	def.reject(msg);
										    }
										});
						    		}).fail(function (msg) {
						    			def.reject(msg);
						    		});
						    	} else {
							    	console.error(msg);
							    	def.reject(msg);
						    	}
						    }
						});
					}).fail(function (msg) {
						def.reject(msg);
					});
				});
				
				return deferred.promise();
		},
		
		_getServerRelativeUrlForFile = function(salesDocFolderUrl, filename) {
			var salesDocumentRelativeUrl = null,
				deferred = $.Deferred(function (def) {
					ensureInitialized().done(function () {
						$.ajax({
						    url: _sharepointBaseUrl + "/_api/web/GetFolderByServerRelativeUrl('" + salesDocFolderUrl + "')/files('" + filename + "')",
						    method: "GET",
						    headers: { "Accept": "application/json; odata=verbose"},
						    success: function (data) {
						    	salesDocumentRelativeUrl = data.d.ServerRelativeUrl;
								def.resolve(salesDocumentRelativeUrl);
								console.log('Sharepoint file url: ' + salesDocumentRelativeUrl);
						    },
						    error: function (data, errorCode, errorMessage) {
						    	var msg = 'Error when attempting to retrieve Sharepoint URL for file ' + filename + ' from folder:  ' + salesDocFolderUrl + ' (' + data.status + ' ' +  data.statusText + ')';
						    	console.error(msg);
						    	def.reject(msg);
						    }
						});
					}).fail(function (msg) {
						def.reject(msg);
					});
				});
			
			return deferred.promise();
		},
		

				
		_checkInAndPublish = function(salesDocumentRelativeUrl, def) {
			$.ajax({
			    url: _sharepointBaseUrl + "/_api/web/getfilebyserverrelativeurl('" + salesDocumentRelativeUrl + "')/checkin(comment='Automatic check in by SalesUI.',checkintype=0)",
			    method: "POST",
			    headers: {  "Accept": "application/json; odata=verbose",
	    					"X-RequestDigest": _sharepointDigestToken,
	    				},
			    success: function (data) {
					console.log('Document ' + salesDocumentRelativeUrl + ' checked in.');
					$.ajax({
					    url: _sharepointBaseUrl + "/_api/web/getfilebyserverrelativeurl('" + salesDocumentRelativeUrl + "')/publish(comment='Automatic publish by SalesUI.')",
					    method: "POST",
					    headers: {  "Accept": "application/json; odata=verbose",
			    					"X-RequestDigest": _sharepointDigestToken,
			    				},
					    success: function (data) {
							console.log('Document ' + salesDocumentRelativeUrl + ' published.');
							def.resolve(salesDocumentRelativeUrl);
					    },
					    error: function (data, errorCode, errorMessage) {
					    	var msg = 'Error when attempting to publish file in sharepoint @:  ' + salesDocumentRelativeUrl + ' (' + data.status + ' ' +  data.statusText + ')';
					    	console.error(msg);
					    	def.reject(msg);
					    }
					});
			    },
			    error: function (data, errorCode, errorMessage) {
			    	var msg = 'Error when attempting to check in file in sharepoint @:  ' + salesDocumentRelativeUrl + ' (' + data.status + ' ' +  data.statusText + ')';
			    	console.error(msg);
			    	def.reject(msg);
			    }
			});				
		},
			
		fullyReferenceRelativeUrl = function (relativeUrl) {
			var url = (relativeUrl.length > 0) ? (relativeUrl[0] == '/' ? relativeUrl : '/' + relativeUrl) : '';
			
			return encodeURI(((window.location.hostname === "localhost") ? "proxy" : "") + url);
		},

		absoluteUrl = function (relativeUrl) {
			var url = (relativeUrl.length > 0) ? (relativeUrl[0] == '/' ? relativeUrl : '/' + relativeUrl) : '',
					prefix = '/sites/SAPDocs';
			if (url.substring(0,prefix.length) != prefix) url = prefix + url;
			return encodeURI("https://"+ ((window.location.hostname === "localhost") ? "devsap.generaldatatech.com" : window.location.hostname) + url);
		};

			
	return {
		ensureInitialized : ensureInitialized,
		ensureCustomerFolder : ensureCustomerFolder,
		ensureSalesDocFolder : ensureSalesDocFolder,
		listDocuments : listDocuments,
		uploadDocument : uploadDocument,
		fullyReferenceRelativeUrl : fullyReferenceRelativeUrl,
		absoluteUrl : absoluteUrl
	};
	
})($,sap.ui.getCore(), _, gdt.salesui.data.DataLoader);