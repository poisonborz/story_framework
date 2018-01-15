
//preset animations

var presetanimStory = {

	"readerIn": function(tl,control){

        var stuff = $(this);
        tl.add("IntroStart",0.5);
        this.find("video").show();
        tl.fromTo(this,1,{autoAlpha:0,y:"100px"},{autoAlpha:1,y:"0", ease:Power2.easeOut},"IntroStart");
        tl.add("IntroEnd");
	},

	"readerOut": function(tl,control) {

		var stuff = $(this);
        tl.add("OutroStart");
        this.find("video").hide();
		tl.to(this, 0.25,{autoAlpha:0, y:"-300px", ease:Quad.easeIn},"-=0");
		//halftime anim: reset container
        tl.add("OutroEnd");
        tl.call(function() {
            $("html, body").scrollTop(0);
        });

	},

	"slideIn": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("presetStart")
		    .fromTo(this,1,{autoAlpha:0,y:"100px"},{autoAlpha:1,y:"0", ease:Power2.easeOut},"presetStart")
		    .staggerFromTo(stuff, 0.7, {autoAlpha:0, y:"300px"},{autoAlpha:1,y:"0", ease:Quad.easeOut},0.1,"presetStart")
            .add("presetEnd");
	},

	"slideOut": function(tl,targets) {
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');

        tl
            .add("presetStart")
		    .staggerTo(stuff, 0.4, {autoAlpha:0, y:"-100px", ease:Circ.easeIn},0.1,"presetStart")
		    .to(this, 0.4,{autoAlpha:0, y:"-300px", ease:Circ.easeIn},"presetStart+=0.4")
		    .set(stuff,{y:"0"})
            .add("presetEnd");
	},

	"zoomIn": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("presetStart")
		    .fromTo(this,0.85,{autoAlpha:0,transform:"scale(1.35)"},{autoAlpha:1,transform:"scale(1)", ease:Power2.easeOut},"presetStart")
            .staggerFromTo(stuff, 0.7, {autoAlpha:0, transform:"scale(1.35)"},{autoAlpha:1,transform:"scale(1)"},0.4,"presetStart")
            .add("presetEnd");
	},

	"zoomOut": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("presetStart")
		    .staggerTo( stuff, 0.7, {autoAlpha:0, transform:"scale(.65)", ease:Power2.easeIn}, 0.4, "presetStart" )
		    .to( this, 0.6, { autoAlpha:0, transform:"scale(.65)", ease:Power2.easeIn},"presetStart+=0.5")
            .add("presetEnd");
	},

	"contentSwitchIn": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("presetStart")
		    .fromTo(this,0.1,{autoAlpha:0},{autoAlpha:1},"presetStart")
		    .to(this, 0.25,{y:"0", ease:Quad.easeIn},"presetStart")
		    .staggerFromTo( stuff, 0.5, {autoAlpha:0, transform:"scale(.5)"},{autoAlpha:1, transform:"scale(1)" , ease:Power2.easeInOut},0.2,"presetStart")
            .add("presetEnd");
	},

	"contentSwitchOut": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("presetStart")
		    .staggerFromTo( stuff, 0.5, {autoAlpha:1, transform:"scale(1)"},{autoAlpha:0, transform:"scale(.5)", ease:Power2.easeInOut},0.2,"presetStart")
		    .fromTo(this,0.1,{autoAlpha:1},{autoAlpha:0},"presetStart")
            .add("presetEnd");

	},

    "noneIn": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("IntroStart","OutroStart")
            .set($(this).add(stuff),{autoAlpha:1}, "IntroStart")
            .add("presetEnd");

    },

    "noneOut": function(tl,targets){
        var stuff = $(this).find('.content > *').not('.state').not('[data-noanim]');
        tl
            .add("OutroStart")
            .set($(this).add(stuff),{autoAlpha:0},"OutroStart")
            .add("presetEnd");

    }
};



var presetanimExam = [
	{
		icon: function(tl,root) {
			var $td = root.find('#doodle_phone');

			tl.set($td,{top:55,left:89})
					.set($td,{rotation:-10})
					.to($td,0.5,{rotation:10,ease:Sine.easeInOut})
					.to($td,0.5,{rotation:-10,ease:Sine.easeInOut});

		},


		banner: function(tl,root) {


		}

	}
];
