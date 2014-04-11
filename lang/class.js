/**
 * @module lofty/lang/class
 * @from just/lang/class butterfly.lang.class
 * @author Edgar
 * @date 140210
 * */

define( 'lofty/lang/class', function(){
    'use strict';
    
    /**
     * Thanks to:
     * http://ejohn.org/blog/simple-class-instantiation/
     * */
    
    var toString = {}.toString,
        isFunction = function( it ){
            return toString.call( it ) === '[object Function]';
        },
        mixin = function( target, src ){
            var val, name;
            
            for ( name in src ){
                val = src[name];
                if ( val !== undefined ){
                    target[name] = val;
                }
            }
            
            return target;
        };
    
    
    function Proxy(){}
    
    
    var makeClass = function( parent, o ){
        
        if ( !o ){
            o = parent;
            parent = null;
        }
        
        var Klass = function(){
            
            var init = this.initialize || this.init;
            isFunction( init ) && init.apply( this, arguments );
        };
        
        var proto = {};
        
        if ( parent ){
            Proxy.prototype = Klass.superclass = isFunction( parent ) ? parent.prototype : parent;
            proto = new Proxy();
        }
        
        Klass.prototype = mixin( proto, o );
        Klass.prototype.constructor = Klass;
        
        return Klass;
        
    };
    
    return makeClass;
    
} );
