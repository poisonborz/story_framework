
var FontMyriad = PlayerClass.extend({
    init:function($elem,data,context){
       try {  Typekit.load({  loading: null,active: null,inactive: null }); } catch(e) { }
    }
});

FontMyriad.resources = [
    '//use.typekit.net/isq0nfb.js'
];
FontMyriad.type = 'global';
