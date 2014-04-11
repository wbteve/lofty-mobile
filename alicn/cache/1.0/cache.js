define('lofty/util/xdutil/1.0/crossdomain',['jquery'],function($){
	var tokenKeyName = "_cross_domain_token";
	var CrossDomain = function(opt){
		this.iframeReady = false;
		this.msgList = [];
		this.token = 1;
		this.callbackList = {};
		var iframe = this.iframe = document.createElement('iframe');
		var style = iframe.style;
		style.display = "none";
		this.proxyPageUrl = iframe.src = opt.proxyPageUrl;
		this.origin = opt.origin;
		bindOnLoadEvt.call(this);
		bindMsgEvt.call(this);
		document.body.appendChild(iframe);
	}
	CrossDomain.prototype.communicate = function(param,success){
		param[tokenKeyName] = this.token;
		if(success && typeof success === 'function'){
			this.callbackList[this.token] = success;
		}
		this.token++;
		var paramStr = JSON.stringify(param);
		if(!this.iframeReady){
			this.msgList.push(paramStr);
		} else {
			sendMsg.call(this,paramStr);
		}
	}
	function bindOnLoadEvt(){
		var self = this;
		$(this.iframe).on('load',function(){
			self.iframeReady = true;
			for(var msg in self.msgList){
				sendMsg.call(self,self.msgList[msg]);
			}
		})
	}
	function sendMsg(msg){
		this.iframe.contentWindow.postMessage(msg,"*");
	}
	function bindMsgEvt(){
		var self = this;
		$(window).on('message',function(o){
			if(o.origin !== self.origin){
				return;
			}
			var data = JSON.parse(o.data);
			if(data.proxyPageUrl !== self.proxyPageUrl){
				return;
			}
			var token = data[tokenKeyName];
			self.callbackList[token] && self.callbackList[token](data.data);
			delete self.callbackList[token];
		})
	}
	return CrossDomain;
})
define('lofty/util/xdutil/1.0/xdutil',['lofty/util/xdutil/1.0/crossdomain'],function(CrossDomain){
	var proxyCache = {};
	var xdutil = {
		handle:function(opt){
			var page = opt.page;
			if(!proxyCache[page]){
				proxyCache[page] = new CrossDomain({
					proxyPageUrl:page,
					origin:opt.origin
				});
			}
			proxyCache[page].communicate(opt.param,opt.success);
		}
	}
	return xdutil;
})
define('lofty/util/storage/1.0/storage',['lofty/util/xdutil/1.0/xdutil'],function(xdutil){
	var oldLocalStorage = window.localStorage,
		proxyPage = '/proxy/localstorage.html';
	var newLocalStorage = {
		getItem:function(key,opt){
			if(opt === undefined){
				return oldLocalStorage.getItem(key);
			} else if(opt.domain === window.document.domain){
				if(opt.success && typeof opt.success ==='function'){
					opt.success(oldLocalStorage.getItem(key));
					return oldLocalStorage.getItem(key);
				}
			} else {
				xdutil.handle({
					page:'http://' + opt.domain + proxyPage,
					origin:'http://' + opt.domain,
					param:{
						'_type':'read',
						'_key':key
					},
					success:opt.success
				});
			}
		},
		setItem:function(key,val,opt){
			if(opt === undefined || opt.domain === window.document.domain){
				oldLocalStorage.setItem(key,val);
			} else{
				xdutil.handle({
					page:'http://' + opt.domain + proxyPage,
					origin:'http://' + opt.domain,
					param:{
						'_type':'write',
						'_key':key,
						'_value':val
					},
					success:opt.success
				});
			}
		},
		clear:function(opt){
			if(opt === undefined || opt.domain === window.document.domain){
				oldLocalStorage.clear();
			} else{
				xdutil.handle({
					page:'http://' + opt.domain + proxyPage,
					origin:'http://' + opt.domain,
					param:{
						'_type':'clear'
					},
					success:opt.success
				});
			}
		},
		key:function(idx,opt){
			if(opt === undefined || opt.domain === window.document.domain){
				return oldLocalStorage.key(idx);
			} else{
				xdutil.handle({
					page:'http://' + opt.domain + proxyPage,
					origin:'http://' + opt.domain,
					param:{
						'_type':'key',
						'_index':idx
					},
					success:opt.success
				});
			}
		},
		length:function(opt){
			if(opt === undefined || opt.domain === window.document.domain){
				return oldLocalStorage.length;
			} else{
				xdutil.handle({
					page:'http://' + opt.domain + proxyPage,
					origin:'http://' + opt.domain,
					param:{
						'_type':'length'
					},
					success:opt.success
				});
			}
		},
		removeItem:function(key,opt){
			if(opt === undefined || opt.domain === window.document.domain){
				return oldLocalStorage.removeItem(key);
			} else{
				xdutil.handle({
					page:'http://' + opt.domain + proxyPage,
					origin:'http://' + opt.domain,
					param:{
						'_type':'remove',
						'_key':key
					},
					success:opt.success
				});
			}
		}
	}
	return newLocalStorage;
})
/**
 * appdescription:{}
 */
