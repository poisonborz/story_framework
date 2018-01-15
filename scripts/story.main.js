

var PlayerScene = PlayerClass.extend({
    init: function( $root, chapter, id ){

        this.$root = $root;
        this.player = chapter.player;
        this.chapter = chapter;
        this.id = id;
        this.name = this.$root.prop('id');
        this.title = this.$root.find('> .title').text();
        this.timeline = new TimelineMax({ paused:true });
        this.currentstate = 0;

        this.animation = { in:null,states:null,out:null };
        this.playmode = storyAnimations && storyAnimations[this.name] ? storyAnimations[this.name].mode : null;
        this.readeranimation = this.$root.data('readeranimation');
        this.currentscene = null;
        this.completion = [];
        this.moduleinstances = {};

        this.isanimating = false;

        var _this = this;


        _this.loadAnimation();

        if (this.player.settings.modules && this.player.settings.modules.length) {
            _this.loadElementModules(_this.player.settings.modules.split(','))
        }

        _this.emitSceneEvent('sceneinit');

    },

    loadAnimation: function() {

        if (device.isphone && !this.readeranimation) {
            return false
        }

        var _this = this,
            temptimelineIn = new TimelineMax({ paused:true }),
            temptimelineOut = new TimelineMax({ paused:true }),
            defaultIn = presetanimStory[_this.$root.data('animIn')] || presetanimStory['slideIn'],
            defaultOut = presetanimStory[_this.$root.data('animOut')] || presetanimStory['slideOut'];

        if (typeof storyAnimations !== 'undefined' && storyAnimations[_this.name]) {

            if (storyAnimations[_this.name].in) {
                if (typeof storyAnimations[_this.name].in === 'function') {
                    storyAnimations[_this.name].in.apply(_this.$root,[temptimelineIn,_this]);
                    _this.animation.in =  temptimelineIn;
                } else {
                    presetanimStory[storyAnimations[_this.name].in].apply(_this.$root,[temptimelineIn]);
                    _this.animation.in =  temptimelineIn;
                }
            }

            if (storyAnimations[_this.name].states) {
                _this.animation.states = {};

                $.each(storyAnimations[_this.name].states,function(i,val) {
                    var stateTl = new TimelineMax({ paused:true });
                    val.apply(_this.$root,[stateTl,_this]);
                    _this.animation.states[i] = stateTl;
                });

            } else if (!_this.animation.in) {
                defaultIn.apply(_this.$root,[temptimelineIn,_this]);
                _this.animation.in = temptimelineIn;
            }

            if (storyAnimations[_this.name].out) {
                if (typeof storyAnimations[_this.name].out === 'function') {
                    storyAnimations[_this.name].out.apply(_this.$root,[temptimelineOut,_this]);
                } else {
                    presetanimStory[storyAnimations[_this.name].out].apply(_this.$root,[temptimelineIn,_this]);
                }
            } else {
                defaultOut.apply(_this.$root,[temptimelineOut,_this]);
            }
            _this.animation.out = temptimelineOut;

        } else {

            this.playmode = null;

            defaultIn.apply(_this.$root,[temptimelineIn,_this]);
            defaultOut.apply(_this.$root,[temptimelineOut,_this]);

            this.animation.in = temptimelineIn;
            this.animation.out = temptimelineOut;

        }



        if ( !this.playmode || this.playmode === 'linear') {

            if ( _this.animation.in) {
                this.timeline.add("in");
                this.timeline.add(_this.animation.in);
                this.timeline.add("inEnd");
            }

            if ( _this.animation.states) {
                $.each(_this.animation.states,function(i,val) {
                    _this.timeline.add(i.toString());
                    _this.timeline.add(val);
                    _this.timeline.add(i + 'End');
                });
            }

            this.timeline.add("out");
            this.timeline.add(_this.animation.out);
            this.timeline.add("outEnd");

            $.each(_this.timeline.getChildren(),function(i,nestedtimeline) { nestedtimeline.play() });

        }

    },

    emitSceneEvent: function (event) {

        var args = [this.name, this.currentstate, this.$root];

        $(document).trigger('qs-' + event, args);
        $(document).trigger('qs-scene' + this.id + '-' + event, args);
        $(document).trigger('qs-scene' + this.id + '-state' + this.currentstate + '-' + event, args)

    },

    loadElementModules: function(modulelist) {
        var _this = this;

        $.each(modulelist,function(i,val) {

            if (window[val].type === 'element') {
                var el = _this.$root.find('[data-module="' + val + '"]');
                if (el.length) {

                    _this.moduleinstances[val] = [];

                    $.each(el,function(i,element) {
                        var data = storyModuledata && storyModuledata[val] ? storyModuledata[val] : [],
                            elItem = new window[val]($(element),data,_this);
                        _this.moduleinstances[val].push(elItem)
                    })
                }
            }

        });

    },

    stateIscompleted: function(state) {
        return this.completion.indexOf(state) > -1
    },

    stateRemovecompletion: function(state) {
        var i =  this.completion.indexOf(state);
        if (i > -1) {
            this.completion.splice(i, 1);
        }
    },

    stateAddcompletion: function(state) {

        if (this.stateIscompleted(state)) {
            this.stateRemovecompletion(state);
            this.stateAddcompletion(state);
        } else {
            this.completion.push(parseInt(state))
        }

    },

    stateGetfirstuncompleted: function() {

        var firstuncompleted,
            _this = this;

        $.each(_this.animation.states, function(i, val) {
            if (!_this.stateIscompleted(parseInt(i))) {
                firstuncompleted = i;
                return false
            }
        });

        return firstuncompleted;

    },

    playstate: function(state, options, call) {

        var _this = this,
            opts = options || {};

        _this.isanimating = true;



        if (_this.player.isreader && !this.readeranimation) {

            var tl = new TimelineMax({paused: true});
            if (state === 'in') $('body,html').scrollTop(0);
            presetanimStory[state === 'in' ? 'slideIn' : 'slideOut'].apply(_this.$root, [tl]);
            tl.eventCallback('onComplete', function () {
                playfinish();
            }).seek(0).play();

        //if linear, simply choose start/endpoints on a pre-made timeline
        } else if ( !this.playmode || this.playmode === 'linear') {

            var isEntryWithMergedIn =  state === 'in' && _this.animation.states, //merge in+s0 animation cycles if both exists
                start = opts.isReverse ? isEntryWithMergedIn ? '0End' : state + 'End' : state.toString(),
                stop = opts.isReverse ? state.toString() : isEntryWithMergedIn ? '0End' : state + 'End';

            _this.timeline.tweenFromTo(start, stop, {onComplete:playfinish} );

        //if not, dynamically throw one together from state data
        } else {

            _this.timeline = new TimelineMax({paused:true});

            if (state === 'in' || state === 'out') {
                _this.timeline.add(_this.animation[state] ? _this.animation[state] : '').add( state === 'in' ? opts.isReverse ? _this.animation.states[_this.currentstate] : _this.animation.states[0] : ''); //also bind s0 anim if in
            } else {
                _this.timeline.add(_this.animation.states[state])
            }

            $.each(_this.timeline.getChildren(),function(i,nestedtimeline) { nestedtimeline.play() });

            if (opts.isReverse) {
                _this.timeline.eventCallback('onReverseComplete',playfinish).seek(_this.timeline.duration()).reverse();
            } else {
                _this.timeline.eventCallback('onComplete',playfinish).seek(0).play();
            }

        }


        function playfinish () {
            if (_this.animation.states) {
                _this.currentstate = $.isNumeric(state) ? state : state === 'in' ? 0 : Object.keys(_this.animation.states).length - 1;
            } else {
                _this.currentstate = 0;
            }

            _this.isanimating = false;

            if ( (_this.player.story.chapters.length - 1 === _this.chapter.id && _this.chapter.scenes.length - 1 === _this.id )  ) {
                $('#buttons').find('#nav_next').hide();
            } else {
                $('#buttons').find('#nav_next').show();
            }

            _this.player.updateprogress();

            if (call) { call() }
        }


    },

    show: function(state, options, call) {

        var _this = this,
            opts = options || {};

        //timeout to prevent FOUC on webkit for animation-styled starting frame on webkit
        setTimeout(function () {
            _this.$root.addClass('active');
        },10);

        if (opts.isReverse) {

            this.playstate('out', {isReverse:true}, function() {

                if (_this.animation.states) {

                    //instant set completion if coming from arbitrary future slide
                    if (_this.completion.length < Object.keys(_this.animation.states).length) {
                        _this.completion = [];
                        $.each(_this.animation.states, function(i,val) {
                            _this.stateAddcompletion(i);
                        });
                    }
                 }

                if (call) { call() }
            })

        } else {

            this.completion = [];

            this.playstate(state ? state : 'in', {isInstant: opts.isInstant}, function() {
                if (call) { call() }
            });
        }

        if (_this.player.analytics) {
            _this.player.analytics.pageview('c' + this.chapter.id + 's' + this.id + ' - ' + this.title);
        }

        PlayerLog('info',"Scene shown: " + this.title);

    },

    hide: function(options, call ){
        var _this = this,
            opts = options || {};

        _this.playstate(opts.isReverse ? 'in' : 'out', {isReverse: opts.isReverse}, function() {
            _this.$root
                .removeClass("active")
                .removeClass (function (index, css) {
                    return (css.match (/(^|\s)state-\S+/g) || []).join(' ');
                });

            PlayerLog('info',"Scene hidden: " + _this.title);
            _this.emitSceneEvent('scenehidden');

            if (call) { call(); }

        });
    }


});


