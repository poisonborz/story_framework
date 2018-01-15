var PlayerExam = PlayerClass.extend({

	init: function(params) {
		this.examControl = params.control;
        this.questions = [];
		if (params.xml) {
			this.data = $(params.xml).find('qanda');
			this.desc = this.data.attr('description');
			this.id = parseInt(this.data.attr('trainingId'),10);
			this.points = parseInt(this.data.attr('points'),10);

            this.loadxml();

		} else if (params.json) {

			this.loadJSON(params.json);

		}
	},

	shuffleAnswers: function (q) {
		var a = q.answers;
	    for (var i = a.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = a[i];
	        a[i] = a[j];
	        a[j] = temp;
	    }
	    return a;
	},

	loadJSON: function(jsonq) {
		for (var x in jsonq) {
			var sq = jsonq[x];
			var q = {
				qid: sq.id,
				question: sq.question,
				hinttext: sq.hint,
				successtext: sq.success,
				correctid: null,
				answeredid: null,
				answers: []
			};

			for (var ai in sq.answers) {
				var a = {
					id: sq.answers[ai].id,
					text: sq.answers[ai].answer
				};

				if (sq.answers[ai].correct) {
					q.correctid = a.id;
				}

				q.answers.push( a );
			}

			q.answers = this.shuffleAnswers(q);

			this.questions.push(q);
		}
	},

	loadxml: function() {
		var _this = this;

		// in-scene-exams/stepquestions ignored for now
		this.data.find('examquestion').each(function() {

			var q = {
				qid:0,
				question:$(this).find('question').text(),
				hinttext:$(this).find('hint').text(),
				successtext:$(this).find('success').text(),
				correctid:null,
				answeredid:null,
				answers:[]
			};

			$(this).find('answer').each(function() {
				var a = {
					id: $(this).attr('id'),
					text: $(this).text()
				};

				if ($(this).attr('correct')) {
					q.correctid = a.id;
				}

				q.answers.push( a );
			});

			q.answers = _this.shuffleAnswers(q);

			//_this.questions[$(this).attr('id')] = q; // no...
			_this.questions.push(q);

		});

	},

	getresults: function() {
		var _this = this;
		var r = 0;
		$.each(this.questions,function() {
			if ( this.answeredid && this.answeredid === parseInt(this.correctid,10) ) {
				r++;
			}
		});
		return Math.round((r / this.questions.length) * 100);
	},

	setScormScore: function () {
		var userScore = 0;
		$.each(this.questions,function() {
			if ( this.answeredid && this.answeredid == this.correctid ) {
				userScore++;
			}
		});
		this.examControl.app.scorm.setScore(0, this.questions.length, userScore);
	},

	postScormAnswersPlatinum: function () {
		var fakeExamObj = {};
		fakeExamObj.questions = [];
		for (var i = 0; i < this.questions.length; i++) {
			fakeExamObj.questions.push({
				id : this.questions[i].qid,
				answered_aid : this.questions[i].answeredid,
				step : 0
			});
		}
		this.examControl.app.scorm.setExamAnswers(fakeExamObj);
	},

	getScormResultPlatinum: function () {
		var result = this.examControl.app.scorm.getExamResult();
		if (result) {
			result = $.parseJSON(result);
		}
		return result;
	},

	finish: function() {
		// post scorm data
		// --> was added to PlayerExamController.finish()
	}

});