define(['jquery','lofty/util/storage/1.0/storage','lofty/util/xdutil/1.0/xdutil'],function ($,storage,xdutil) {
	'use strict';
	fmd( 'lofty-mobile-request-adapter',['request','config','lang','when'],
		function(loftyRequest,config,lang,when){
		var rAbsUrl = /^https?:\/\/([\w\.-]+)(\:\w+)*(\/m\/([\w\.-]*)[\/\w\.-]*)/i,
		    rRtvUrl = /[\w\.-]*/i,
			appDesc = config.get('appdescription'),
			allApps = [appDesc.name],
			waitedRes = [],
			mainDomain = '1688.com',
			mainApp = 'lofty',
			lastUpVerKey = 'lastUpVer_',
			localStorageKeyPre = '_static_resource_',
			selfDomain = window.document.domain,
			latestVerParam = '_later_ver_',
			isFirstUse = false,
			resDomain = 'astyle.alicdn.com',
			
			proxyPage = '/m/lofty/alicn/cache/1.0/cache.html?v=1.0',
			allStaticRes = '_static_res_all_',
			waited = true;
			
		var fetchResource = function(id,options,v){
			xdutil.handle({
				page:'http://' + resDomain + proxyPage,
				origin:'http://' + resDomain,
				param:{
					'_url':'http://' + resDomain + id + "?v=" + v
				},
				success:function(content){
					var funcs = [];
					var result = {
						expired:false,
						content:content
					}
					funcs.push(function(promise){
						storage.setItem(localStorageKeyPre + id,JSON.stringify(result),{
							domain:options.domain || selfDomain,
							success:function(){
								promise.resolve();
							}
						})
					})
					funcs.push(function(promise){
						storage.getItem(allStaticRes,{
							domain:options.domain || selfDomain,
							success:function(arr){
								var allResArr;
								if(!arr){
									allResArr = [localStorageKeyPre + id];
								} else {
									allResArr = JSON.parse(arr);
									if(lang.inArray(allResArr,localStorageKeyPre + id) === -1){
										allResArr.push(localStorageKeyPre + id);
									}
								}
								storage.setItem(allStaticRes,JSON.stringify(allResArr),{
									domain:options.domain || selfDomain,
									success:function(){
										promise.resolve();
									}
								})
							}
						})
					})
					when.apply(null,funcs).then(function(){
						options.success(result)
					})
					
				}
				
			});
		}
		var cacheAndGetRes = function(app,id,options){
			var dm = selfDomain;
			if(app === mainApp){
				dm = mainDomain;
			} 
			storage.getItem(lastUpVerKey + app,{
				domain:dm,
				success:function(v){
					fetchResource(id,options,v)
				}
			})
		}
		var getResource = function(resObj,callback){
			if(!(/\.js$/.test(resObj.id)) && !(/\.css$/.test(resObj.id))){
				resObj.id = resObj.id + '.js';
			}
			var dm = selfDomain;
			if(resObj.app === mainApp){
				dm = mainDomain;
			} 
			storage.getItem(localStorageKeyPre + resObj.id,{
				domain:dm,
				success:function(resource){
					resource = JSON.parse(resource);
					if(!resource || resource.expired){
						cacheAndGetRes(resObj.app,resObj.id,{
							domain:mainDomain,
							success:function(r){
								eval(r.content);
								callback();
							}
						})
					} else {
						eval(resource.content);
						callback();
					}
					
				}
			})
			
		}
		var clearAll = function(domain,cb){
			storage.getItem(allStaticRes,{
				domain:domain,
				success:function(arr){
					var allResArr;
					if(arr){
						allResArr = JSON.parse(arr);
						var funcs = [];
						lang.forEach(allResArr,function(item){
							funcs.push(function(promise){
								storage.removeItem(item,{
									domain:domain,
									success:function(){
										promise.resolve();
									}
								})
							})
						})
						funcs.push(function(promise){
							storage.removeItem(allStaticRes,{
								domain:domain,
								success:function(){
									promise.resolve();
								}
							})
						})
						when.apply(null,funcs).then(cb);
					} else {
						cb();
					}
				}
			})
		}
		if(appDesc.deps && lang.isArray(appDesc.deps)) allApps = allApps.concat(appDesc.deps);
		var processExpire = function(appItem,v,cb){
			$.ajax({
				url:"http://mobilecenter.1688.com/GetDiffFileDes?appname="+appItem+"&currentversion="+v,
				dataType:"jsonp",
				success:function(result){
					if(!result.success){
						cb();
						return;
					}
					var o = result.data.content;
					var lastVer = o['version'],
					    resDel,
						resModify,
						resArr,
						dm;
					if(appItem === mainApp){
						dm = mainDomain;
					} else{
						dm = selfDomain;
					}
					var funcs = [];
					funcs.push(function(promise){
						storage.setItem(lastUpVerKey + appItem,lastVer,{
							domain:dm,
							success:function(){
								promise.resolve();
							}
						})
					})
					if(!o['filelist']){
						funcs.push(function(promise){
							clearAll(dm,function(){
								promise.resolve();
							})
						});
					} else {
						resDel = o['filelist']['delete'];
						lang.forEach(resDel,function(item){
							funcs.push(function(promise){
								storage.getItem(localStorageKeyPre + item,{
									domain:mainDomain,
									success:function(r){
										if(!r){
											promise.resolve();
										} else{
											storage.removeItem(localStorageKeyPre + item,{
												domain:mainDomain,
												success:function(){
													promise.resolve();
												}
											})
										}
									}
								})
							})
						})
						resModify = o['filelist']['modify'];
						lang.forEach(resModify,function(item){
							funcs.push(function(promise){
								storage.getItem(localStorageKeyPre + item,{
									domain:mainDomain,
									success:function(r){
										if(!r){
											promise.resolve();
										} else{
											storage.setItem(localStorageKeyPre + item,JSON.stringify({expired:true}),{
												domain:mainDomain,
												success:function(){
													promise.resolve();
												}
											})
										}
									}
								})
							})
						})
					}
					when.apply(null,funcs).then(cb)
				}
			})
		}
		var chargeExpired = function(appArr,cb){
			when.apply( null, lang.map( appArr, function( appItem ){
				return function( promise ){
					var dm = selfDomain;
					if(appItem === mainApp){
						dm = mainDomain;
					} 
					
					storage.getItem(lastUpVerKey + appItem,{
						domain:dm,
						success:function(v){
							processExpire(appItem,v,function(){
								promise.resolve();
							})
						}
					})
					
				};
			} ) ).then( cb );
		}
		$(function(){
			chargeExpired(allApps,function(){
				waited = false;
				var waitedResItem;
				while(waitedResItem = waitedRes.shift()){
					getResource({
						id:waitedResItem.id,
						app:waitedResItem.app
					},waitedResItem.callBack);
				}
			});
		})
		var cachable = function(appName){
			if(lang.inArray(allApps,appName) !== -1){
				return true;
			}
			return false;
		};
		var request = function( asset, callback ){
			var aMatch = asset.id.match(rAbsUrl),
			    app,
				id;
			if(aMatch){
				if( $.trim(aMatch[1]) === 'astyle.alicdn.com' || $.trim(aMatch[1]) === 'style.c.aliimg.com' || $.trim(aMatch[1]) === 'static.c.aliimg.com'){
					app = aMatch[4];
					id = aMatch[3];
				}
			}else{
				app = asset.id.match(rRtvUrl)[0];
				id = '/m/' + asset.id;
			}
			
			if(app &&  id && cachable(app)){
				if(waited){
					waitedRes.push({
						id:id,
						app:app,
						callBack:callback
					})
				} else {
					getResource({
						id:id,
						app:app
					},callback);
				}
				
			} else {
				loftyRequest(asset, callback);
			}
		};
		return request;
	} );

	fmd( 'lofty-mobile-loader-adapter', ['global','event','config','lofty-mobile-request-adapter'],
		function( global, event, config, request ){
		var STATE_LOADING = 'loading',
			STATE_LOADED = 'loaded',
			EVENT_REQUEST_COMPLETE = 'requestComplete';
			
		var noop = function(){};
		
		
		config.set({
			timeout: 10000
		});
		
		
		event.on( EVENT_REQUEST_COMPLETE, function( asset ){
			
			var call, queue;
			asset.state = STATE_LOADED;
			queue = asset.onload;

			while ( call = queue.shift() ){
				call();
			}
		} );
		
		
		var loader = function( asset, callback ){
			
			callback || ( callback = noop );
			
			if ( asset.state === STATE_LOADED ){
				callback();
				return;
			}
			
			if ( asset.state === STATE_LOADING ){
				asset.onload.push( callback );
				return;
			}
			
			asset.state = STATE_LOADING;
			asset.onload = [callback];
			
			event.emit( 'request', asset, callback );
			
			if ( asset.requested ){
				return;
			}
			
			asset.timer = global.setTimeout( function(){
				event.emit( 'requestTimeout', asset );
			}, config.get('timeout') );
			
			request( asset, function(){
				global.clearTimeout( asset.timer );
				event.emit( EVENT_REQUEST_COMPLETE, asset );
			} );
		};
		
		
		return loader;
		
	} );
    fmd( 'lofty-mobile-cache-adapter', ['config','remote','lang','module','when','lofty-mobile-loader-adapter'],
	function( config, remote,lang,Module,when,loader){
		if(!config.get('async')){
			return;
		}
		
		remote.bring = function( group, callback ){
			when.apply( null, lang.map( group, function( asset ){
				return function( promise ){
					Module.has( asset.id ) ?
						promise.resolve() : loader( asset, function(){
							promise.resolve();
						} );
				};
			} ) ).then( callback );
		};
	} );
});


