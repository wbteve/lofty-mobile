/*created by hongss on 2014.01.10 for 自适应宽度 */
;(function(){
	var width = 720,
		baseWidth = 360,
		winWidth = document.documentElement.clientWidth;
	if (winWidth < width){
		width = winWidth;
	}
	if (width !== baseWidth) {
		var headEl = document.getElementsByTagName('head')[0],
		styleEl = document.createElement('style');
		styleEl.innerHTML = 'html{font-size:'+(width/baseWidth)*100+'%;}';
		headEl.appendChild(styleEl);
	}
})();
