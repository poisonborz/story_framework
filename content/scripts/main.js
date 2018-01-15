//describes scene state animations for root scene items
var storyAnimations = {

    simpleInout: {

        in: function (tl,scene) {

            var $e1 = $('#inout_lolli');
            var $e2 = $('#inout_sun');

            tl
                .fromTo($e1, 0.5, {y:"-50px",autoAlpha:0},{autoAlpha:1, ease:Sine.easeOut})
                .to($e2, 1.6, {y: 200, scale: 2, ease: Bounce.easeOut}, -0.4)
                .to($e1, 2.1, {x:400, y: 300, rotation: "120deg"},-0.5)

        },
        out: function (tl) {
            tl
                .to($('#inout_lolli'), 0.6, {scale: 1.6, y: '+=40', autoAlpha: 0})
                .to($('#inout_sun'), 0.6, {scale: 1.6, y: '+=40', autoAlpha: 0})
        }
    },


    linearInout: {
        in: function (tl,scene) {
            tl
                .fromTo($('#linin_sun'), .4, {y: 0}, {y: '-420'})
                .fromTo($('#linin_brick'), .4, {autoAlpha: 0}, {autoAlpha: 1})
        },

        states: {
            0: function (tl,scene) {
                tl
                    .fromTo($('#linin_sun'), .4, {scale: 2, autoAlpha: 0}, {scale: 1, x: '130', autoAlpha: 1})
                    .fromTo($('#linin_house'), .4, {rotation: "190deg", scale: 0.6, autoAlpha: 0}, {
                        scale: 1,
                        rotation: 0,
                        autoAlpha: 1
                    })
                    .to($('#linin_brick'), .4, {x: '+=100', scale: 1.3})
            },

            1: function (tl,scene) {

                tl
                    .to($('#linin_brick'), .4, {x: '+=100', scale: 1.6})
            },

            2: function (tl,scene) {
                tl
                    .fromTo($('#linin_lolli'), 0.6, {autoAlpha: 0}, {x: "-80", rotation: '50deg', autoAlpha: 1})
                    .to($('#linin_brick'), .4, {x: '+=100', scale: 1.9, autoAlpha: 0})
            }

        },

        out: function (tl,scene) {

            tl
                .to($('#linin_sun'), 0.4, {x: "+=120", autoAlpha: 0})
                .to($('#linin_house'), 0.4, {x: "+=120", autoAlpha: 0})
                .to($('#linin_lolli'), 0.4, {x: "+=120", autoAlpha: 0})

        }

    },

    nonlinearUnwrap: {

        mode: 'nonlinear-unwrap',

        in: function (tl,scene) {
            tl
                .fromTo($('#nonunw_crystal'), .4, {rotation: "20deg", autoAlpha: 0}, {rotation: 0, autoAlpha: 1})
                .fromTo($('#nonunw_brick'), .4, {rotation: "20deg", autoAlpha: 0}, {rotation: 0, autoAlpha: 1})
                .fromTo($('#nonunw_house'), .4, {rotation: "20deg", autoAlpha: 0}, {rotation: 0, autoAlpha: 1})
        },

        states: {
            0: function (tl,scene) {
                tl
                    .to($('#nonunw_crystal'), .4, {y: "+=100"})
            },

            1: function (tl,scene) {
                tl
                    .to($('#nonunw_brick'), .4, {y: "+=100"})
            },

            2: function (tl,scene) {
                tl
                    .to($('#nonunw_house'), .4, {y: "+=100"})
            }

        }
    },

    nonlinearCentered: {

        mode: 'nonlinear-centered',

        in: function (tl,scene) {
            tl
                .fromTo($('#nlc_house'), .4, {rotation: "-40deg", x: "+=20", autoAlpha: 0}, {
                    x: 0,
                    rotation: 0,
                    autoAlpha: 1
                })
                .fromTo($('#nlc_lolli'), .4, {rotation: "-40deg", x: "+=20", autoAlpha: 0}, {
                    x: 0,
                    rotation: 0,
                    autoAlpha: 1
                })
                .fromTo($('#nlc_towers'), .4, {rotation: "-40deg", x: "+=20", autoAlpha: 0}, {
                    x: 0,
                    rotation: 0,
                    autoAlpha: 1
                })
        },

        states: {
            0: function (tl,scene) {
                tl
                    .to($('#nlc_house'), 1.4, {y: "+=240", rotation: '260deg', ease:Elastic.easeOut.config(1.5, 0.75)})
            },

            1: function (tl,scene) {
                tl
                    .to($('#nlc_lolli'), 1.4, {y: "+=240", rotation: '260deg', ease:Elastic.easeOut.config(1.5, 0.75)})
            },

            2: function (tl,scene) {
                tl
                    .to($('#nlc_towers'), 1.4, {y: "+=240", rotation: '260deg', ease:Elastic.easeOut.config(1.5, 0.75)})
            }

        }
    }

};

var storyModuledata = {

    'StoryTrigger': {

        'videoplay': {
            all: function (e,$elem) {
                $elem.data('target').playpause();
            }
        },

        'simple': {
            all: function () {
                console.log('gb s1');
            }
        }

    }

};


//callback examples
$(document).on('qs-sceneshown', function (statename, $root) {
    console.log( 'Scene shown' )
});