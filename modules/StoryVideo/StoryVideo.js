
//universal item for videos, positioned videos
var StoryVideo = PlayerClass.extend({
    init: function ($elem,data,context) {
        this.scene = context;
        this.video = $elem[0];
        this.data = data[$elem.prop('id')];
        this.states = data.length ? data : String($elem.data('playin')).split(',');

        var _this = this;

        var controllers = this.scene.$root.find('[data-target="' + $elem.prop('id') + '"]');
        if (controllers.length) {
            for (i=0; i < controllers.length; i++) {
                $(controllers[i]).data('target',_this);
            }
        }

        if ( typeof this.states === 'string' ) {
            this.states = this.states.split(',');
        }

        if (this.states.length) {

            $(document).on('qs-scene' + _this.scene.id + '-stateshown', function (e,scene,state) {
                if (_this.states.length && _this.states.indexOf(String(state)) == -1) {
                    _this.pause()
                } else {
                    _this.play()
                }
            });

        } else {
            $(document).on('qs-scene' + _this.scene.id + '-sceneshown', function () {_this.play()});
        }

        //show a poster until the video is not being played
        /*if (this.root.data('poster')) {
            this.video[0].onended = function() {
                // _this.poster.show();
            };
        }*/

        //show poster again if video ended
        /* if (this.root.data('onendposter')) {
         this.video[0].onended = function() {
         // _this.poster.show();
         };
         }*/

         //show a loader on mobile until actual play began
        if (_this.scene.player.isreader) {
            ///video.bind("click", _this.showloader)
            //_this.video.bind("progress", _this.hideloader)
        }

        $(document).on('qs-scene' + _this.scene.id + '-scenehidden', function () {_this.pause()});

    },

    playpause: function () {
        this.video.paused ? this.video.play() : this.video.pause();
    },

    play: function () {
        this.video.play()
    },

    pause: function () {
        this.video.pause()
    },

    seekTo: function (seekToTime) {
        if (seekToTime > 0 && seekToTime < this.video.duration) {
            this.video.currentTime = seekToTime;
        }
    },

    showloader: function() {

      /*  if (this.root.find(".loader").length <1) this.video.parent().append('<p class="loader"></p>');
        $loader = this.root.find('.loader');
        $loader.css({
            width:this.video.width(),
            height:this.video.height(),
            marginTop:this.video.css('margin-top'),
            marginLeft:this.video.css('margin-left')
        });
        this.poster.hide();*/

    },

    hideloader: function(e) {
     /*   var videoobj = e.target;
        $(videoobj).unbind("progress");
        var $loader = $(videoobj).parent().find(".loader");
        $loader.hide();*/

    }
});

StoryVideo.type = 'element';