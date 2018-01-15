
//Avoid `console` errors in browsers that lack a console.
if (!window.console) window.console={log:function(){}};

var PlayerClass = Class.extend({
    bindClosure : function (method, param) {
        var _this = this;
        return (
            function () {
                return ( method.apply(_this, [param]) );
            }
        );
    },
    PlayerError: function (msg) {
        alert(msg);
        return false;
    }
});


//unify requestanimframe, fallback for browsers lacking it
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
    }

    if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
    }
}());


//urlvars
$.extend({
    getUrlVars: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name){
        return $.getUrlVars()[name];
    }
});



//universal device information
var PlayerDevice = PlayerClass.extend({
    init: function () {
        this.istablet = false;
        this.isphone = false;
        this.ismobile = false;
        this.isdesktop = false;
        this.hasvideo = false;
        this.isdeveloper = false;
        this.isiphone = false;
        this.isie8 = $('html').hasClass('ie8');

        var mobagents = ['android', 'windows phone', 'iphone', 'ipad', 'webos', 'blackberry', 'mobile safari'],
            screensize = window.screen.width,
            $body = $('body');


        //UA sniffing is shit, but needed for video playback behaviour
        for(var i in mobagents) {
            if(navigator.userAgent.toLowerCase().indexOf(mobagents[i]) !== -1) {
                this.ismobile = true;
            }
        }
        if ($.getUrlVar('mobile')) {
            this.ismobile = $.getUrlVar('mobile');
        }


        if(navigator.userAgent.toLowerCase().indexOf('iphone')) {
            this.isiphone = true;
        }

        if ( (screensize > 650 && this.ismobile) || $.getUrlVar('tablet')) {
            this.istablet = true;
            $body.addClass('tablet');
        } else if ( (this.ismobile) || $.getUrlVar('phone')) {
            this.isphone = true;
            $body.addClass('phone');

        } else if ( !this.ismobile ) {
            $body.addClass('desktop');
        }

        this.isdeveloper =  $.getUrlVar('devmode') || $('[data-devmode]').length;
    }
});

device = new PlayerDevice();




//language code/charset/rtl setup
function fontsetup(textnode) {

    var langtable = {
            'greek-ext':['gr-GR'],
            'greek':['gr-GR'],
            'vietnamese':[],
            'latin-ext':['hu-HU'],
            'cyrillic':['ru-RU']
        },
        langlist = '',
        rtllangs = ['ar-AE'];

    $.each(langtable, function (i,val) {
        var v = $.inArray(textnode,val);
        if (v > 0) { langlist += ',' + i; }
    });

    WebFontConfig = {
        google: { families:  [ 'Noto+Sans:300,400,700:latin' + langlist] }
    };

    var wf = document.createElement('script');
    wf.src = ('https:' === document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);

    $.each(rtllangs, function (i,val) {
        if (textnode === val) { $('body').prop('dir','rtl') }
    });

}

//TODO find another method
/*$(window).on('qs-templatesloaded',function() {

    //offline detector
    (function detectoffline(){
        $.get('http://cors.io/?u=http://google.com/favicon.ico')
            .fail(function(e) {

                $.magnificPopup.open({
                    items: {
                        src: '#notif_offline'
                    },
                    type: 'inline',
                    closeOnBgClick: false,
                    closeBtnInside: false
                });

            });

    })();

});*/

var debuglog = $.getUrlVars().debuglog;
function PlayerLog(type,message) {
    if (debuglog !== 'off') {
        if (debuglog == 'alert') {
            alert(message);
        } else {
            type = type ? type : 'log';
            console[type](message);
        }
    }
}


//html5 fullscreen shim
function toggleFullScreen() {

    if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}


//control colorer
function controllerColor(bck,icon) {
    bck = bck ? bck : '255,255,255,1';
    icon = icon ? icon : '0,0,0,1';

    if (player.isreader) {
        TweenMax.to('#buttons > div',.6,{backgroundColor:'rgba(' + bck + ')'});
    }

    TweenMax.to('#buttons svg .color',.6,{fill:'rgba(' + icon + ')'});
}

$(window).on('qs-sceneshown', function(e, name, state, $root) {
    controllerColor($root.data('controlcolorback'), $root.data('controlcoloricon') );
});


