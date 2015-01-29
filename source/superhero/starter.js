// ui_starter
ui_starter.start = function() {
	if (worker.$ && (worker.$('#m_info').length || worker.$('#stats').length) && worker.GUIp_browser && worker.GUIp_i18n && worker.GUIp_addCSSFromURL && worker.so.state) {
		clearInterval(starterInt);
		var start = new Date();
		ui_data.init();
		ui_storage.migrate();
		ui_utils.addCSS();
		ui_utils.inform();
		ui_words.init();
		ui_logger.create();
		ui_timeout.create();
		ui_help_dialog.create();
		ui_informer.init();
		ui_forum.init();
		ui_improver.improve();
		ui_laying_timer.init();
		ui_observers.init();
		ui_improver.initSoundsOverride();

		// Event and listeners
		worker.$(document).bind('DOMNodeInserted', ui_improver.nodeInsertion.bind(ui_improver));

		if (!ui_data.isBattle) {
			worker.onmousemove = worker.onscroll = worker.ontouchmove = ui_improver.activity;
		}

		// svg for #logger fade-out in FF
		var is5c = document.getElementsByClassName('page_wrapper_5c').length;
		document.body.insertAdjacentHTML('beforeend',
			'<svg id="fader">' +
				'<defs>' +
					'<linearGradient id="gradient" x1="0" y1="0" x2 ="100%" y2="0">' +
						'<stop stop-color="black" offset="0"></stop>' +
						'<stop stop-color="white" offset="0.0' + (is5c ? '2' : '3') + '"></stop>' +
					'</linearGradient>' +
					'<mask id="fader_masking" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">' +
						'<rect x="0.0' + (is5c ? '2' : '3') + '" width="0.9' + (is5c ? '8' : '7') + '" height="1" fill="url(#gradient)" />' +
					'</mask>' +
				'</defs>' +
			'</svg>'
		);

		var finish = new Date();
		worker.console.info('Godville UI+ log: Initialized in ' + (finish.getTime() - start.getTime()) + ' msec.');
	}
};
