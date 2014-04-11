(function( env ) {
    'use strict';

    // lofty configs
    var configs = {
        resolve: function( id ){
            
            var parts = id.split('/'),
                root = parts[0];
            
            switch ( root ){
                case 'lofty':
                    id = 'm/' + id;
                    break;
                case 'gallery':
                    id = 'm/lofty/' + id;
                    break;
            }
            
            return id;
        },

        alias: {
			"lofty/observer": "lofty/lang/observer",
			"lofty/base": "lofty/lang/base",
			"lofty/class": "lofty/lang/class",
			"lofty/log": "lofty/lang/log",
			"lofty/aop": "lofty/lang/aop",

			/**
				//////////////////////// Mobile alias ////////////////////////////////
			**/
			
			"fui/widget/1.0": "lofty/ui/widget/1.0/widget",
			"fui/popup/1.0": "lofty/ui/popup/1.0/popup",
			"fui/actionsheet/1.0": "lofty/ui/actionsheet/1.0/actionsheet",
			"fui/swipe/1.0": "lofty/ui/swipe/1.0/swipe",
			"fui/suggestion/1.0": "lofty/ui/suggestion/1.0/suggestion",
			"fui/autocomplete/1.0": "lofty/ui/autocomplete/1.0/autocomplete",
			"fui/autocomplete/filter/1.0": "lofty/ui/autocomplete/1.0/filter",
			"fui/scroller/1.0": "lofty/ui/scroller/1.0/scroller",
			"fui/timer/1.0/timer": "lofty/ui/timer/1.0/timer",
			"fui/crazyimg/1.0/crazyimg": "lofty/ui/crazyimg/1.0/crazyimg",
			
			"alicn/now/1.0": "lofty/alicn/now/1.0/now",
			"alicn/alitalk/1.0": "lofty/alicn/alitalk/1.0/alitalk",

			"util/cookie/1.0":"lofty/util/cookie/1.0/cookie",
			"util/storage/1.0":"lofty/util/storage/1.0/storage",
			"util/history/1.0":"lofty/util/history/1.0/history",
			"util/template/1.0":"lofty/util/template/1.0/template",
			"util/tplhandler/1.0":"lofty/util/template/1.0/tplhandler",
			"util/router/1.0":"lofty/util/router/1.0/router",
			"util/lazyload/1.0":"lofty/util/lazyload/1.0/lazyload"
		}
    };

    if( typeof env.lofty !== 'undefined' ) {
        // for lofty
        env.lofty.config(configs);
    }

    if( typeof exports !== 'undefined' && env === exports ) {
        // for node.js
        exports.configs = configs;
    }

})(this);
