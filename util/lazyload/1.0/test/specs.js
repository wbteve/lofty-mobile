
define(['jquery','util/datalazyload/1.0'], function( $,Datalazyload){
	describe( 'Datalazyload', function(){
		beforeEach(function(){
			$('body').append('<div id="dataLazyArea"></div>');
		})
		afterEach(function(){
			$("#dataLazyArea").remove();
		});
		it('Õº∆¨¿¡º”‘ÿ',function(){
			var flag;
			var html = '\
				<img class="offerImg" data-lazyload-src="http://i04.c.aliimg.com/img/ibank/2011/560/637/457736065_1714284298.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i03.c.aliimg.com/img/ibank/2012/446/243/565342644_1906858889.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i04.c.aliimg.com/img/ibank/2013/283/108/911801382_1481338258.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i03.c.aliimg.com/img/ibank/2013/260/755/962557062_104937165.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i03.c.aliimg.com/img/ibank/2012/016/106/669601610_2019159583.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i05.c.aliimg.com/img/ibank/2012/357/866/709668753_1047023616.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i02.c.aliimg.com/img/ibank/2012/291/718/730817192_722888204.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i02.c.aliimg.com/img/ibank/2011/824/757/462757428_1399142984.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i05.c.aliimg.com/img/ibank/2011/772/148/465841277_789219996.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i04.c.aliimg.com/img/ibank/2011/560/637/457736065_1714284298.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://i05.c.aliimg.com/img/ibank/2013/304/387/831783403_1915530726.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://img.china.alibaba.com/img/ibank/2012/149/146/639641941_1913313061.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://img.china.alibaba.com/img/ibank/2013/166/793/963397661_536505440.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://img.china.alibaba.com/img/ibank/2013/849/327/758723948_1941349982.220x220.jpg"></img>\
				<img class="offerImg" data-lazyload-src="http://img.china.alibaba.com/img/ibank/2013/196/437/796734691_1120733939.220x220.jpg"></img>\
			';
			$('#dataLazyArea').html(html);
			var lazy = new Datalazyload({
				container:"#dataLazyArea"
			});
			var len1 = $('#dataLazyArea img[src]').length;
			$('#dataLazyArea').css('top','-500px');
			$(window).trigger('scroll');
			setTimeout(function(){
				var len2 = $('#dataLazyArea img[src]').length;
				expect(len2).toBeGreaterThan(len1);
				flag = true;
			},130)
			
			waitsFor(function(){
				return flag;
			},'error',150)
			
		});
	});
});