/**
 * @module lofty/lang/base
 * @author terence.wangt
 * @update remove Class.extend by Edgar
 * @date 140210
 * */

define( 'lofty/lang/base', ['lofty/lang/class', 
							'lofty/lang/attribute',
							'lofty/lang/observer',
							'lofty/lang/pluginhost'],
	function(Class, Attribute, observer, PluginHost){
	'use strict';
	
    /* helper */
    var mixin = function( target, src ){
        
        var val, name;
        
        src = src.prototype || src;
        
        for ( name in src ){
            val = src[name];
            if ( val !== undefined ){
                target[name] = val;
            }
        }
    };
    
    
    var Base = Class({
		init: function( config ){
			
			this.initOptions( config );
			
			if( config && config.plugins ){
				this.install( config.plugins );
			}
		},
		
		destroy: function(){
				
			this.uninstall();
			
			this.off();
			
			for ( var key in this ){
				if ( this.hasOwnProperty( key ) ){
					delete this[key];
				}
			}
		}
    });
    
    /* 混入attr原型方法 */
    mixin( Base.prototype, Attribute );
    /* 混入pluginHost原型方法 */
    mixin( Base.prototype, PluginHost );
	/* 混入observer原型方法，增加观察者/自定义事件的支持 */
	observer.mixTo( Base.prototype );
	
	return Base;
	
} );
