if (!window.Wing || !window.Wing.navigator || !window.Wing.navigator.wangwang) {
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

    ns('Wing.navigator.wangwang');

    Wing.navigator.wangwang.isUserLogin = function(options, cb) {
        var id = options.id,
            siteID = options.siteID;

        switch (id) {
            case 'online-user': 
                af.ajax({
                    dataType: 'json',
                    url: '../mock/online.json',
                    success: function(data) {
                        setTimeout(function() {
                            cb(data);
                        }, 1000);
                    }
                });
                break;
            case 'offline-user':
                af.ajax({
                    dataType: 'json',
                    url: '../mock/offline.json',
                    success: function(data) {
                        setTimeout(function() {
                            cb(data);
                        }, 1000);
                    }
                });
                break;
        }
    }; 
}
