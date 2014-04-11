/**
 * @module lofty/util/xdutil
 * @author chuanpeng.qchp
 * @date 2013-12-30
 * @desc 跨域操作的解决方案
 * opt{
 *  	success:function(){},
 * 		domain:"1688.com"
 * }
 * @update 
 */
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