var PlayerChapter = PlayerClass.extend({
    init: function( $root, story, id ){

        this.$root = $root;
        this.story = story;
        this.id = id;
        this.name = this.$root.prop('id');
        this.title = this.$root.find('> .title').text();
        this.scenes = [];
        this.player = story.player;
        this.currentscene = null;

        var _this = this;

        $root.find(".scene").not('[data-disabled]').each(function(i,val){
            _this.scenes.push(new PlayerScene( $(val), _this, i ));
        });
    }

});


var PlayerStory = PlayerClass.extend({
    init: function( $root, player, infonode ){
        this.player = player;
        this.$root = $root;
        this.chapters = [];
        this.currentchapter = null;

        var _this = this;

        if (infonode.length) {
            this.logo = infonode.find('.logo');
            this.title = infonode.find('.title').text();
            this.desc = infonode.find('.description').text();

            document.title = this.title;
        }


        var $chapterblocks = this.$root.find('.chapter');
        if ($chapterblocks.length) {

            $chapterblocks.each(function(i, val){
                if (!$(val).find('.scene').not('[data-disabled]').length) {
                    PlayerLog('warn','Chapter ' + $(val).prop('id') + ' is empty');
                    return true
                } else {
                    _this.chapters.push(new PlayerChapter( $(val), _this, i ));
                }
            });

        } else {
           PlayerLog("warn","No chapters detected")
        }


    },

    countstates: function() {
        var currentposition = 0,
            statecount = 0;

        for (var c in this.chapters) {

            for (var s in this.chapters[c].scenes.length ? this.chapters[c].scenes : []) {

                if (this.currentchapter && this.chapters[c].id === this.currentchapter.id && this.chapters[c].scenes[s].id === this.currentchapter.currentscene.id) {
                    currentposition = statecount + this.chapters[c].scenes[s].completion.length + 1;
                }

                if (this.chapters[c].scenes[s].animation.states && !this.player.isreader) {
                    statecount += Object.keys(this.chapters[c].scenes[s].animation.states).length;
                } else {
                    statecount++;
                }
            }

        }

        return [currentposition, statecount];
    },

    //navigation: arbitrary targets
    jumptoIn: function( chapter, scene, state, isInstant, call ) {

        if (this.currentchapter && this.currentchapter.currentscene.isanimating) {
            PlayerLog('info','navigation blocked, in animation');
            return false;
        }

        var _this = this,
            playnewstate = function() {

                _this.currentchapter.currentscene.playstate(state, null, function () {
                    if (_this.currentchapter.currentscene.animation.states) {
                        _this.currentchapter.currentscene.stateAddcompletion(_this.currentchapter.currentscene.currentstate);
                    }

                    if (call) { call() }
                });

                _this.currentchapter.currentscene.emitSceneEvent('stateshown');
            },
            playnewscene = function() {
                if (!_this.chapters.length) return false;

                _this.currentchapter = _this.chapters[chapter];
                _this.currentchapter.currentscene = _this.currentchapter.scenes[scene];

                _this.currentchapter.currentscene.show(null, null, function() {
                    _this.currentchapter.currentscene.currentstate = 0;
                    if (_this.currentchapter.currentscene.animation.states) {
                        _this.currentchapter.currentscene.stateAddcompletion(_this.currentchapter.currentscene.currentstate);
                    }

                });

                _this.currentchapter.currentscene.emitSceneEvent('sceneshown');
                _this.currentchapter.currentscene.emitSceneEvent('stateshown');
            };

        if (!chapter) chapter = 0;
        if (!scene) scene = 0;
        if (!state) state = 0;

        //handle invalid targets
        if (this.chapters.length) {
            if (chapter < 0 || chapter > this.chapters.length) {
                PlayerLog('warn','Invalid target chapter');
            } else if (scene < 0 || scene > this.chapters[chapter].scenes.length) {
                PlayerLog('warn','Invalid target scene');
            } else if (state < 0 || state > this.chapters[chapter].scenes[scene].animation.states) {
                PlayerLog('warn','Invalid target state');
            }
        }

        //pointing to itself or neighbouring state
        if (this.currentchapter && chapter === this.currentchapter.id && scene === this.currentchapter.currentscene.id) {

            if (!this.currentchapter.currentscene.animation.states || state === this.currentchapter.currentscene.currentstate) {
                PlayerLog('warn','Jump target is the same as current');
            } else {

                if (this.currentchapter.currentscene.playmode === 'nonlinear-unwrap' && this.currentchapter.currentscene.stateIscompleted(state)) {
                    PlayerLog('warn','Jump target already unwrapped');
                } else {

                    if (this.currentchapter.currentscene.playmode === 'nonlinear-centered') {

                        _this.currentchapter.currentscene.playstate(_this.currentchapter.currentscene.currentstate, {isReverse:true}, playnewstate);

                    } else if ( this.currentchapter.currentscene.playmode === 'nonlinear-centeredparallel' ) {

                        _this.currentchapter.currentscene.playstate(_this.currentchapter.currentscene.currentstate,{isReverse:true});
                        playnewstate();

                    } else {
                        playnewstate();
                    }

                }

            }

        } else {

            //pointing to arbitrary target
            if (this.currentchapter) {
                this.currentchapter.currentscene.hide({isInstant:isInstant}, playnewscene);
            } else {
                playnewscene();
            }


        }

        return true;

    },

    //navigation: just next/previous targets
    navigate: function(direction, call) {

        var _this = this;
        if (this.currentchapter && this.currentchapter.currentscene.isanimating) {
            PlayerLog('info','Navigation blocked, in animation');
            return false;

        }

        //state
        if (_this.currentchapter.currentscene.animation.states &&
            ( direction === 'next' ? _this.currentchapter.currentscene.completion.length < Object.keys(_this.currentchapter.currentscene.animation.states).length : _this.currentchapter.currentscene.completion.length > 1   )) {

            var targetstate =  direction === 'next' ? _this.currentchapter.currentscene.stateGetfirstuncompleted() : _this.currentchapter.currentscene.completion[ _this.currentchapter.currentscene.completion.length - 1 ];

            var navigateFinish = function() {

                if (direction === 'next') {
                    _this.currentchapter.currentscene.stateAddcompletion(_this.currentchapter.currentscene.currentstate)
                } else {
                    _this.currentchapter.currentscene.stateRemovecompletion(_this.currentchapter.currentscene.playmode === 'nonlinear-centered' || _this.currentchapter.currentscene.playmode === 'nonlinear-centeredparallel' ? _this.currentchapter.currentscene.completion[ _this.currentchapter.currentscene.completion.length - 1 ] :  _this.currentchapter.currentscene.currentstate);
                }

                if (_this.currentchapter.currentscene.animation.states) {
                    _this.currentchapter.currentscene.currentstate =  _this.currentchapter.currentscene.completion[ _this.currentchapter.currentscene.completion.length - 1 ];
                }

                _this.currentchapter.currentscene.emitSceneEvent('stateshown');

                if (call) { call() }

            };


            if (this.currentchapter.currentscene.playmode === 'nonlinear-centered') {

                _this.currentchapter.currentscene.playstate( _this.currentchapter.currentscene.currentstate, {isReverse:true}, function() {
                    _this.currentchapter.currentscene.playstate( direction === 'next' ? targetstate : _this.currentchapter.currentscene.completion[ _this.currentchapter.currentscene.completion.length - 2 ], 'linear', navigateFinish);
                });

            } else if (this.currentchapter.currentscene.playmode === 'nonlinear-centeredparallel') {

                _this.currentchapter.currentscene.playstate( _this.currentchapter.currentscene.currentstate, {isReverse:true});
                _this.currentchapter.currentscene.playstate( direction === 'next' ? targetstate : _this.currentchapter.currentscene.completion[ _this.currentchapter.currentscene.completion.length - 2 ], 'linear', navigateFinish);

            } else {
                _this.currentchapter.currentscene.playstate( targetstate, { isReverse: direction !== 'next' }, navigateFinish);
            }

        //scene (bumping chapter if necessary)
        } else if (
            (direction === 'next' ? _this.currentchapter.currentscene.id < _this.currentchapter.scenes.length - 1 : _this.currentchapter.currentscene.id > 0) ||
            (direction === 'next' ? _this.currentchapter.id < _this.chapters.length - 1 : _this.currentchapter.id > 0)
            ) {

            _this.currentchapter.currentscene.hide({isReverse: direction !== 'next'}, function() {

                if (direction === 'next' ? _this.currentchapter.id < _this.chapters.length - 1 : _this.currentchapter.id > 0) {
                    _this.currentchapter = _this.chapters[ direction === 'next' ? _this.currentchapter.id + 1 : _this.currentchapter.id - 1 ];
                }
                _this.currentchapter.currentscene = _this.currentchapter.scenes [ direction === 'next' ? _this.currentchapter.currentscene.id + 1 : _this.currentchapter.currentscene.id - 1 ];

                _this.currentchapter.currentscene.show(null, {isReverse: direction !== 'next'}, function() {

                    if (direction === 'next' && _this.currentchapter.currentscene.animation.states) {
                        _this.currentchapter.currentscene.stateAddcompletion( 0 )
                    }

                    _this.currentchapter.currentscene.emitSceneEvent('sceneshown');

                    if (call) { call() }
                });
            });


        //story
        } else {

            if (direction === 'next') {

                PlayerLog('info','No more content, end of story')

            } else {

                PlayerLog('info','No more content, beginning of story')

            }

        }

    }

});









