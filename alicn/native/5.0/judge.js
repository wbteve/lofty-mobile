(function(win){
	var ImportJavscript = {
		url: function(url){
			document.write("<script type=\"text/javascript\" src=\""+url+"\"></scr"+"ipt>");
		}
	}

	/**
	 * 创建命名空间
	 * @param  string nsStr 可传入"a.b.c"或者"window.a.b.c"
	 */
	function ns(nsStr) {
	    if (!nsStr) {
	      return;
	    }
	    var nsArr = nsStr.split('.'), nsItem, o = window, 
	        beginIdx = (nsArr[0] === 'window') ? 1 : 0;
	    for (var i=beginIdx, leni=nsArr.length; i<leni; i++) {
	      nsItem = nsArr[i]
	      o = o[nsItem] = o[nsItem] || {};
	    }
    }

    /**
     * 将a=1&b=2之类的字符串转化为相应的对象
     * @param  string str [description]
     * @return object obj
     */
    function param(str) {
    	var ret = {};
    	if (!str) {
    		return ret;
    	}
    	var strArr = str.split(/\s*&\s*/), item, key, value;
    	for (var i=0,leni=strArr.length; i<leni; i++) {
    		item = strArr[i].split('=');
    		key = item[0];
    		value = item[1];
    		ret[key] = value;
    	}
    	return ret;
    }

	// 判断当前运行环境是否为主客v5
	function isV5() {
		return !win.WindVane_Native;
	}

	// 将v4的函数都代理到v5的函数上
	function delegateMethodsToV5() {

		// 代理获取地理位置
		delegateGetLocation();
		
		// 代理社会化分享
		delegateShare();

		// 代理摇一摇
		delegateShake();

		delegateNav();
	}

	function delegateNav(){
		ns('alibaba.call');
		win.alibaba.call=function(action,subAction, param1, param2){
			if(action == 'UINavigation'){
				switch(subAction){
					case 'goOfferDetail':
						//offer详情
						//location.href = '';
						alert('v5版本暂不支持，待完善');
						break;
					case 'goPurchaseOrder':
						alert('v5版本暂不支持，待完善');
						//立即订购
						//location.href = '';
						break;
					case 'goCompanyDetail':
						alert('v5版本暂不支持，待完善');
						//店铺首页
						//location.href = '';
						break;
					case 'sendToastTip':
						alert('v5版本暂不支持，待完善');
						//系统toast提示
						break;
					case 'getNetWorkStatus':
						alert('v5版本暂不支持，待完善');
						//获取网络状态
						break;
					case 'exitsToApp':
						alert('v5版本暂不支持，待完善');
						//退出插件
						break;
					case 'openBrowser':
						alert('v5版本暂不支持，待完善');
						//打开系统默认浏览器
						break;
					case 'goShortOfferDetail':
						alert('v5版本暂不支持，待完善');
						//进入快速发布简易offer详情
						break;
				}
			}else if(action == 'LoginUIOperator'){
				if (subAction == 'toLoginUI') {
					location.href = 'http://login.m.1688.com/index.html';
				};
			}
		}
	}

	function delegateGetLocation() {
		ns('alibaba.WVLocation');
		win.alibaba.WVLocation.getLocation = function() {
			alert('v5版本暂不支持，待完善');
			return 'location';
		}
	}

	function delegateShare() {
		ns('alibaba.WVShare');
		win.alibaba.WVShare.share = function(content) {
			var con = param(content);
			Wing.navigator.share('', con['content'], con['imageUrl'], '');
		}
	}

	function delegateShake() {
		ns('alibaba.WVMotion');
		win.alibaba.WVMotion.listeningShake = function(isVibrator, success, fail) {
			var type = 0;
			if (!isVibrator) {
				type = 2;
			}
			Wing.navigator.shake.open({
				type: type
			}, function(result) {
				if (result.success) {
					success();
				} else {
					fail();
				}
			})
		}
	}
	
	if (!isV5()) {
		ImportJavscript.url('http://m.1688.com/style/js/app/alibaba_jsbridge_v3.2.0.js');
	} else {
		//ImportJavscript.url('../wing.android.js');

		delegateMethodsToV5();
	}
})(window);

