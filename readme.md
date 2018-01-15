## Story Framework

######_This is an archived project from 2014. It is showcased here for inspiration, and because I think this was a cool idea, that in many respects is still a great approach for the usage scenario._

A SCORM-compatible web presentation framework using [GSAP](https://greensock.com/gsap) animation definitions, flexible translation templates and art directable components. 
The scheme of the presentation content enables it to be generateable/composable. 
It was designed to supply content for e-learning platforms and courses, kiosks and microsite campaigns.

####The supplied example presentation is only barebones for easier understanding (and contractual obligations :P) but I compiled a **[demo reel video](https://github.com/poisonborz/story_framework/raw/master/showcase.mp4)** with the possibilities.



####Quick Guide
The framework consists of a scaffolding (preloader, selectable components like control UI, interactive exam, displayed on an autoscaled 1000x660px stage) 
and training content (media assets, styling, translated templates and animation definitions).


#####Overall structure

The presentation is structured this way:

* Story

  - Chapters ( thematic collection of scenes)
  
    - Scenes ("slides", a topical collection of elements)
      
       - States (separated paused states of movement, like stopgaps for a description to appear, or selectable states like clickable buttons with tooltips)
              
 
 #####Content
 The content folder supplies all the assets needed for the presentation.
 
 
* Media (images/videos/sounds/styles) in their respective folder

* Component resources (like exam questions in xml format)
* Translated templates in html, a master.html and translations in langcode-named html files. Contains a #meta element with contextual info, 
and template data with a .chapter -> .scene -> .state structure. All elements have identifying id-s and this data also establishes the structure of the presentation.
* Settings (like display mode, Anaytics tracking code etc) in json format
* Animation definition in a js object. Properties are scene id-s, and they _optionally_ contain an **in** and **out** property and **states**.
Each such object contains a GSAP timeline with the elements on the scene/state. Each scene with states can be played back in 3 modes: linear, nonlinear (states can be played independently, like on a button press) 
and nonlinear centered (each state play will trigger a reverse animation for the previously played state). The animation definition can also define interactive elements (eg. buttons) and what effect they make on the timeline.
Upon loading, the timelines defined here are then merged to an all-encompassing Story timeline, and then played.
