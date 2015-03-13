// ui_timers
var ui_timers = window.wrappedJSObject ? createObjectIn(worker.GUIp, {defineAs: "timers"}) : worker.GUIp.timers = {};

ui_timers.init = function() {
	if (ui_data.hasTemple) {
		document.querySelector('#imp_button').insertAdjacentHTML('afterend', '<div id=\"imp_timer\" class=\"fr_new_badge hidden\" />');
		if (!ui_data.isFight && !ui_data.isDungeon) {
			this.layingTimer = document.querySelector('#imp_timer');
			this.layingTimerIsDisabled = ui_storage.get('Option:disableLayingTimer');
			ui_utils.hideElem(this.layingTimer, this.layingTimerIsDisabled);
		}
		if (ui_data.isDungeon) {
			this.logTimer = document.querySelector('#imp_timer');
			this.logTimerIsDisabled = ui_storage.get('Option:disableLogTimer');
			ui_utils.hideElem(this.logTimer, this.logTimerIsDisabled);
		}
		ui_timers.tick();
		worker.setInterval(ui_timers.tick.bind(ui_timers), 60000);
	}
};
ui_timers.tick = function() {
	var latestEntryDateFS = ui_storage.get('ThirdEye:Latest') && new Date(ui_storage.get('ThirdEye:Latest')),
		earliestEntryDateFS = ui_storage.get('ThirdEye:Earliest') && new Date(ui_storage.get('ThirdEye:Earliest')),
		lastLayingDateFS = ui_storage.get('ThirdEye:LastLaying') && new Date(ui_storage.get('ThirdEye:LastLaying')),
		lastLogDateFS = ui_storage.get('ThirdEye:LastLog') && new Date(ui_storage.get('ThirdEye:LastLog')),
		penultLogDateFS = ui_storage.get('ThirdEye:PenultLog') && new Date(ui_storage.get('ThirdEye:PenultLog'));
	this._lastLayingDate = this._lastLogDate = this._penultLogDate = 0;
	for (var msg in worker.so.state.diary_i) {
		var curEntryDate = new Date(worker.so.state.diary_i[msg].time);
		if (msg.match(/^(?:Возложила?|Выставила? тридцать золотых столбиков|I placed \w+? bags of gold)/) && curEntryDate > this._lastLayingDate) {
			this._lastLayingDate = curEntryDate;
		}
		var logs;
		if (msg.match(/^Выдержка из хроники подземелья:|Notes from the dungeon:/) && (logs = (msg.match(/бревно для ковчега|ещё одно бревно|log for the ark/g) || []).length)) {
			if (curEntryDate > this._lastLogDate) {
				while (logs--) {
					this._penultLogDate = this._lastLogDate;
					this._lastLogDate = curEntryDate;
				}
			} else if (curEntryDate > this._penultLogDate) {
				this._penultLogDate = curEntryDate;
			}
		}
		if (!this._latestEntryDate || this._latestEntryDate < curEntryDate) {
			this._latestEntryDate = curEntryDate;
		}
		if (!this._earliestEntryDate || this._earliestEntryDate > curEntryDate) {
			this._earliestEntryDate = curEntryDate;
		}
	}
	if (latestEntryDateFS >= this._earliestEntryDate) {
		this._earliestEntryDate = earliestEntryDateFS;
		if (this._lastLayingDate) {
			ui_storage.set('ThirdEye:LastLaying', this._lastLayingDate);
		} else {
			this._lastLayingDate = lastLayingDateFS;
		}
		if (this._lastLogDate) {
			ui_storage.set('ThirdEye:LastLog', this._lastLogDate);
		} else {
			this._lastLogDate = lastLogDateFS;
		}
		if (this._penultLogDate) {
			ui_storage.set('ThirdEye:PenultLog', this._penultLogDate);
		} else {
			this._penultLogDate = penultLogDateFS;
		}
	} else {
		ui_storage.set('ThirdEye:Earliest', this._earliestEntryDate);
		ui_storage.set('ThirdEye:LastLaying', this._lastLayingDate || '');
		ui_storage.set('ThirdEye:LastLog', this._lastLogDate || '');
		ui_storage.set('ThirdEye:PenultLog', this._penultLogDate || '');
	}
	ui_storage.set('ThirdEye:Latest', this._latestEntryDate);
	if (this.layingTimer && !this.layingTimerIsDisabled) {
		ui_timers._calculateTime(true, this._lastLayingDate);
	}
	if (this.logTimer && !this.logTimerIsDisabled) {
		ui_timers._calculateTime(false, this._penultLogDate);
	}
};
ui_timers._calculateTime = function(isLaying, fromDate) {
	var totalMinutes, greenHours = isLaying ? 36 : 24,
		yellowHours = isLaying ? 18 : 23;
	if (fromDate) {
		totalMinutes = Math.ceil((Date.now() + 1 - fromDate)/1000/60);
		ui_timers._setTimer(isLaying, totalMinutes, totalMinutes > greenHours*60 ? 'green' : totalMinutes > yellowHours*60 ? 'yellow' : 'red');
	} else {
		totalMinutes = Math.floor((Date.now() - this._earliestEntryDate)/1000/60);
		ui_timers._setTimer(isLaying, totalMinutes, totalMinutes > greenHours*60 ? 'green' : 'grey');
	}
};
ui_timers._formatTime = function(maxHours, totalMinutes) {
	var countdownMinutes = maxHours*60 - totalMinutes,
		hours = Math.floor(countdownMinutes/60),
		minutes = Math.floor(countdownMinutes%60);
	return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
};
ui_timers._calculateExp = function(totalMinutes) {
	var baseExp = Math.min(totalMinutes/36/60*2, 2),
		amountMultiplier = [1, 2, 2.5],
		levelMultiplier = ui_stats.get('Level') < 100 ? 1 : ui_stats.get('Level') < 125 ? 0.5 : 0.25,
		title = [];
	for (var i = 1; i <= 3; i++) {
		title.push(i + '0k gld → ' + ((i + baseExp*amountMultiplier[i - 1])*levelMultiplier).toFixed(1) + '% exp');
	}
	return title.join('\n');
};
ui_timers._setTimer = function(isLaying, totalMinutes, color) {
	var timer = isLaying ? this.layingTimer : this.logTimer;
	timer.className = timer.className.replace(/green|yellow|red|grey/g, '');
	timer.classList.add(color);
	if (color === 'grey') {
		timer.textContent = '?';
		timer.title = (isLaying ? worker.GUIp_i18n.gte_unknown_penalty : worker.GUIp_i18n.log_unknown_time) + ui_timers._formatTime(isLaying ? 36 : 24, totalMinutes);
	} else {
		timer.textContent = color === 'green' ? isLaying ? '✓' : '木' : ui_timers._formatTime(isLaying ? 36 : 24, totalMinutes);
		timer.title = isLaying ? ui_timers._calculateExp(totalMinutes) : totalMinutes > 24*60 ? worker.GUIp_i18n.log_is_guaranteed : worker.GUIp_i18n.log_isnt_guaranteed;
	}
};