//iphone has no landscape mediaquery
(function iphoneorientation() {
    if (device.isiphone) {
        $(window).on("orientationchange",function(e){
          if (Math.abs(window.orientation) == 90) {
              $('#orientationwarning').addClass('on')
          } else {
              $('#orientationwarning').removeClass('on')
          }
        });
    }
})();

//to query arbitrary classes, eg. global brand colors
function getcss(prop, fromClass) {
    var $inspector = $("<div>").css('display', 'none').addClass(fromClass);
    $("body").append($inspector); // add to DOM, in order to read the CSS property
    try {
        return $inspector.css(prop);
    } finally {
        $inspector.remove(); // and remove from DOM
    }
};


var PlayerAnalytics = PlayerClass.extend({

    init: function(args) {
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

        this.app = args.app;
        this.ga = ga;
        if (this.app.trackingid) {
            PlayerLog('warn','No tracking ID found, Analytics will be disabled');
            return false
        }

        var cDomain = String(window.location).indexOf('localhost') > -1 ? 'none' : 'auto';
        this.ga('create', this.app.trackingid, cDomain);

        this.pageview('Preload');
    },

    pageview: function(title) {
        this.ga('send', 'pageview', { title: this.app.story.title + ' - ' + title });
    },

    event: function(cat,action,label) {
        this.ga('send', { 'hitType': 'event', 'eventCategory': cat, 'eventAction': action,'eventLabel': label });
    }

});


var PlayerInputcontrol = PlayerClass.extend({
    init: function (params) {
        this.app = params.app;
        this.scrollTimeout = 0;
        this.allowScroll = true;
        this.preventPageSlide = false;
        this.touchMoved = 0;
        this.touchStartPos = [0, 0];
        this.targetNaviSlide = "none";
        this.forceMouseNaviHidden = false;
        this.firstTouch = true;
        this.checkScrollPos = null;
        this.dragging = false;
    },

    initBaseControls: function () {
        if (device.ismobile) {
            this.initTouchControl();
        } else {
            this.initWheelControl();
        }

        this.initKeyControl();
    },


    initKeyControl: function() {
        var _this = this;

        /// keyboard input event listeners
        $(document).on('keydown.control', function(event) {

            var eventobj = window.event ? window.event : event;

            switch (eventobj.keyCode) {
                //up
                case 38:
                    if (!_this.app.isreader) {
                        _this.app.prev();
                    }
                    break;

                //down,space
                case 40:
                case 32:
                    if (!_this.app.isreader) {
                        _this.app.next();
                    }
                    break;
            }

            if (eventobj.keyCode == 81 && eventobj.ctrlKey && eventobj.shiftKey && eventobj.altKey) {
                _this.app.quinamicode();
            }

        });

    },



    initTouchControl: function () {
        var _this = this;


        function touchend(e) {
            if (_this.checkScrollPos) {
                _this.checkScrollPos = null;
            }
        }

        function touchstart(e) {
            _this.dragging = false;

            if (_this.firstTouch) {
                _this.firstTouch = false;
            }
            if (_this.preventPageSlide ) {
                return;
            }

            if (e.clientX) {
                _this.touchMoved = 0;
                _this.touchStartPos = [e.clientX,e.clientY];
            } else {
                var touch = e.touches[0];
                _this.touchMoved = 0;
                _this.touchStartPos = [touch.pageX, touch.pageY];
            }
        }

        function touchmove(e) {
            _this.dragging = true;

            if (_this.app.scrolldisabled) {
                return
            }

            if ((_this.preventPageSlide || _this.touchMoved == 1 )) {
                e.preventDefault();
                return;
            }
            if (device.istablet){
                // no scrolling
                e.preventDefault();
            } else {
                var sc = $(e.target).parents(".scrollable-content");
                if (sc.length) {
                    _this.checkScrollPos = sc;
                }
                return; // no swipe on content scenes!
            }

            if (e.clientX) {
                var distX = e.clientX - _this.touchStartPos[0];
                var distY = e.clientY - _this.touchStartPos[1];
            } else {
                var touch = e.touches[0];
                var distX = touch.pageX - _this.touchStartPos[0];
                var distY = touch.pageY - _this.touchStartPos[1];
            }

            var angle = _this.diamondAngle(distX, distY);
            var dist = Math.sqrt( distX * distX + distY * distY );

            if (device.istablet && dist > 100) { // 100
                touchMoved = 1;
                if ((angle <= 0.5) || (angle >= 3.5)) { // down
                    _this.app.prev();
                } else if (angle <=2.5 && angle > 1.5 ) { // up
                    _this.app.next();
                }/* else if ( angle < 3.5 && angle > 2.5 ) { // left
                 alert( 'RIGHT' );
                 } else if (angle <= 1.5 && angle > 0.5 ) { // right
                 alert( 'LEFT' );
                 }*/
            }

        }

        document.addEventListener('touchcancel.control', touchend, false);
        document.addEventListener('touchend.control', touchend, false);
        document.addEventListener('pointerup.control', touchend, false);
        document.addEventListener('MSPointerUp.control', touchend, false);

        document.addEventListener('touchstart.control', touchstart, false);
        document.addEventListener('pointerdown.control', touchstart, false);
        document.addEventListener('MSPointerDown.control', touchstart, false);

        document.addEventListener('touchmove.control', touchmove, false);
        document.addEventListener('pointermove.control', touchmove, false);
        document.addEventListener('MSPointerMove.control', touchmove, false);
    },

    diamondAngle: function (y, x) {
        if (y < 0) {
            return (x < 0 ? 2 - y / (-x - y) : 3 + x / (x-y));
        }
        return (x >= 0 ? y / (x + y) : 1 - x / (-x + y));
    },

    initWheelControl: function () {

        var  _this = this,
            mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll.control" : "mousewheel.control",
            timer = null,
            scrollcount = 0,
            delta = 0;

        $(window).bind(mousewheelevt, function(e) {

            if (_this.app.scrolldisabled) {
                return
            }

            if (timer) {

                var evt = window.event || e;
                delta = (evt.originalEvent && evt.originalEvent.detail) ? evt.originalEvent.detail * (-40) : evt.wheelDelta;
                scrollcount++;

            } else if (!timer) {
                timer = setTimeout(function() {

                    if (scrollcount >= 1) {
                        delta > 0 ? _this.app.prev() :  _this.app.next();
                    }

                    clearTimeout(timer);
                    timer = null;
                    scrollcount = 0;
                },400);
            }

        });

    },

    deactivate: function() {
        $(window).unbind('.control').off('.control');
        $(document).unbind('.control').off('.control');
    }

});


