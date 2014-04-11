/**
 * @module lofty/util/cookie
 * @author shengliang.yangshl
 * @date 2013-08-27
 * @desc cookie操作工具类
 * @update 
 * https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
 */
 
define('lofty/util/cookie/1.0/cookie',function(){
    var cookie = {
                    options:{
                        "path":'',//cookie路径
                        "domain":'',//cookie 有效域
                        "expires":7, //cookie默认有效期7天
                        "secure":false, //是否采用HTTPS传送cookie
                        "raw":false //是否对传入的值进行编码
                    },
                    /**
                     * 设置cookie
                     * @param key String  cookie名
                     * @param value String cookie值
                     * @param options 标准JSON对象 cookie选项，
                     * @return Object this
                     */
                    set:function (key, value, options) {
                            if(arguments.length < 3 || (arguments.length == 3 && typeof options === 'undefined')){
                                options = {};
                            }

                            var expires = options.expires != undefined ? options.expires : (this.options.expires || ''),
                                expiresType = typeof(expires);

                            if (expiresType === 'string' && expires !== ''){
                                expires = new Date(expires);
                            }else if (expiresType === 'number'){
                                expires = new Date((+new Date) + 1000 * 60*60*24 * expires);
                            }

                            if (expires !== '' && 'toUTCString' in expires){
                                expires = '; expires=' + expires.toUTCString();
                            }

                            var path = options.path || this.options.path;
                            path = path ? '; path=' + path : '';
                                                
                            var domain = options.domain || this.options.domain;                            
                            domain = domain ? '; domain=' + domain : '';
                            
                            var secure = (typeof options.secure == 'undefined') ? (this.options.secure  ? '; secure' : '') : ( options.secure   ? '; secure' : '');

                            var raw = (typeof options.raw != 'undefined' ) ? options.raw : this.options.raw ;
                            
                            var code = raw ? function(s){
                                return s;
                            } : escape;
                           
                            if( raw === true ){
                                document.cookie = key + '=' + value +  expires + path + domain + secure;
                            }else{
                                document.cookie = code(key) + '=' + code(value) + expires + path + domain + secure;
                            }

                            return this;
                       },
                        /**
                         * 获取cookie,不存在返回null
                         * 
                         * @param keys String|Array  cookie名
                         * @param options 参数选项
                         * @update 2013-10-18 修复无法获取escape编码的cookie，添加try catch容错
                         */
                       get:function(keys,options){
                            options = options || {};
                            var cookies = getAllCookies();
                            var decode = options.raw ? function(s){
                                return s;
                            }:unescape;   
                           
                            if (isArray(keys)) {
                                var result = {};
                                for (var i = 0, l = keys.length; i < l; i++) {
                                    var key = decode(keys[i]);
                                    var value = cookies[key] ;
                                    if(typeof value !='undefined'){                                        
                                        value =  decode(value);
                                    }
                                    result[key] = value ? value : null ;
                                }
                                return result;
                                
                            }else{
                                keys = decode(keys);
                                var value = cookies[keys] ;
                                if(typeof value !='undefined'){                                   
                                    value =  decode(value);
                                }        
                                value = value ? value : null ;
                                return value ;
                            }
                         },
                        /**
                         * 删除cookie
                         * @param keys String|Array  cookie名
                         **/
                        remove :function(keys){
                                if( isArray(keys)){
                                    for (var i = 0, len = keys.length; i < len; i++) {
                                        this.set(keys[i], '', {"expires":-1});
                                    }
                                }else if(typeof(keys) == 'string'){
                                    this.set(keys, '', {"expires":-1});
                                }
                                return this;
                        }
                    };


                    //不对外公开的方法
                    /**
                    *获取所有cookie
                    */
                    function getAllCookies(){
                        if (document.cookie === '')
                            return {};
                        var cookies = document.cookie.split('; '),
                            result = {};
                        for (var i = 0, len = cookies.length; i < len; i++) {
                            var item = cookies[i].split('=');
                            result[item[0]] = item[1];
                        }
                        return result;
                    }
                   
                    /**
                     * @desc 判断给定参数是否为数组
                     * @param value
                     */
                    function isArray(value) {
                         return  Array.isArray ?  Array.isArray(value) : Object.prototype.toString.call(value) === '[object Array]';
                    }
		
		            return cookie;


})