//controller class - its functions are public and available for player instances in the deployment
var PlayerPlayer = PlayerClass.extend({

    init: function(templatename,textnode){
        this.story = null;
        this.templatename = templatename;
        this.textnode = textnode;

        this.isreader = false;
        this.scrolldisabled = false;

        this.containerUi = $('#storyUi');
        this.containerContent = $('#story');

        this.medialoaderUi = new PlayerMedialoader({player:this, container:this.containerUi});
        this.medialoaderContent = new PlayerMedialoader({player:this, container:this.containerContent, loadBySegment:'.chapter'});

        this.analytics = null;

        //defaults
        this.settings = {
            lightpreloadui : false,
            showFeedbackAtEnd: false,
            trackingid:null,
            modules:[]
        };

        this.getExternalResources(this.start);

    },

    getExternalResources: function (callback) {

        var  _this = this,
            template = $.Deferred(),
            settings = $.Deferred(),
            modules = $.Deferred(),
            loadcss = function (url) {
                if (document.createStyleSheet) {
                    document.createStyleSheet(url); //IE <11
                } else {
                    $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', url) );
                }
            };


        $.getJSON('content/scripts/settings.json')
            .always(function(data) {

                var uiFound = false,
                    uiLoaded = $.Deferred(),
                    uiApplied = false;

                if (data.status !== 404) {
                    _this.settings = data;
                }

                settings.resolve();

                var loaded = 0,
                    moduleItems= _this.settings.modules.split(',');

                if (_this.settings.modules && _this.settings.modules.length) {
                    $.each(moduleItems, function(i,val) {

                        $.getScript('modules/' + val + '/' + val + '.js')
                            .done(function () {
                                var resloaded = $.Deferred();

                                if (window[val]) {

                                    if (!uiApplied && window[val].type === 'ui') {
                                        uiFound = true;

                                        $.get('modules/' + val + '/' + _this.templatename + '.html')

                                            .always(function () {
                                                uiLoaded.resolve();
                                            })

                                            .done (function (data) {
                                                uiApplied = true;
                                                _this.containerUi.append(data);

                                                $.getJSON('modules/' + val + '/' + _this.templatename + '_' + _this.textnode + '.json')
                                                    .done(function(data) {
                                                        _this.applytextnode(_this.containerUi,data);
                                                        uiloaded = true;
                                                    })
                                                    .fail(function () {
                                                        PlayerLog('warn','UI template texts could not be loaded');
                                                    })
                                            })

                                    }

                                    if (window[val].resources && window[val].resources.constructor === Array) {

                                        var resloadedCount = 0;

                                        $.each(window[val].resources, function(i,rval) {

                                            var isExternal = rval.indexOf('//') > -1;

                                            if (rval.indexOf('.css') > -1) {
                                                loadcss(isExternal ? rval : 'modules/' + val + '/' + rval);
                                                resloadedCount++;


                                                if (resloadedCount === window[val].resources.length) {
                                                    resloaded.resolve()
                                                }

                                            } else if (rval.indexOf('.js') > -1) {

                                                $.getScript(isExternal ? rval : 'modules/' + val + '/' + rval, function() {

                                                    resloadedCount++;

                                                    if (resloadedCount === window[val].resources.length) {
                                                        resloaded.resolve()
                                                    }

                                                });

                                            }

                                        });
                                    } else {
                                        resloaded.resolve()
                                    }

                                    $.when(resloaded)
                                        .done(function() {
                                            loaded++;

                                            if (loaded === moduleItems.length) {

                                                if (!uiFound) {
                                                    PlayerLog('warn',"No UI module found, this training won't display");
                                                } else {
                                                    $.when(uiLoaded)
                                                        .always(function () {
                                                            if (uiApplied)
                                                                modules.resolve();
                                                            else {
                                                                PlayerLog('warn',"UI module error, this training won't display");
                                                            }
                                                        });
                                                }

                                            }
                                        })

                                }

                            })
                            .fail(function (e) {
                                PlayerLog('warn',"Couldn't load module " + val);
                            });

                    });

                } else {
                    modules.resolve();
                }
            });

        $.get('content/' + _this.templatename + '.html')
            .done(function(e) {
                $("#story").append(e);

                if (_this.settings.translationsFromJson) {
                    $.get('content/' + _this.templatename + '_' + _this.textnode + '.json')
                        .done(function(e) {
                            _this.applytextnode(e, '#story');

                            template.resolve();
                        })
                        .fail(function(e){
                            PlayerLog('warn',"Error loading story textnode");
                        });
                } else {
                    template.resolve();
                }

            })
            .fail(function(e) {
                PlayerLog('warn',"Error loading story template");
            });


        $.when(modules, template, settings)

            .done(function () {
                callback.apply(_this);
            })

            .fail(function(frtemplate, template) {
                alert("The player could not load.\n");
                PlayerLog('warn','STORY TEMPLATE ERROR');
            });

    },

    start: function () {

        $(window).trigger('qs-templatesloaded',[this.name, this.$root]);

        var _this = this,
            $body = $('body');

        $body.addClass('template-' + _this.templatename);

        _this.isreader = device.isphone;

        $body.addClass(_this.isreader ? 'mode-reader' : 'mode-presentation');

        _this.story = new PlayerStory( _this.containerContent, _this, $('#meta'));
        _this.inputcontrol = new PlayerInputcontrol( { app: _this} );

        _this.scorm = new PlayerSCORM( { app : _this } );
        _this.analytics = new PlayerAnalytics(  { app : _this }  );

        if (_this.settings.modules && _this.settings.modules.length) {
            $.each(_this.settings.modules.split(','),function(i,val) {
                if (window[val].type === 'global') {
                    var data = storyModuledata ? storyModuledata[val] : null,
                        elItem = new window[val](_this.story.$root,data,_this);
                }
            });
        }

        if (!_this.settings.headlessMode) {
            this.inputcontrol.initBaseControls();
        } else {
            _this.inputcontrol.$controls.find('#controlSeeker').hide();
        }


        _this.recalcviewport();
        _this.updateprogress();
        _this.scorm.initSCORM();

        $( window ).resize($.debounce(_this.recalcviewport, 200));

        _this.medialoaderUi.start(function () {
            _this.medialoaderContent.start(function () {
                $(document).trigger('qs-playstart');
                var jumpto = $.getUrlVars();
                _this.jumpto(jumpto.c || 0,jumpto.s || 0,jumpto.ss || 0);
            })

        });

    },



    updateprogress: function() {
        var stateinfo = this.story.countstates(),
            percent = (stateinfo[0]/stateinfo[1])*100;

        $('#seeker').width( percent + '%' );
    },


    quinamicode: function() {

        var jumpto = prompt("TOC unlocked. Type chapter/scene", this.story.currentchapter.id + ',' + this.story.currentchapter.currentscene.id + ',' + this.story.currentchapter.currentscene.currentstate);

        if (jumpto !== null) {
            jumpto = jumpto.split(',');
            this.jumpto(parseInt(jumpto[0],10),parseInt(jumpto[1],10),parseInt(jumpto[2],10))
        }

        device.isdeveloper = true;

    },

    applytextnode: function(textnode,container) {
        $.each(textnode, function(textid, val) {
            $(container).find('[data-textid="' + textid + '"]').html(val);
        });
    },


    recalcviewport: function() {

        //dynamic resize of player contentFrame
        var w = Math.min(1600,parseInt($( window ).width(),10)),
            h = Math.min(1200,parseInt($( window ).height(),10)),
            $o = $('.content'),
            vw = $o.width(),
            vh = $o.height();

        if (player.isreader){

            var ratio = $(window).width() / vw;
            player.story.$root.css('transform','scale('+ ratio + ')');

            $.each(player.story.chapters,function(i,val){
                val.$root.find(".content").css("min-height", parseInt($(window).innerHeight(),10) / ratio + "px");
            });


        } else {

            var vw = 1024;
            var vh = 670;

            var scaleAmount = Math.round(Math.min(w/vw, h/vh)*100)/100;
            $o.css("transform","scale(" + scaleAmount + ")");
            $o.css("-webkit-transform","scale(" + scaleAmount + ")");

        }
    },

    next: function(call){
        this.story.navigate('next', $.type(call) === 'function' ? call : null )
    },

    prev: function(call){
        this.story.navigate('prev', $.type(call) === 'function' ? call : null )
    },

    jumpto: function(chapter, scene, state, call) {

        this.story.jumptoIn(
            chapter !== null ? parseInt(chapter,10) : this.story.currentchapter.id,
            scene !== null ? parseInt(scene,10) : this.story.currentchapter.currentscene.id,
            state !== null ? parseInt(state,10) : this.story.currentchapter.currentscene.currentstate,
            $.type(call) === 'function' ? call : null
        )

    },

    getChapterId: function() {
        return this.story.currentchapter.id
    },

    getSceneId: function() {
        return this.story.currentchapter.currentscene.id
    },

    getState: function() {
        return this.story.currentchapter.currentscene.currentstate
    },

    getMaxstates: function() {
        return this.story.currentchapter.currentscene.animation.states
    },

    togglefullscreen: function() {
        toggleFullScreen();
    }

});
