
var StoryTrigger = PlayerClass.extend({
    init: function ($elem,data,context) {
        this.scene = context;
        this.data = data[$elem.prop('id')];
        this.states = [];

        var _this = this,
            clickevent = function(handler) {
                $('#' + $elem.prop('id')).on('click.StoryTrigger', function (e) {
                    handler(e,$elem,context)
                });
            };

        $.each(this.data ? this.data : {},function(state,handler) {

            if (state == 'all') {

                $(document).on('qs-scene' + _this.scene.id + '-sceneshown',function () {
                    clickevent(handler)
                });

            } else {

                _this.states.push( parseInt(state) );

                $(document).on('qs-scene' + _this.scene.id + '-state' + state + '-stateshown',function () {
                    clickevent(handler)
                });

            }
        });

        if (context.animation.states) {
            $(document).on('qs-scene' + _this.scene.id + '-stateshown', function (e,scene,state) {
                if (_this.states.length && _this.states.indexOf(state) == -1) {
                    $('#' + $elem.prop('id')).off('click.StoryTrigger');
                }
            });
        }


        $(document).on('qs-scene' + _this.scene.id + '-scenehidden', function () {
            $('#' + $elem.prop('id')).off('click.StoryTrigger');
        });

    }
});
StoryTrigger.type = 'element';