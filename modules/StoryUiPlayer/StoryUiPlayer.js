
var StoryUiPlayer = PlayerClass.extend({
    init: function ($elem,data,context) {

        var _this = this;
        
        
        $(document).on('qs-playstart', function () {
            $('#controls').addClass('controls_shown');
        });

        _this.toc = new PlayerToc( $('#controls').find("#toc"), _this );
        _this.toc.make();

        this.$controls.find(".toc_link").on("click", function( ev ){
            _this.app.toc.jump(ev);
        });

        this.$controls.find('.button-next').click(function(){
            _this.app.next();
        });

        this.$controls.find('.button-toc').click(function(){
            _this.app.toc.toggle();
        });

        $('#preload').find('.toggleFullScreen').click(function() {
            _this.togglefullscreen();
        });
        
        

    }
});

StoryUiPlayer.type = 'ui';
StoryUiPlayer.resources = [
    'style.css'
];
