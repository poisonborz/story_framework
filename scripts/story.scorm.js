var PlayerExamAnswer = PlayerClass.extend({
	init: function () {
		this.id = 0;
		this.answer = 'A';
		this.correct = false;
	}
});

var PlayerExamQuestion = PlayerClass.extend({
	init: function (params) {
		this.id = params && params.id ? params.id : 0;
		this.step = params && params.step ? params.step : 0;
		this.question = params && params.question ? params.question : 'Q';
		this.hint = params && params.hint ? params.hint : '';
		this.success = params && params.success ? params.success : '';
		this.answers = params && params.answers ? params.answers : new Array();
		this.answered = false;
		this.answered_aid = 0;
		this.answered_correct = false;
	},
	addAnswer: function (a) {
		this.answers.push(a);
	}
});

var PlayerSCORM = PlayerClass.extend({
	init: function (params) {
		this.app = params.app;
		this.scormRef = null;
		this.localExamInsteadOfScorm = this.app.settings.localExamInsteadOfScorm;
		this.sessionStart = new Date().getTime();
		this.storedSessionTime = 0;
	},
	initSCORM: function() {
		this.scormRef = pipwerks.SCORM.init();
		if (!this.scormRef) { // init can be false if training in popup is reloaded
			PlayerLog('info',"initSCORM reload?, version: " + pipwerks.SCORM.version + " found: " + pipwerks.SCORM.API.isFound);
			if (pipwerks.SCORM.API.isFound && pipwerks.SCORM.version) {
				// ASSUME iniz failed because reloading, so fake a successful init
				this.scormRef = pipwerks.SCORM.connection.isActive = true;
			}
		}
		if (this.scormRef) {
			PlayerLog('info','SCORM: ' + pipwerks.SCORM.version); // "1.2"  or "2004"
			var status = this.getStatus();
			if (status === false) {
				this.setStatus('incomplete');
			}
			/*
			var loc = this.getSCORM("lesson_location");
			if (loc) {
				// navigate directly to that page and also take care of enabling menu items?
			}
			/* bookmarking */
		}
	},
	getVersionKey: function (k) {
		if (this.scormRef) {
			switch (k) {
				case "lesson_location"		: return pipwerks.SCORM.version === "2004" ? "cmi.location" : "cmi.core.lesson_location";
				case "completion_status"	: return pipwerks.SCORM.version === "2004" ? "cmi.completion_status" : "cmi.core.lesson_status";
				case "success_status"		: return pipwerks.SCORM.version === "2004" ? "cmi.success_status" : "cmi.core.lesson_status";
				case "score.min"			: return pipwerks.SCORM.version === "2004" ? "cmi.score.min" : "cmi.core.score.min";
				case "score.max"			: return pipwerks.SCORM.version === "2004" ? "cmi.score.max" : "cmi.core.score.max";
				case "score.raw"			: return pipwerks.SCORM.version === "2004" ? "cmi.score.raw" : "cmi.core.score.raw";
				case "session_time"			: return pipwerks.SCORM.version === "2004" ? "cmi.session_time" : "cmi.core.session_time";
				case "total_time"			: return pipwerks.SCORM.version === "2004" ? "cmi.total_time" : "cmi.core.total_time";
			}
		}
		if (this.app.settings.localExamInsteadOfScorm) {
			if (k.indexOf("Player.test")) {
				return false;
			}
		}
		return k;
	},
	getSCORM: function (key) {
		if (this.scormRef) {
			key = this.getVersionKey(key);
			if (key) {
				PlayerLog('log',"getSCORM (" + key + ") ");
				return pipwerks.SCORM.get(key);
			}
		}
		return false;
	},
	setSCORM: function (key, val) {
		if (this.scormRef) {
			key = this.getVersionKey(key);
			if (key) {
				PlayerLog('log',"setSCORM (" + key + ", " + val + ") ");
				return pipwerks.SCORM.set(key, val);
			}
		}
		return false;
	},
	getStatus: function () {
		return this.getSCORM('completion_status');
	},
	setStatus: function (s) {
		if (s === "passed" || s === "failed") {
			return this.setSCORM('success_status', s);
		}
		return this.setSCORM('completion_status', s);
	},
	setScore: function (min, max, raw) {
		var success = this.setSCORM('score.min', min);
		success = success ? this.setSCORM('score.max', max) : false;
		success = success ? this.setSCORM('score.raw', raw) : false;

		return success;
	},
	getStepQuestion: function (stepNo, exam) {
		if (this.localExamInsteadOfScorm) {
			// questions are already loaded by loadExam, nothing to do
		} else {
			if (this.scormRef) {
				var qdata = this.getSCORM('nl.Player.test.API.trainings.question.random.step.' + stepNo);
				if (qdata) {
                    qdata = $.parseJSON(qdata)
					if (typeof qdata.questionId != "undefined") {
						var correct_aid = this.getSCORM('nl.Player.test.API.trainings.correct.answer.question.' + qdata.questionId);
						//'{"questionId": 341, "question": "Sample question", "answers": {"2874": "Sample answer 1", "2955": "Sample answer 2"}}'
						var q = new PlayerExamQuestion();
						q.step = stepNo;
						q.id = qdata.questionId;
						q.question = qdata.question;
						$.each(qdata.answers, function(aid, atxt) {
								var a = new PlayerExamAnswer();
								a.answer = atxt;
								if (aid == correct_aid) {
										a.correct = true;
								}
								a.id = aid;
								q.addAnswer(a);
						});
						exam.addQuestion(q);
						exam.itqs++;
					}
				}
				return true;
			}
		}
		return false;
	},
	getQA: function () {
		if (this.localExamInsteadOfScorm) {
			// questions are already loaded by loadExam, nothing to do
		} else {
			if (this.scormRef) {
				var examdata = this.getSCORM('nl.Player.test.API.trainings.exam');
                if (examdata) {
                    examdata = $.parseJSON(examdata)
					
					var questions = [];
					
					if (examdata.questions && examdata.questions.length) {
						for (var i = 0; i < examdata.questions.length; i++) {
							var qdata = examdata.questions[i];
							var q = new PlayerExamQuestion();
							var correct_aid = this.getSCORM('nl.Player.test.API.trainings.correct.answer.question.' + qdata.questionId);
							q.id = qdata.questionId;
							q.question = qdata.question;
							q.hint = qdata.hint;
							q.success = qdata.success;
							$.each(qdata.answers, function(aid, atxt) {
								var a = new PlayerExamAnswer();
								a.answer = atxt;
								if (aid == correct_aid) {
									a.correct = true;
								}
								a.id = aid;
								q.addAnswer(a);
							});
							questions.push(q);
						}
					}
					
					return questions;
                }
			}
		}
		return null;
	},
	setStepAnswer: function (stepNo, qid, aid) {
		if (this.scormRef) {
			var res = this.setSCORM('nl.Player.test.API.trainings.answer.random.step.' + stepNo, qid + ':' + aid);
			
			return res;
		}
		return false;
	},
	setExamAnswers: function (exam) {
		// set('nl.Player.test.API.trainings.exam.answers', '{"[questionId]": [answerId], "[questionId]": [answerId]}');
		if (this.scormRef) {
			var answersJSON = ' { ';
			var first = true;
			for (var i = 0; i <exam.questions.length; i++) {
				var q = exam.questions[i];
				if (q.step == 0) {
					if (!first) answersJSON += ' , ';
					else first = false;
					
					answersJSON += ' "' + q.id + '" : ' + q.answered_aid;
				}
			}
			answersJSON += ' } ';
			var res = this.setSCORM('nl.Player.test.API.trainings.exam.answers', answersJSON);
			
			this.updateTimes();
			
			return res;
		}
		return false;
	},
	getExamResult: function () {
		if (this.scormRef) {
			return this.getSCORM('nl.Player.test.API.trainings.exam.score'); // {"passed": "true", "points": 1000, "correctAnswers": 7}
		}
		return false;
	},
	finish: function () {
		if (this.scormRef) {
			var scs = this.setStatus('completed');
			if (scs) {
				if (!this.app.settings.localExamInsteadOfScorm) {
					this.saveScorm();
				} else {
					// no - still has exam before quit, lesson_status shall become passed/failed
				}
			}
			return scs;
		}
		return false;
	},
	saveScorm: function () {
		if (this.scormRef) {
			pipwerks.SCORM.save();
			//this.quitScorm();
		}
	},
	quitScorm: function () {
		if (this.scormRef) {
			pipwerks.SCORM.quit();
			this.scormRef = false;
		}
	},
	setBookmark: function (loc) {
		if (this.scormRef) {
			this.setSCORM('lesson_location', loc);
			this.updateTimes();
		}
		return false;
	},
	sendComment: function(msg) {
		if (this.scormRef) {
			var jsonmsg = '{ "mailto" : "test@test.com" , "comment" : "' + msg.replace(/"/g, "'").replace(/\\/g, "/") + '"}';
			var res = this.setSCORM('nl.Player.test.API.trainings.comment', jsonmsg);
			return res;
		}
		return false;
	},
	secsToCMITimepsan: function (timeInSecs) {
		//LMSSetValue("cmi.core.session_time","01:10:20.00");
		var hrs = Math.floor(timeInSecs / 60 / 60);
		hrs = "" + (hrs < 10 ? "0" : "") + hrs;
		timeInSecs -= hrs * 60 * 60;
		var min = Math.floor(timeInSecs / 60);
		min = "" + (min < 10 ? "0" : "") + min;
		timeInSecs -= min * 60;
		var sec = "" + (timeInSecs < 10 ? "0" : "") + timeInSecs + ".00";
		var cmiTimespan = hrs + ":" + min + ":" + sec;
		return cmiTimespan;
	},
	updateTimes: function() {
		return;

		/*var now = new Date().getTime();
		
		var sessionTime = Math.round((now - this.sessionStart) / 1000);

		var scormSessionTime = sessionTime;
		if (this.app.settings.localExamInsteadOfScorm) {
			scormSessionTime = this.secsToCMITimepsan(sessionTime);
		}

		this.setSCORM('session_time', scormSessionTime);
		
		// first read the session time accumulated so far
		var totalTime = this.getSCORM('total_time');
		if (!totalTime || totalTime == "null") {
			totalTime = "0";
		}

		totalTime = parseInt(totalTime, 10) + sessionTime - this.storedSessionTime;
		
		if (this.app.settings.localExamInsteadOfScorm) {
			totalTime = this.secsToCMITimepsan(totalTime);
		}
		this.setSCORM('total_time', totalTime);
		
		this.storedSessionTime = sessionTime;*/
	}
});


/**
  * end Player framework
***/