var PlayerExamController = PlayerClass.extend({

	init: function(params) {
		this.app = params.app;
		this.exam = null;
		this.$root = $('#exam');

		this.questionsRight = [];
		this.questionsWrong = [];
		this.score = 0;

		this.currentQuestionid = 0;
		this.currentAnswerid = null;
		this.currentTl = null;

        var _this = this;

        if (device.isie8) {
            this.$root.hide()
        }

        if (_this.app.disableExam) {
            return false
        }

        if (_this.app.localExamInsteadOfScorm) {
            //load exam from XML file
            $.get('content/exams/' + _this.app.textnode + '.xml', 'xml')
                .done(function(data) {
                    PlayerLog('info', 'Local exam loaded' );
                    _this.exam = new PlayerExam( { xml : data, control : _this } );
                })
                .fail(function(data) {
                    PlayerLog('info', 'No exam found: ' + data );
                });
        } else {
            PlayerLog('info','Try to load exam from LMS');
            var qa = _this.app.scorm.getQA();
            _this.exam = new PlayerExam( { json : qa, control : _this } );
        }

	},

	start:function() {
		var _this = this;

        if (device.isie8) {
            this.$root.show()
        }

		$('body').addClass('exam');
		_this.$root.css('height','100%');

		//question answer elements
		var answanim = false;


        var $whitemask = _this.$root.find('.whitemask');
        function maskcalc() {
            var w = ($(window).width()/$whitemask.width())+.18,
                h = ($(window).height()/$whitemask.height())+.18;
            return Math.max(w,h)
        }

        $whitemask.css('transform','scale(' + maskcalc() + ')');
        $(window).resize(function() {
            $whitemask.css('transform','scale(' + maskcalc() + ')');
        });

        //TODO make this faster and more straightforward
        _this.$root.find('.report .feedback .trigger span').text(_this.$root.find('.buttontextFeedback').text());
        _this.$root.find('.report .feedback .send').text(_this.$root.find('.buttontextFeedbacksend').text());
        _this.$root.find('.report .resultlist .trigger p').text(_this.$root.find('.buttontextReview').text());


        this.$root.on('mousedown','.answerWrap',function() {

			if (answanim || $(this).parent().find('.check').length) return false;

            var tl_a = new TimelineMax({paused:true }),
                $newAnswer = $(this).parent(),
                $formerAnswer = $newAnswer.parent().find('.check').parent(),
				origcolor = $newAnswer.find('.answerWrap').css('background-color');

			tl_a.add("OpenStart")
				.call(function() { answanim = true })
            	.set($newAnswer,{backgroundColor:'rgb(84,167,218)'})
				.call(function() {
					$newAnswer.append('<div class="check"><p>' + _this.$root.find('.buttontextCheck').text() + '</p></div>');
				});

			tl_a
				.to($newAnswer.find('.answerWrap'),.25,{opacity:.2,ease:Linear.easeNone})
				.to($newAnswer.find('.answer'),.1,{color:'rgb(84,167,218)'})
				.to($newAnswer,1,{ height: Math.floor($(this).outerHeight()) + 45, ease: Elastic.easeOut.config(1, 0.3) },'OpenStart')
				.to($newAnswer.find('.answerWrap'),.3,{opacity:1,ease:Linear.easeNone},'OpenStart');

            if ($formerAnswer.length) {
                tl_a
					.to($newAnswer.find('.answerWrap'),.25,{opacity:1,ease:Linear.easeNone},'OpenStart')
				    .to($formerAnswer,.3,{height:$formerAnswer.outerHeight() - 45 },'OpenStart')
					.to($formerAnswer.find('.answer'),.1,{color:'rgb(140,140,140)'},"OpenStart")
                    .to($newAnswer.find('.answerWrap'),.3,{backgroundColor:origcolor},'OpenStart')
				    .call(function() {
						$formerAnswer.find('.check').remove();
					},null,null,"OpenStart+=1");
            }

            tl_a
            	.set($newAnswer,{backgroundColor:'none'})
				.call(function() { answanim = false });

            tl_a.play();

		});

		//check button
        this.$root.on('click','.check',function() {
        	_this.currentAnswerid = $(this).parent().data('id');
			_this.currentTl.play();
        });

		//prompt continue/finish button
        this.$root.on('click','.progress',function() {
            _this.currentTl.play();
        });

		if (_this.app.analytics) {
			_this.app.analytics.pageview('Exam');
		}


		//init screen
		_this.showPrompt({
			isQuiz:false,
			titletext:_this.$root.find('.messageStart').text(),
			buttontext:_this.$root.find('.buttontextNext').text(),
			callback: function(){ $('#story, #controls').hide() }
		})

	},

	showReport: function(args) {

		var $root = this.$root.find('.report'),
			$doodle = $root.find('.doodle .wrap'),
			$circles = [$root.find('.fill0'),$root.find('.fill1'),$root.find('.fill2')],
			tl = new TimelineMax({paused:true}),
			iscurrent = true,
			_this = this;

		this.currentTl = tl;

        TweenMax.set($root.children(), {clearProps:"all"});

		$root.show();

		//TODO this to clearprop
		tl
			.set($root,{height:'100%',opacity:0})
			.set($root.find('.anim'),{scale:0,opacity:0})
			.set($doodle.find('.circle'),{scale:0})
			.set($root.children().add($doodle.children()),{ scale: 0})
			.set($root.find('.doodle').add($root.find('.radial-progress')),{ scale: 1})
			.set($root.find('.fill0,.fill1,.fill2'),{ rotation:0 } )
			.set($root.find('.report .resultlist ul'),{opacity:0, height:0})
			.set($root.find('.report .star'),{opacity:0, scale:1})
			.set($root.find('.report .message'),{opacity:0 })
			.set($root.find('.report .score'),{opacity:0 })
			.set($root.find('.report .feedback'),{opacity:0 })
            .set($root.find('.resultlist .trigger'),{display:"none"});

            if (device.isie8) {
                tl.set($root.find('.mask.full').first(),{width:0});
                tl.set($root.find('.mask.half').first(),{width:0});
            }


        tl.add("intro");


		if ( !_this.isFinished() ) {

			//entering
			if (args.standalone) {
				tl.to($root,.3,{opacity:1});
				tl.to($doodle.find('.circle'),1.6,{scale:.1,ease: Elastic.easeOut.config( 1, 0.3)});
			} else {
				tl.set($root,{opacity:1});
				tl.set($doodle.find('.circle'),{scale:.19});
			}

            //doodle
            var currentquestioncat = 0;
            var doodleid = presetanimExam[currentquestioncat] ? currentquestioncat : 0,
                tl_i = new TimelineMax({
                    paused:true,
                    onComplete:function() { if (iscurrent) { this.restart() } }
                });

            $doodle.find('.anim').html($('#exam').find('.template:eq(' + doodleid + ') .icon').html());
            presetanimExam[doodleid].icon.apply( null,[tl_i,$doodle] );
            tl_i.play();
            tl.to($doodle.find('.anim'),2.5, {scale:1, opacity:1, ease: Elastic.easeOut.config(1, 0.5)});
			tl.call(function() { showcircles( tl, 3.5) },null,null,"-=2");

		} else {

            _this.exam.setScormScore();
            _this.exam.postScormAnswersPlatinum();

			tl
                .set($root,{opacity:1})
                .set($root.find('.result, .resultlist'),{scale:1})
                .set(_this.$root.find('.report .result .score'),{scale:.6});

            if (_this.exam.getresults() < 60) {
                //failed fully
                _this.$root.find('.report .result .message p').text(_this.$root.find('.messageFail').text());
                _this.app.scorm.setStatus('failed');
            } else if  (_this.exam.getresults() < 80) {
                //failed
                _this.$root.find('.report .result .message p').text(_this.$root.find('.messageNotpass').text());
                _this.app.scorm.setStatus('failed');
            } else {
                //passed
                _this.$root.find('.report .result .message p').text(_this.$root.find('.messageFlawless').text());
                _this.app.scorm.setStatus('passed');
            }


			//score calculation
			if (!this.examControl.app.settings.localExamInsteadOfScorm) {
                _this.score = _this.app.exam.getScormResultPlatinum().points;
			} else {
                _this.score = 100 * _this.questionsRight.length;
			}


            var scoretimeformula = 6000 * (_this.score / 1000);
			tl
                .to(_this.$root.find('.report .result .star1'),.3,{opacity:1})
                .to(_this.$root.find('.report .result .star2'),.3,{opacity:1},'-=.1')
                .to(_this.$root.find('.report .result .star3'),.3,{opacity:1},'-=.1')
				.call(function() {showcircles(tl,0);})
                .call(function() {
                    TweenMax.to(_this.$root.find('.report .result .score'),scoretimeformula / 1000,{scale:1});
                    TweenMax.to(_this.$root.find('.report .result .score'),1,{opacity:1})
                })



                .call(function() {
                    var phases = [false, false, false, false],
                        maxScore = _this.examControl.app.settings.localExamInsteadOfScorm ? 1000 : 100 * _this.exam.questions.length;

                    $root.find('.score').animate({
                        Counter: _this.score
                    }, {
                        duration: scoretimeformula,
                        step: function (now) {
                            $(this).text(Math.ceil(now));

                            if (!phases[0] && Math.ceil(now) >= maxScore * .6) {
								phases[0] = true;
                                tl
                                    .to(_this.$root.find('.report .result .star1'), .5, {scale: 1.4, ease: Power1.easeIn })
                                    .call(function () {
                                        _this.$root.find('.report .result .star1').addClass('filled');
                                    })
                                    .to(_this.$root.find('.report .result .star1'),.8, {scale: 1, ease: Elastic.easeOut.config(1, 0.3) })
                            }

                            if (!phases[1] && Math.ceil(now) >= maxScore * .8) {
								phases[1] = true;
                                tl
                                    .to(_this.$root.find('.report .result .star2'), .5, { scale: 1.4, ease: Power1.easeIn })
                                    .call(function () {
                                        _this.$root.find('.report .result .star2').addClass('filled');
                                    })
                                    .to(_this.$root.find('.report .result .star2'),.8, { scale: 1,ease: Elastic.easeOut.config(1, 0.3) })
                            }

                            if (!phases[2] && Math.ceil(now) == maxScore) {
								phases[2] = true;
                                tl
                                    .to(_this.$root.find('.report .result .star3'), .5, { scale: 1.4, ease: Power1.easeIn})
                                    .call(function () {
                                        _this.$root.find('.report .result .star3').addClass('filled');
                                    })
                                    .to(_this.$root.find('.report .result .star3'),.8, {scale: 1,ease: Elastic.easeOut.config(1, 0.3) })
                            }


                            if (!phases[3] && Math.ceil(now) == _this.score) {
								phases[3] = true;

                                //after the jquery anim
                                tl
                                    .to(_this.$root.find('.report .result .score'),.6,{color:'rgb(84,167,218)'})
                                    .to(_this.$root.find('.report .result .message'),.6,{opacity:1},'+=.4')

								if (_this.questionsWrong.length && !device.isie8) {
									tl
										.to($root.find('.result'),1,{scale:.45,top:device.isphone ? -61 : 0,bottom:'auto'})
										.to($root.find('.radial-progress'),1,{scale:.45,top:-55,bottom:'auto'},'-=1')
                                        .set($root.find('.resultlist .trigger'),{display:"block"})
										.to($root.find('.resultlist .trigger'),1,{opacity:1});
								}

								if (device.isie8) {
                                    tl.to($root.find('.radial-progress'),1,{top:'-=700'});
                                    tl.to($root.find('.result .wrap > *').not('.score'),1,{y:'-=700'});
                                    tl.to($root.find('.score'),1,{y:'-=280',fontSize:65},'+=.5');

                                    tl.call(function() { $root.find('.resultlist').show() })
                                    tl.to($root.find('.resultlist .trigger'),1,{opacity:1,display:'block'});
								}

                                if (!_this.examControl.app.settings.showFeedbackAtEnd) {
                                    // there will be no feedback at the end, scores set, LMS can save and quit
                                    _this.app.scorm.saveScorm();
                                    _this.app.scorm.quitScorm();
                                } else {
                                    tl.set($root.find('.feedback'),{scale:1});
                                    tl.to($root.find('.feedback'),1,{opacity:1});

                                    if (device.isie8) {
                                        tl.call(function() { $root.find('.feedback').show() })
                                    }
                                }

								_this.$root.find('.resultlist .trigger').click(function() {

									TweenMax.to($(this),.6,{opacity:0});

									$.each(_this.questionsWrong,function(i,qid){
										_this.$root.find('.resultlist ul').append('<li><p class="q">' + _this.exam.questions[qid].question + '</p><p class="a">' +  $.grep(_this.exam.questions[qid].answers, function(e){ return e.id == _this.exam.questions[qid].answeredid })[0].text + '</p></li>');
									});

									TweenMax.set($(this),{display:'none'});
									TweenMax.to(_this.$root.find('.report .resultlist ul'),1.5,{height:device.isphone ? 225 : 310, onComplete:function() {
										TweenMax.set(_this.$root.find('.report .resultlist ul'),{overflow:'auto'});
									}});


								});



								var open = false,
									messagesent = false;

								_this.$root.find('.feedback .trigger').click(function() {

									if (messagesent) return false;

									if (open) {
										TweenMax
											.to(_this.$root.find('.feedback'),.8,{
												bottom: device.isie8 ? -75 : -65,
												onComplete: function() {
													_this.$root.find('.feedback').removeClass('open')
												}
											});
										open = false;
									} else {
										TweenMax
											.to(_this.$root.find('.feedback'),.8,{
												bottom:135,
												ease:Back.easeOut.config(1),
												onComplete:function() {
													_this.$root.find('.feedback').addClass('open');
												}
											});
										open = true;
									}
                                });

								_this.$root.find('.feedback .send').click(function() {
									_this.app.scorm.sendComment($("#feedbackText").val());

									// feedback is sent, that's the last possible action, LMS can save and quit
									_this.app.scorm.saveScorm();
									_this.app.scorm.quitScorm();
									messagesent = true;
									TweenMax
										.to(_this.$root.find('.feedback'),1,{
											bottom:-65,
											onComplete:function() {
												_this.$root.find('.feedback').removeClass('open');
												_this.$root.find('.feedback .trigger span').text($('.messageThanks').text());
												_this.$root.find('.feedback').css('opacity',.4);
											}
										})
								});

                            }
                        }
                    });
                });

		}


        //called independently
        function showcircles(tl,before) {
            tl.fromTo($circles[0], 0.5, { rotation:0 },{ rotation:180, ease:Quad.easeOut },'-=' + before);


            if (!device.isie8) {

                if (_this.questionsRight.length) {
                    tl.fromTo($circles[1], 0.75, { rotation:0 },{ rotation:180*(_this.questionsRight.length/_this.exam.questions.length), ease:Quad.easeInOut },"-=" + (before));
                }

                if (_this.questionsWrong.length) {
                    tl.fromTo($circles[2], 0.75, { rotation:0 }, { rotation:180*(_this.questionsWrong.length/_this.exam.questions.length), ease:Quad.easeInOut },"-=" + (before));
                }

            } else {
                if (_this.questionsRight.length) {
                    tl.fromTo(_this.$root.find('.mask.full').first(), 0.75, { width:0 },{ width:400*(_this.questionsRight.length/_this.exam.questions.length), ease:Quad.easeInOut },"-=" + (before));
                }

                if (_this.questionsWrong.length) {
                    tl.fromTo(_this.$root.find('.mask.half').first(), 0.75, { width:0 }, { width:400*(_this.questionsWrong.length/_this.exam.questions.length), ease:Quad.easeInOut },"-=" + (before));
                }
            }

        }


        tl.add("middle");


		if ( !_this.isFinished() ) {

			//waiting
			tl.to('',2.5,{},0);

			//outro
			tl
			    .to($doodle.find('.circle'),.8,{scale:5,ease: Expo.easeIn})
				.to($doodle.find('.anim'),.6,{scale:1.6,opacity:0},"-=1")
				.call( function() { iscurrent = false; } )
				.call(function() { _this.showQuestion() },null,null,"-=.9")
				.to('',1,{})
				.set($root,{height:0})
                .call(function() { tl_i.pause() })
		}


		tl.play()



	},

	showQuestion: function() {
		var _this = this;

		var $root = _this.$root.find('.quiz'),
			$doodle = $root.find('.anim'),
			tl = new TimelineMax({paused:true}),
			iscurrent = true,
			tl_answ = new TimelineMax({paused:true}),
            tl_m = new TimelineMax({paused:true}),
            resulttexts = getMessagetext();


		function getMessagetext() {

			function sentences(text) {
				var tmp = text.match(/.*?(\.\s|\!\s|\?\s)/g),
					rest = text.replace(tmp[0],'');

				return [tmp[0], rest]
			}

			var gsentences = sentences(_this.exam.questions[_this.currentQuestionid].successtext),
				bsentences = sentences(_this.exam.questions[_this.currentQuestionid].hinttext),
				gtitle = gsentences[0],
				btitle = bsentences[0];

			gsentences[0] = '';
			bsentences[0] = '';

			return {
				titleGood: gtitle,
				titleBad: btitle,
				textGood: gsentences.join(' '),
				textBad: bsentences.join(' ')
			}

		}

		this.currentTl = tl;

		tl.set($root.find('.scenery'),{height:'100%'});

		$root.find('.scenery .title').text(_this.exam.questions[_this.currentQuestionid].question).data('id',_this.currentQuestionid);

		$root.find('.answers').html('');
		$.each( _this.exam.questions[_this.currentQuestionid].answers, function(i,val) {
			$root.find('.answers').append( '<li data-id="' + val.id + '" class="answer' + i + '"><div class="answerWrap"><p class="answer">' + val.text + '</p></div></li>');
		});
		tl_answ.set($root.find('.answers li'),{height:0});
		tl_answ.play();


        var currentquestioncat = 0;
		var doodleid = presetanimExam[currentquestioncat] ? currentquestioncat : 0,
			tl_i = new TimelineMax({paused:true });


		tl
			.set($root,{height:"100%",overflow:"auto",opacity:0})
			.call(function() {
				$doodle.html($('#exam').find('.template:eq(' + doodleid + ') .banner').html());
				presetanimExam[doodleid].banner.apply( null,[tl_i,$doodle] );
				tl_i.play();
			})

			.to($root,.6,{opacity:1,ease: Expo.easeIn})
            .add("introstart")
			.to('',1,{})
			.to($root.find('.scenery'),2.6,{height:device.isphone ? 160 : 290,ease: Elastic.easeOut.config(1, 0.4)});

		tl.call(function() {
			$.each($root.find('.answers li'),function(i,val) {
				$(this).css('height','auto');
				tl_answ
					.from(val,2,{height:0,ease:  Elastic.easeOut.config(1.2, 0.3)},!i ? 0 : (i *.15))
				 	.from($(val).find('.textWrap'),1.2,{ backgroundColor:"rgb(84,167,218)"})
			});
		},null,null,"-=2");
        tl.add("introend");

		tl.call(function() {
			tl.pause();
		});

		//outro
		tl
            .set($root.find('.whitemask'),{zIndex:100,display:"block"})
			.set($root,{overflow:"hidden"})
            .to('',.3,{})
            .call(function(){

               tl_m
                    .to("#whitemaskMax",1, { morphSVG:"#whitemaskMin", ease: Quad.easeOut })
                    .call(function() {
                       tl_m.time(0);
                       tl_m.pause();
                    });
                tl_m.play()

            },[],null,'-=0.2')

            .to('',.9,{})
			.call(function() {
				var success = _this.answer();

				_this.showPrompt({
					isQuiz:true,
					isSuccess: success,
					titletext: success ? resulttexts.titleGood : resulttexts.titleBad,
					messagetext: success ? resulttexts.textGood : resulttexts.textBad,
					buttontext: _this.currentQuestionid+1 >= _this.exam.questions.length ? _this.$root.find('.buttontextFinish').text() : _this.$root.find('.buttontextNext').text()
				});

                if (!_this.isFinished()) {
                    ++_this.currentQuestionid;
                }

			},[],null,'-=0.2')

			.to('',.6,{},0)
			.to($root,.6,{opacity:0})
            .set($root.find('.whitemask'),{display:'none'})
			.call(function() {
				tl_i.pause();
				tl.set($root,{height:0,overflow:"hidden"});
				iscurrent = false;

			});

		tl.play();

	},


	showPrompt: function(args) {
		var $root = this.$root.find('.prompt'),
			tl = new TimelineMax({paused:true}),
			args = args ? args : {},
            _this = this;

		this.currentTl = tl;

        TweenMax.set($root.children(), {clearProps:"all"});

        $root.removeClass('note false true');
		$root.addClass(args.isSuccess === true ? 'true' : args.isSuccess === false ? 'false' : 'note').show();
		$root.find('.icon').removeClass('filled');

        $root.find('.title').text(args.titletext);
		$root.find('.description').text(args.messagetext);
		$root.find('.progressText').text(args.buttontext);


		tl
			.set($root,{height:"100%"})
			.set($root.find('.circle'),{scale:0})
			.set($root.find('.tick'),{scaleY:0})
            .set($root.find('.ticks'),{opacity:1})
			.set($root.find('.iconBack'),{display:'none'});

        if (device.isie8) {
            tl.set($root.find('.bck'),{height:0});
        }

		if (args.isQuiz) {

			tl
                .set($root.find('.t1'),{rotation:args.isSuccess ? '37deg' : '45deg'})
                .set($root.find('.t2'),{rotation:args.isSuccess ? '-53deg' : '-45deg'})
				.add("exitlabel");

				if (!device.isie8) {
                    tl
                       .to($root.find('.bck'),.75,{scale:2,ease:Quad.easeIn},"exitlabel")
                       .to($root.find('.circle'),3,{scale:1,ease:Elastic.easeOut.config( 1, 0.3)},'exitlabel+=0')
                       .to($root.find('.bck'),1.5,{scale:30, ease:Quad.easeOut},'exitlabel+=0.75')
				} else {
                    tl
                        .to($root.find('.bck'),1.2,{height:1000})
				}



            tl
				.to($root.find('.t1'),.1,{scaleY:1, ease:Circ.easeIn},'exitlabel+=0.3')
				.to($root.find('.t2'),.05,{scaleY:1,ease:Circ.easeOut},'exitlabel+=0.5')
				.to($root.find('.icon'),.6,{y:'-=120',ease:Circ.easeInOut},'exitlabel+=1.6')
				.to($root.find('.' + args.isSuccess ),.6,{y:'-=100'},'exitlabel+=2')
				.set($root.find(args.isSuccess ? '.success' : '.fail'),{display:'block',opacity:1},'exitlabel+=2')
				.to($root.find('.message'),.6,{opacity:1},'exitlabel+=2')
				.set($root.find('.progress'),{width:200,opacity:1,display:"block"},'exitlabel+=2.6')
				.set($root.find('.progress'),{background:'#fff'},'exitlabel+=2.6')
                .call(function() {
                    TweenMax.to($root.find('.f'),1,{width:0,ease: Bounce.easeOut})
                },[],this,'exitlabel+=2.6')

		} else {

			tl
                .set($root.find('.progress'),{opacity:0})

                if (!device.isie8) {
                    tl.set($root.find('.bck'),{scale:30,opacity:0})
                    tl.to($root.find('.bck'),.6,{opacity:1})
                } else {
                    tl.to($root.find('.bck'),1.2,{height:1000})
                }

            tl
                .set($root.find('.progress'),{width:200,opacity:1})
				.set($root.find('.progress'),{background:'#fff'},'+=.3')
				.to($root.find('.message'),.6,{opacity:1},'+=.3')
                .call(function() {
                    TweenMax.to($root.find('.f'),.75,{width:0,ease: Bounce.easeOut})
                },[],this,'+=.3')

		}

		tl.call( function() {
			tl.pause();

			if (args.callback) {
				args.callback();
			}
		});



		//outro
		if (args.isQuiz) {

			tl
				.add("Outro_begin")
				.to($root.find('.f'),.5,{width:"50%",ease:Quad.easeIn},"Outro_begin")
			  	.call(function() { $root.find('.icon').addClass('filled') },null,null,"Outro_begin")
			  	.to($root.find('.message'),.4,{opacity:0},"Outro_begin")
				.set($root.find('.progress'),{display:"none"})
				.to($root.find('.bck'),.5,{opacity:0},'Outro_begin+=.2')
				.to($root.find('.icon'),.6,{y:0, ease:Quad.easeInOut},'Outro_begin');

				if (  _this.currentQuestionid+1 >= _this.exam.questions.length ) {
                    tl
                        .to($root.find('.circle'),.6,{scale:0},'Outro_begin')
                        .to($root.find('.icon'),.6,{scale:0},'Outro_begin')
				} else {
                    tl
                        .to($root.find('.icon'),.6,{width:190,height:190},'Outro_begin')
                        .to($root.find('.circle'),.6,{scale:0},'Outro_begin')
				}

				tl

					.to($root.find('.ticks'),.1,{opacity:0},'Outro_begin+=.3')
					.to($root.find('.icon'),1,{backgroundColor:'rgb(70,215,109)'},'Outro_begin+=.2')

		} else {

			tl
                .to($root.find('.f'),.6,{width:"50%"})
                .to($root.find('.message'),.6,{opacity:0},'-=.3')
                .set($root.find('.progress'),{width:0,opacity:0})

              if (!device.isie8) {
                  tl.to($root.find('.bck'),1.2,{width:190,height:190,scale:1})
                  tl.to($root.find('.bck'),1,{backgroundColor:'rgb(70,215,109)'},'-=.7')
              } else {
                  tl.to($root.find('.bck'),1.2,{height:0})
              }


		}

        tl.call(function() {
            _this.showReport({standalone:false});
            //tl.to('',.2,{});
            tl.set($root,{height:0});
            _this.currentAnswerid = null;
        });

		tl.play();

	},

	isFinished: function() {
	    return this.currentQuestionid > this.exam.questions.length-1;
	},

	answer: function() {
		var _this = this;

		_this.exam.questions[_this.currentQuestionid].answeredid = _this.currentAnswerid;

		if (_this.exam.questions[_this.currentQuestionid].answeredid === parseInt(_this.exam.questions[_this.currentQuestionid].correctid,10)) {
            this.questionsRight.push(_this.currentQuestionid);
			return true
		} else {
			this.questionsWrong.push(_this.currentQuestionid);
			if (_this.app.analytics) {
				_this.app.analytics.event('exam','failed','QID_' + _this.currentQuestionid + ' ' + _this.exam.questions[_this.currentQuestionid].question)
			}
			return false
		}

	}
});