//object to generate/handle terms of contents
var PlayerToc  = PlayerClass.extend({
    init: function (root,app) {
        this.$root = root;
        this.app = app;

        var _this = this;

        $(document).on('qs-sceneshown', function() {
            _this.refresh(_this.app.story.currentchapter.id,_this.app.story.currentchapter.currentscene.id);
        });
    },
    make: function(){

        var _this = this,
            chapters = this.app.story.chapters;

        for (var chapterID in chapters){

            var chapter = chapters[chapterID],
                chapter_name = chapter.title;

            var chapter_toc = $("<div class='toc_chapter'></div>");
            var chapter_title_dom = $("<h2 class='toc_link'>" + chapter_name +"</h2>");
            chapter_toc.append(chapter_title_dom);

            for ( var sceneID in chapter.scenes ){

                if (sceneID === "0"){
                    chapter_title_dom.attr("data-link",(chapterID + "," + sceneID));
                    continue;
                }

                var scene = chapter.scenes[parseInt(sceneID,10)],
                    scene_title_dom = $("<h3 class='toc_link' data-link='" + chapterID + "," + ( sceneID ) + "'>"+ scene.title +"</h3>");
                chapter_toc.append(scene_title_dom);
            }
            this.$root.append(chapter_toc);

        }



        $('.toc_link').click(function (e) {
            _this.jump(e)
        })

    },

    refresh: function(chapter,scene) {
        //TODO: need to revisit
        this.$root.find('[data-link="'+ chapter +',0"]').addClass('visited');
        this.$root.find('[data-link="'+ chapter +',' + scene + '"]').addClass('visited');
    },

    jump: function(ev) {

        if (!$(ev.target).hasClass("visited") ){ return; }
        var info = $(ev.target).attr("data-link");
        if (!info) {
            PlayerLog('info',"error in menu link");
            return false;
        } else {
            info = info.split(",");
            this.toggle();
            this.app.jumpto(parseInt(info[0],10),parseInt(info[1],10),0);
        }

    },

    toggle: function() {

        var story = this.app.story.$root;

        var tl = new TimelineMax();

        if (device.isdeveloper) {
            this.$root.find('[data-link]').addClass('visited');
        }

        if (this.istocmode){

            tl.to(story,0.4,{scale:1, ease:Power2.easeOut});
            this.$root.removeClass("open");
            this.app.story.currentchapter.currentscene.$root.find("video").css("visibilty","inherit");
            tl.to(this.$root,0.4,{autoAlpha:0, ease:Power2.easeOut},-0.4);
            tl.to(story,0.4,{opacity:1, ease:Power2.easeOut},-0.4);
            this.istocmode = false;
            this.app.scrolldisabled = false;

        } else {

            tl.to(story,0.4,{scale:.75, ease:Power2.easeOut});
            this.$root.addClass("open");
            this.$root.show();
            tl.to(this.$root,.7,{autoAlpha:1, ease:Power2.easeOut},-0.3);
            tl.staggerFromTo(this.$root.find(".toc_chapter"),0.5,{autoAlpha:0,y:"-50px", transform:"rotateX(90deg)"},{autoAlpha:1,y:"0", transform:"rotateX(0)", ease:Power2.easeOut},-0.4);
            this.app.story.currentchapter.currentscene.$root.find("video").css("visibilty","hidden");
            this.istocmode = true;
            this.app.scrolldisabled = true;

        }
    }
});





