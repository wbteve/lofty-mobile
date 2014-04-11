/**
 * @module lofty/ui/resourceslot
 * @author lihao.ylh
 * @date 2014-03-13
 * @desc 资源位组件
 */

define('lofty/ui/resourceslot/1.0/resourceslot', ['util/template/1.0', 'fui/crazyimg/1.0/crazyimg', 'fui/swipe/1.0', 'jquery'],
    function(Template, Crazyimg, Swipe, $){
    
    var resSlot;

    resSlot = {
        /**
         * opts: {
         *     container: "", // DOM选择器
         *     scene: {
         *         place:"场景key",// 必填
         *         keyword:"搜索关键字"      // 目前写错为keywork
         *     },
         *     sys: {
         *         modifyTime:"", // 最后修改时间，long型
         *         city:"",
         *         appVer:"",           // 目前写错为appver
         *         osVer:"",
         *         userId:"",
         *         ttid:"",
         *         imei:"",
         *         imsi:""
         *     }
         * }
         */
        create: function(opts) {

            // 没有指定资源位位置，直接返回
            if (!opts.container || !$(opts.container).length) {
                return;
            }
            var advParam = this._constructAdvParam(opts);
            Wing.navigator.adv.getAdvContent(advParam, function(data) {
                var advContent = data && data.data && data.data.advcontent;
                switch (+advContent.viewType) {
                    case 1:
                        handleSwipe(opts.container, advContent);
                        break;
                    case 2:
                        handText(opts.container, advContent);
                        break;
                    case 3: 
                        handlePic(opts.container, advContent);
                        break;
                }
            });   
        },
        // 构造传入参数
        _constructAdvParam: function(opts) {
            var advParam = {
                scene: {},
                sys: {}
            }
            $.extend(advParam.scene, opts.scene);
            $.extend(advParam.sys, opts.sys);
            // 映射两个后台接口名称错误
            advParam.scene.keywork = advParam.scene.keyword;
            advParam.sys.appver = advParam.sys.appVer;

            return advParam;
        }
    }

    // 处理轮播型资源位
    function handleSwipe(container, data) {
        $(container).append(Template.compile(SWIPE_STYLE)({height: $(container).width() / 2}) + Template.compile(SWIPE_TPL)(data));
        // new Crazyimg({
        //     container: container,
        //     atAttr: 'swipe-lazy-src',
        //     dpr: {
        //         '1': '320x160'
        //     }
        // })
        var swipe  = new Swipe({
            tpl : "#resslot_swipe",
            auto: 0,
            callback:function(idx, elm){
                console.log(idx);
            }
        });
    }

    // 处理单图片型资源位
    function handlePic(container, data) {
        $(container).append(Template.compile(PIC_STYLE)({height: 5 / 24 * $(container).width()}) + Template.compile(PIC_TPL)(data));
        if (data.close) {
            $(container).on($.os.supportsTouch ? 'tap' : 'click', '#resslot_pic .close', function() {
                $(this).closest('#resslot_pic').remove();
            });
        }
    }

    // 处理文字性资源位
    function handText(container, data) {
        $(container).append(Template.compile(TEXT_STYLE)({close: data.close}) + Template.compile(TEXT_TPL)(data));
        if (data.close) {
            $(container).on($.os.supportsTouch ? 'tap' : 'click', '#resslot_text .close', function() {
                $(this).closest('#resslot_text').remove();
            });
        }
    }

    // 静态模板放置区域
    var TEXT_STYLE = '<style>' +
        '#resslot_text {' +
          'position: relative;' +
          'display: block;' +
          'height: 70px;' +
          'margin: 15px;' +
          'background-color: #fff;' +
          'border: 1px solid #e5e5e5;' + 
        '}' +
        '#resslot_text a {' +
          'display: block;' + 
          'width: 100%;' +
          'height: 100%;' +
        '}' +
        '#resslot_text p {' +
          'height: 55px;' +
          'line-height: 20px;' +
          'padding: 15px 0 0 10px;' +
          '<% if ($data.close === true) { %>' +
          'padding-right: 44px;' +
          '<% } else { %> ' +
          'padding-right: 10px;' +
          '<% } %>' + 
          'margin-bottom: 15px;' +
          'overflow: hidden;' +
          'letter-spacing: 1px;' +
          'color: grey;' + 
        '}' +
        '#resslot_text .close {' +
          'position: absolute;' +
          'top: 10px;' +
          'right: 10px;' +
          'width: 28px;' +
          'height: 28px;' +
          'display: inline-block;' +
          'background: url(http://style.c.aliimg.com/m/lofty/assets/images/icon_public_close.png) no-repeat 0 0;' +
          'background-size: cover; ' +
        '}' +
        '</style>';
    var TEXT_TPL = '<div id="resslot_text">' +
          '<a href="<%= $data.actionUrl %>"><p><%= $data.content %></p></a>' +
          '<% if ($data.close === true) { %>' +
          '<span class="close"></span>' +
          '<% } %>' +
        '</div>';

    var PIC_STYLE = '<style>' +
        '#resslot_pic {' +
          'position: relative;' +
          'display: block;' +
          'width: 100%;' +
          'height: <%=height%>px;' +
        '}' +
        '#resslot_pic img {' +
          'width: 100%;' +
          'height: <%=height%>px;' +
        '}' +
        '#resslot_pic .close {' +
          'position: absolute;' +
          'top: 10px;' +
          'right: 10px;' +
          'width: 28px;' +
          'height: 28px;' +
          'display: inline-block;' +
          'background: url(http://style.c.aliimg.com/m/lofty/assets/images/public_icon_close_shadow.png) no-repeat 0 0;' +
          'background-size: cover; ' +
        '}' +
        '</style>';
    var PIC_TPL = '<a id="resslot_pic" href="<%= $data.actionUrl %>">' +
            '<img src="<%= $data.content %>"></img>' +
            '<% if ($data.close === true) { %>' +
            '<span class="close"></span>' +
            '<% } %>' +
        '</a>';

    var SWIPE_STYLE = '<style>' + 
        '#resslot_swipe {' +
            'overflow: hidden;' +
            'visibility: hidden;' +
            'position: relative;' +
            'width: 100%;' +
            'height: <%=height%>px;' +
        '}' +
        '#resslot_swipe .swipe-content {' +
            'overflow: hidden;' +
            'position: relative;' +
        '}' +
        '#resslot_swipe .swipe-content > .swipe-pane {' +
            'float: left;' +
            'width: 100%;' +
            'height: <%=height%>px;' +
            'position: relative;' +
        '}' +
        '#resslot_swipe .swipe-nav {' +
            'position: absolute;' +
            'bottom: 14px;' +
            'left: 14px;' +
            'zoom: 1;' +
            'z-index: 10;' +
        '}' +
        '#resslot_swipe .swipe-nav:after {' +
            'content: "\\0020";' +
            'display: block;' +
            'height: 0;' +
            'clear: both;' +
        '}' +
        '#resslot_swipe .swipe-nav li {' +
            'border-radius: 5px;' +
            'width: 9px;' +
            'height: 9px;' +
            'background-color: #ccc;' +
            'opacity: 70%;' +
            'float: left;' +
            'margin-right: 9px;' +
        '}' +
        '#resslot_swipe .swipe-nav li.active {' +
            'background-color: #ff8416;' +
        '}' +

        '#resslot_swipe img{' +
            'width: 100%;' +
            'height: <%=height%>px;' +
            'float: left;' +
        '}' +
        '</style>';
    var SWIPE_TPL = '<div id="resslot_swipe">' +
        '<ul class="swipe-nav">' +
            '<% for (var i=0,leni=$data.picList.length; i<leni; i++) {%>' +
                '<li></li>' +
            '<% } %>' +
        '</ul>' +
        '<div class="swipe-content">' +
            '<% for (var i=0,leni=$data.picList.length; i<leni; i++) {%>' +
                '<a class="swipe-pane" href="<%= $data.picList[i].navUrl %>"><img src="http://img.china.alibaba.com/cms/upload/other/lazyload.png" swipe-lazy-src="" data-origimg="<%= $data.picList[i].picUrl %>" class="swipe-image"></img></a>' +
            '<% } %>' +
        '</div>' +
      '</div>';

    return resSlot;
});


