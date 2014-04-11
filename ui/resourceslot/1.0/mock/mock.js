if (!window.Wing || !window.Wing.navigator || !window.Wing.navigator.adv) {
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

    ns('Wing.navigator.adv');

    Wing.navigator.adv.getAdvContent = function(advParams, cb) {
        switch (+advParams.scene.place) {
            case 1: 
                af.ajax({
                    dataType: 'json',
                    url: '../mock/swipe.json',
                    success: function(data) {
                        cb(data);
                    }
                });
                break;
            case 2:
                af.ajax({
                    dataType: 'json',
                    url: Math.random() > 0.5 ? '../mock/text.json' : '../mock/text_close.json',
                    success: function(data) {
                        cb(data);
                    }
                });
                break;
            case 3: 
                af.ajax({
                    dataType: 'json',
                    url: Math.random() > 0.5 ? '../mock/pic.json' : '../mock/pic_close.json',
                    success: function(data) {
                        cb(data);
                    }
                });
        }
    }; 
}