var PlayerMedialoaderFile =  PlayerClass.extend({
    init: function (args) {
        this.type = args.type;
        this.file = args.file;
        this.progressValue = args.progressValue;
        this.progressCall = args.progressCall;
        this.endCall = args.endCall;

        var _this = this,
            xhr = new XMLHttpRequest();

        xhr.addEventListener("progress", function(e) { _this.transferProgress(e) }, false);
        xhr.addEventListener("load", function(e) { _this.transferComplete(e) }, false);
        xhr.addEventListener("error", function(e) { _this.transferFailed(e) }, false);

        xhr.open("GET", $(args.file).data('src'), true);
        xhr.send();
    },

    transferProgress:function (e) {

        if (e.lengthComputable) {
            var percentComplete = (e.loaded / e.total) * 100;
            this.progressCall.apply(this,[this.progressValue * percentComplete])
        }

    },

    transferComplete:function (e) {
        this.endCall()
    },

    transferFailed:function (e) {

    }
    
});



var PlayerMedialoader =  PlayerClass.extend({

    init: function (args) {
        this.selectors = {
            image: {
                selector:'img[data-src]',
                progressValue:10
            },
            video: {
                selector:'video[data-src]',
                progressValue:40
            }
        };
        this.loadBySegment = args.loadBySegment;
        this.player = args.player;
        this.$container = args.container;

        this.totalvalue = 0;
        this.loadedvalue = 0;
        
    },

    start:function (callback) {
        var _this = this;
        _this.callback = callback;

        if (this.loadBySegment) {

            this.$container.find(this.loadBySegment).each(function (i,segment) {
                _this.load($(segment),i)
            })

        } else {
            _this.load(this.$container, _this.$container)
        }
    },

    load: function ($container,segmentIndex) {

        var _this = this,
            itemcount = 0;

        $(document).trigger('qs-loadstart');

        $.each(this.selectors, function (type,opts) {

            var toFilter = _this.player.isreader ? 'presentation' : 'reader',
                items = $container.find($(opts.selector).not('[data-for=' + toFilter + ']'));

            items.each(function (i,file) {
                item = new PlayerMedialoaderFile({
                    type:type,
                    file:file,
                    segment:segmentIndex,
                    progressCall: function (itemProgress) {
                        var partialprogressPercent = (_this.totalvalue / (_this.loadedvalue + itemProgress)) * 100;
                        $(document).trigger('qs-loadprogress',[partialprogressPercent]);
                    },
                    endCall:function () {
                        _this.loadedvalue += opts.progressValue;
                    }
                });

                _this.totalvalue += opts.progressValue;

            });
            itemcount += items.length;

        })

        this.callback()

    }




});