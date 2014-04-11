;(function() {
	seajs.use('zepto/1.0.0/zepto', function($) {
		// 移除首页/注册按钮
		$('.c-nav-s a').remove();

		// 将淘宝协议修改为阿里巴巴协议
		$('.submit-btn .tips a').eq(0)
			.text('阿里巴巴协议')
			.attr('href', 'http://m.1688.com/touch/member/mServiceTerms.vm?source=ali5');
	});
})();