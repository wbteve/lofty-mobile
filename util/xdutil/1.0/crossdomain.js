/**
 * @module lofty/util/crossdomain
 * @author chuanpeng.qchp
 * @date 2013-12-30
 * @desc 跨域操作的解决方案
 * opt{
 *  	success:function(){},
 * 		domain:"1688.com"
 * }
 * @update 
 */
define('lofty/util/xdutil/1.0/crossdomain',['jquery','lofty/lang/class'],function($,Class){
	var tokenKeyName = "_cross_domain_token";
	var CrossDomain = Class({
		init:function(opt){
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
		},
		communicate:function(param,success){
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
	})
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


