/*
 * author shiwei.dengsw
 * date 2013-09-24
 * dependence: jQuery
 * 取服务器时间相关，旨在统一维护管理类似的逻辑
 * modify by shanshan.hongss for mobile on 2014.01.15
 */

define('lofty/alicn/now/1.0/now', ['jquery'], function ($) {
    'use strict';

    var API = 'http://wholesale.1688.com/json/get_server_time.jsx';

    var Now = {
        /**
         * 【异步方法】获取服务器当前时间
         * @param {Function} callback(serverTimeMillis) 成功获取时间后的供回调的函数，函数仅接受一个参
         * 数 serverTimeMillis ，它是Number型，是服务器当前时间的毫秒表示形式，如果获取时间失败，则
         * serverTimeMillis 为 null 。
         */
        now: function (callback) {
            $.ajax({
                url: API,
                dataType: 'jsonp',
                success: function(result){
                    var data;
                    var time = null;
                    if ( typeof result === 'object' && result && result.success === 'true' ) {
                        data = result.data;
                        time = +data.serverTimeMillis;
                    }
                    
                    callback(time);
                },
                error: function(){
                    callback(null);
                }
            });
        },
        // 暴露一个只读的api真实地址给用户，以备特殊情况个性化使用
        getAPI: function () {
            return API;
        }
    };

    return Now;
});


