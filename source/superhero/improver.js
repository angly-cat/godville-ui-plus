// ui_improver
ui_improver.inventoryChanged = true;
ui_improver.improveInProcess = true;
ui_improver.isFirstTime = true;
ui_improver.voiceSubmitted = false;
ui_improver.wantedMonsters = null;
ui_improver.friendsRegexp = null;
ui_improver.windowResizeInt = 0;
ui_improver.mapColorizationTmt = 0;
ui_improver.alliesCount = 0;
ui_improver.currentAlly = 0;
ui_improver.currentAllyObserver = 0;
// trophy craft combinations
ui_improver.b_b = [];
ui_improver.b_r = [];
ui_improver.r_r = [];
// dungeon phrases
ui_improver.dungeonPhrases = [
	'warning',
	'boss',
	'bonusGodpower',
	'bonusHealth',
	'trapUnknown',
	'trapTrophy',
	'trapGold',
	'trapLowDamage',
	'trapModerateDamage',
	'trapMoveLoss',
	'jumpingDungeon'
];
// resresher
ui_improver.softRefreshInt = 0;
ui_improver.hardRefreshInt = 0;
ui_improver.softRefresh = function() {
	worker.console.info('Godville UI+ log: Soft reloading...');
	document.getElementById('d_refresh').click();
};
ui_improver.hardRefresh = function() {
	worker.console.warn('Godville UI+ log: Hard reloading...');
	location.reload();
};
ui_improver.improve = function() {
	this.improveInProcess = true;
	ui_informer.update('pvp', ui_data.isBattle && !ui_data.isDungeon);
	ui_informer.update('arena available', worker.so.state.arena_available());
	ui_informer.update('dungeon available', worker.so.state.dungeon_available());
	if (this.isFirstTime) {
		if (!ui_data.isBattle && !ui_data.isDungeon) {
			this.improveDiary();
			this.improveLoot();
		}
		if (ui_data.isDungeon) {
			this.getDungeonPhrases();
		}
	}
	this.improveStats();
	this.improvePet();
	this.improveVoiceDialog();
	if (!ui_data.isBattle) {
		this.improveNews();
		this.improveEquip();
		this.improvePantheons();
	}
	if (ui_data.isDungeon) {
		this.improveMap();
	}
	this.improveInterface();
	this.improveChat();
	if (this.isFirstTime && (ui_data.isBattle || ui_data.isDungeon)) {
		this.improveAllies();
	}
	this.checkButtonsVisibility();
	this.isFirstTime = false;
	this.improveInProcess = false;
};
ui_improver.improveLoot = function() {
	var i, j, len, items = document.querySelectorAll('#inventory li'),
		flags = new Array(ui_words.base.usable_items.types.length),
		bold_items = 0,
		trophy_list = [],
		trophy_boldness = {},
		forbidden_craft = ui_storage.get('Option:forbiddenCraft');

	for (i = 0, len = flags.length; i < len; i++) {
		flags[i] = false;
	}

	// Parse items
	for (i = 0, len = items.length; i < len; i++) {
		if (getComputedStyle(items[i]).overflow === 'visible') {
			var item_name = items[i].textContent.replace(/\?$/, '')
												.replace(/\(@\)/, '')
												.replace(/\(\d шт\)$/, '')
												.replace(/\(\dpcs\)$/, '')
												.replace(/^\s+|\s+$/g, '');
			// color items and add buttons
			if (ui_words.isUsableItem(items[i])) {
				var desc = items[i].querySelector('.item_act_link_div *').getAttribute('title').replace(/ \(.*/g, ''),
					sect = ui_words.usableItemType(desc);
				bold_items++;
				if (sect !== -1) {
					flags[sect] = true;
				} else if (!ui_utils.hasShownInfoMessage) {
					ui_utils.hasShownInfoMessage = true;
					ui_utils.showMessage('info', {
						title: worker.GUIp_i18n.unknown_item_type_title,
						content: '<div>' + worker.GUIp_i18n.unknown_item_type_content + '<b>"' + desc + '</b>"</div>'
					});
				}
				if (!(forbidden_craft && (forbidden_craft.match('usable') || (forbidden_craft.match('b_b') && forbidden_craft.match('b_r'))))) {
					trophy_list.push(item_name);
					trophy_boldness[item_name] = true;
				}
			} else if (ui_words.isHealItem(items[i])) {
				if (!ui_utils.isAlreadyImproved(worker.$(items[i]))) {
					items[i].classList.add('heal_item');
				}
				if (!(forbidden_craft && (forbidden_craft.match('heal') || (forbidden_craft.match('b_r') && forbidden_craft.match('r_r'))))) {
					trophy_list.push(item_name);
					trophy_boldness[item_name] = false;
				}
			} else {
				if (ui_words.isBoldItem(items[i])) {
					bold_items++;
					if (!(forbidden_craft && forbidden_craft.match('b_b') && forbidden_craft.match('b_r')) &&
						!item_name.match('золотой кирпич') && !item_name.match(' босса ')) {
						trophy_list.push(item_name);
						trophy_boldness[item_name] = true;
					}
				} else {
					if (!(forbidden_craft && forbidden_craft.match('b_r') && forbidden_craft.match('r_r')) &&
						!item_name.match('пушистого триббла')) {
						trophy_list.push(item_name);
						trophy_boldness[item_name] = false;
					}
				}
				if (!ui_utils.isAlreadyImproved(worker.$(items[i]))) {
					items[i].insertBefore(ui_utils.createInspectButton(item_name), null);
				}
			}
		}
	}

	for (i = 0, len = flags.length; i < len; i++) {
		ui_informer.update(ui_words.base.usable_items.types[i], flags[i]);
	}
	ui_informer.update('transform!', flags[ui_words.base.usable_items.types.indexOf('transformer')] && bold_items >= 2);
	ui_informer.update('smelt!', flags[ui_words.base.usable_items.types.indexOf('smelter')] && ui_storage.get('Stats:Gold') >= 3000);

	// Склейка трофеев, формирование списков
	this.b_b = [];
	this.b_r = [];
	this.r_r = [];
	if (trophy_list.length) {
		trophy_list.sort();
		for (i = 0, len = trophy_list.length - 1; i < len; i++) {
			for (j = i + 1; j < len + 1; j++) {
				if (trophy_list[i][0] === trophy_list[j][0]) {
					if (trophy_boldness[trophy_list[i]] && trophy_boldness[trophy_list[j]]) {
						if (!(forbidden_craft && forbidden_craft.match('b_b'))) {
							this.b_b.push(trophy_list[i] + worker.GUIp_i18n.and + trophy_list[j]);
							this.b_b.push(trophy_list[j] + worker.GUIp_i18n.and + trophy_list[i]);
						}
					} else if (!trophy_boldness[trophy_list[i]] && !trophy_boldness[trophy_list[j]]) {
						if (!(forbidden_craft && forbidden_craft.match('r_r'))) {
							this.r_r.push(trophy_list[i] + worker.GUIp_i18n.and + trophy_list[j]);
							this.r_r.push(trophy_list[j] + worker.GUIp_i18n.and + trophy_list[i]);
						}
					} else {
						if (!(forbidden_craft && forbidden_craft.match('b_r'))) {
							if (trophy_boldness[trophy_list[i]]) {
								this.b_r.push(trophy_list[i] + worker.GUIp_i18n.and + trophy_list[j]);
							} else {
								this.b_r.push(trophy_list[j] + worker.GUIp_i18n.and + trophy_list[i]);
							}
						}
					}
				} else {
					break;
				}
			}
		}
	}

	if (!ui_utils.isAlreadyImproved(worker.$('#inventory'))) {
		var inv_content = document.querySelector('#inventory .block_content');
		inv_content.insertAdjacentHTML('beforeend', '<span class="craft_button">' + worker.GUIp_i18n.craft_verb + ':</span>');
		inv_content.insertBefore(ui_utils.createCraftButton(worker.GUIp_i18n.b_b, 'b_b', worker.GUIp_i18n.b_b_hint), null);
		inv_content.insertBefore(ui_utils.createCraftButton(worker.GUIp_i18n.b_r, 'b_r', worker.GUIp_i18n.b_r_hint), null);
		inv_content.insertBefore(ui_utils.createCraftButton(worker.GUIp_i18n.r_r, 'r_r', worker.GUIp_i18n.r_r_hint), null);
	}
};
ui_improver.improveVoiceDialog = function() {
	// Add links and show timeout bar after saying
	if (this.isFirstTime) {
		ui_utils.setVoiceSubmitState(ui_storage.get('Option:freezeVoiceButton') && ui_storage.get('Option:freezeVoiceButton').match('when_empty'), true);
		worker.$(document).on('change keypress paste focus textInput input', '#god_phrase', function() {
			if (!ui_utils.setVoiceSubmitState(this.value && !(ui_storage.get('Option:freezeVoiceButton') && ui_storage.get('Option:freezeVoiceButton').match('after_voice') && parseInt(ui_timeout.bar.style.width)), false)) {
				ui_utils.setVoiceSubmitState(ui_storage.get('Option:freezeVoiceButton') && ui_storage.get('Option:freezeVoiceButton').match('when_empty'), true);
			}
		}).on('click', '.gv_text.div_link', function() {
			worker.$('#god_phrase').change();
		});
	}
	var $box = worker.$('#cntrl');
	if (!ui_utils.isAlreadyImproved($box)) {
		worker.$('.gp_label').addClass('l_capt');
		worker.$('.gp_val').addClass('l_val');
		if (ui_data.isDungeon && worker.$('#map').length) {
			var isContradictions = worker.$('#map')[0].textContent.match(/Противоречия|Disobedience/);
			ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.east, (isContradictions ? 'go_west' : 'go_east'), worker.GUIp_i18n.ask3 + ui_data.char_sex[0] + worker.GUIp_i18n.go_east);
			ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.west, (isContradictions ? 'go_east' : 'go_west'), worker.GUIp_i18n.ask3 + ui_data.char_sex[0] + worker.GUIp_i18n.go_west);
			ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.south, (isContradictions ? 'go_north' : 'go_south'), worker.GUIp_i18n.ask3 + ui_data.char_sex[0] + worker.GUIp_i18n.go_south);
			ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.north, (isContradictions ? 'go_south' : 'go_north'), worker.GUIp_i18n.ask3 + ui_data.char_sex[0] + worker.GUIp_i18n.go_north);
			if (worker.$('#map')[0].textContent.match(/Бессилия|Anti-influence/)) {
				worker.$('#actions').hide();
			}
		} else {
			if (ui_data.isBattle) {
				ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.defend, 'defend', worker.GUIp_i18n.ask4 + ui_data.char_sex[0] + worker.GUIp_i18n.to_defend);
				ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.pray, 'pray', worker.GUIp_i18n.ask5 + ui_data.char_sex[0] + worker.GUIp_i18n.to_pray);
				ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.heal, 'heal', worker.GUIp_i18n.ask6 + ui_data.char_sex[1] + worker.GUIp_i18n.to_heal);
				ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.hit, 'hit', worker.GUIp_i18n.ask7 + ui_data.char_sex[1] + worker.GUIp_i18n.to_hit);
			} else {
				ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.sacrifice, 'sacrifice', worker.GUIp_i18n.ask8 + ui_data.char_sex[1] + worker.GUIp_i18n.to_sacrifice);
				ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.godpower_label, worker.GUIp_i18n.pray, 'pray', worker.GUIp_i18n.ask5 + ui_data.char_sex[0] + worker.GUIp_i18n.to_pray);
				worker.$('#voice_submit').click(function() {
					ui_improver.voiceSubmitted = true;
				});
			}
		}
		//hide_charge_button
		var charge_button = worker.$('#cntrl .hch_link');
		if (charge_button.length) {
			charge_button[0].style.visibility = ui_storage.get('Option:hideChargeButton') ? 'hidden' : '';
		}
	}

	// Save stats
	ui_stats.setFromLabelCounter('Godpower', $box, worker.GUIp_i18n.godpower_label);
	ui_informer.update('full godpower', worker.$('#cntrl .p_val').width() === worker.$('#cntrl .p_bar').width());
};
ui_improver.improveNews = function() {
	if (!ui_utils.isAlreadyImproved(worker.$('#news'))) {
		ui_utils.addSayPhraseAfterLabel(worker.$('#news'), worker.GUIp_i18n.enemy_label, worker.GUIp_i18n.hit, 'hit', worker.GUIp_i18n.ask7 + ui_data.char_sex[1] + worker.GUIp_i18n.to_hit);
	}
	var isWantedMonster = false,
		isSpecialMonster = false,
		isTamableMonster = false;
	// Если герой дерется с монстром
	if (worker.$('#news .line')[0].style.display !== 'none') {
		var currentMonster = worker.$('#news .l_val').text();
		isWantedMonster = this.wantedMonsters && currentMonster.match(this.wantedMonsters);
		isSpecialMonster = currentMonster.match(/Врачующий|Дарующий|Зажиточный|Запасливый|Кирпичный|Латающий|Лучезарный|Сияющий|Сюжетный|Линяющий|Bricked|Enlightened|Glowing|Healing|Holiday|Loaded|Questing|Shedding|Smith|Wealthy/);

		if (!worker.so.state.has_pet) {
			var hasArk = parseInt(worker.so.state.stats.wood.value) >= 100;
			var pet, hero_level = ui_stats.get('Level');
			for (var i = 0; i < ui_words.base.pets.length; i++) {
				pet = ui_words.base.pets[i];
				if (currentMonster.toLowerCase().indexOf(pet.name) >= 0 && hero_level >= pet.min_level && hero_level <= (pet.min_level + (hasArk ? 28 : 14))) {
					isTamableMonster = true;
					break;
				}
			}
		}
	}

	ui_informer.update('wanted monster', isWantedMonster);
	ui_informer.update('special monster', isSpecialMonster);
	ui_informer.update('tamable monster', isTamableMonster);
};
ui_improver.MapIteration = function(MapThermo, iPointer, jPointer, step, kRow, kColumn) {
	step++;
	for (var iStep = -1; iStep <= 1; iStep++) {
		for (var jStep = -1; jStep <= 1; jStep++) {
			if (iStep !== jStep && (iStep === 0 || jStep === 0)) {
				var iNext = iPointer + iStep,
					jNext = jPointer + jStep;
				if (iNext >= 0 && iNext < kRow && jNext >= 0 && jNext < kColumn) {
					if (MapThermo[iNext][jNext] !== -1) {
						if (MapThermo[iNext][jNext] > step || MapThermo[iNext][jNext] === 0) {
							MapThermo[iNext][jNext] = step;
							this.MapIteration(MapThermo, iNext, jNext, step, kRow, kColumn);
						}
					}
				}
			}
		}
	}
};
ui_improver.improveMap = function() {
	if (this.isFirstTime) {
		document.getElementsByClassName('map_legend')[0].nextElementSibling.insertAdjacentHTML('beforeend',
			'<div class="guip_legend"><div class="dmc warning"></div><div> - ' + worker.GUIp_i18n.boss_warning_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc boss"></div><div> - ' + worker.GUIp_i18n.boss_slay_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc bonusGodpower"></div><div> - ' + worker.GUIp_i18n.small_prayer_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc bonusHealth"></div><div> - ' + worker.GUIp_i18n.small_healing_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc trapUnknown"></div><div> - ' + worker.GUIp_i18n.unknown_trap_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc trapTrophy"></div><div> - ' + worker.GUIp_i18n.trophy_loss_trap_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc trapLowDamage"></div><div> - ' + worker.GUIp_i18n.low_damage_trap_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc trapModerateDamage"></div><div> - ' + worker.GUIp_i18n.moderate_damage_trap_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc trapMoveLoss"></div><div> - ' + worker.GUIp_i18n.move_loss_trap_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc warning trapMoveLoss"></div><div> - ' + worker.GUIp_i18n.boss_warning_and_trap_hint + '</div></div>' +
			'<div class="guip_legend"><div class="dmc boss trapMoveLoss"></div><div> - ' + worker.GUIp_i18n.boss_slay_and_trap_hint + '</div></div>'
		);
	}
	if (worker.$('#map .dml').length) {
		if (ui_storage.get('Option:relocateMap')) {
			if (!worker.$('#a_central_block #map').length) {
				worker.$('#map').insertBefore(worker.$('#m_control'));
				worker.$('#m_control').appendTo(worker.$('#a_right_block'));
				if (worker.GUIp_locale === 'ru') {
					worker.$('#m_control .block_title').text('Пульт');
				}
			}
		} else {
			if (!worker.$('#a_right_block #map').length) {
				worker.$('#m_control').insertBefore(worker.$('#map'));
				worker.$('#map').appendTo(worker.$('#a_right_block'));
				if (worker.GUIp_locale === 'ru') {
					worker.$('#m_control .block_title').text('Пульт вмешательства в личную жизнь');
				}
			}
		}
		var i, j,
			$box = worker.$('#cntrl .voice_generator'),
			$boxML = worker.$('#map .dml'),
			$boxMC = worker.$('#map .dmc'),
			kRow = $boxML.length,
			kColumn = $boxML[0].textContent.length,
			isJumping = worker.$('#map')[0].textContent.match(/Прыгучести|Jumping/),
			MaxMap = 0,	// Счетчик указателей
			MapArray = []; // Карта возможного клада
		for (i = 0; i < kRow; i++) {
			MapArray[i] = [];
			for (j = 0; j < kColumn; j++) {
				MapArray[i][j] = ('?!@'.indexOf($boxML[i].textContent[j]) !== - 1) ? 0 : -1;
			}
		}
		// Гласы направления делаем невидимыми
		for (i = 0; i < 4; i++) {
			$box[i].style.visibility = 'hidden';
		}
		for (var si = 0; si < kRow; si++) {
			// Ищем где мы находимся
			j = $boxML[si].textContent.indexOf('@');
			if (j !== -1) {
				var direction = document.querySelector('.sort_ch').textContent === '▼',
					chronicles = document.querySelectorAll('#m_fight_log .d_line');
				if (!(chronicles[direction ? 0 : chronicles.length - 1].classList.contains('trapMoveLoss') && !chronicles[direction ? 1 : chronicles.length - 2].classList.contains('trapMoveLoss'))) {
					//	Проверяем куда можно пройти
					if ($boxML[si - 1].textContent[j] !== '#' || isJumping && (si === 1 || si !== 1 && $boxML[si - 2].textContent[j] !== '#')) {
						$box[0].style.visibility = '';	//	Север
					}
					if ($boxML[si + 1].textContent[j] !== '#' || isJumping && (si === kRow - 2 || si !== kRow - 2 && $boxML[si + 2].textContent[j] !== '#')) {
						$box[1].style.visibility = '';	//	Юг
					}
					if ($boxML[si].textContent[j - 1] !== '#' || isJumping && $boxML[si].textContent[j - 2] !== '#') {
						$box[2].style.visibility = '';	//	Запад
					}
					if ($boxML[si].textContent[j + 1] !== '#' || isJumping && $boxML[si].textContent[j + 2] !== '#') {
						$box[3].style.visibility = '';	//	Восток
					}
				}
			}
			//	Ищем указатели
			for (var sj = 0; sj < kColumn; sj++) {
				var ik, jk,
					Pointer = $boxML[si].textContent[sj];
				if ('←→↓↑↙↘↖↗'.indexOf(Pointer) !== - 1) {
					MaxMap++;
					$boxMC[si * kColumn + sj].style.color = 'green';
					for (ik = 0; ik < kRow; ik++) {
						for (jk = 0; jk < kColumn; jk++) {
							var istep = parseInt((Math.abs(jk - sj) - 1) / 5),
								jstep = parseInt((Math.abs(ik - si) - 1) / 5);
							if ('←→'.indexOf(Pointer) !== -1 && ik >= si - istep && ik <= si + istep ||
								Pointer === '↓' && ik >= si + istep ||
								Pointer === '↑' && ik <= si - istep ||
								'↙↘'.indexOf(Pointer) !== -1 && ik > si + istep ||
								'↖↗'.indexOf(Pointer) !== -1 && ik < si - istep) {
								if (Pointer === '→' && jk >= sj + jstep ||
									Pointer === '←' && jk <= sj - jstep ||
									'↓↑'.indexOf(Pointer) !== -1 && jk >= sj - jstep && jk <= sj + jstep ||
									'↘↗'.indexOf(Pointer) !== -1 && jk > sj + jstep ||
									'↙↖'.indexOf(Pointer) !== -1 && jk < sj - jstep) {
									if (MapArray[ik][jk] >= 0) {
										MapArray[ik][jk]++;
									}
								}
							}
						}
					}
				}
				if ('✺☀♨☁❄✵'.indexOf(Pointer) !== -1) {
					MaxMap++;
					$boxMC[si * kColumn + sj].style.color = 'green';
					var ThermoMinStep = 0;	//	Минимальное количество шагов до клада
					var ThermoMaxStep = 0;	//	Максимальное количество шагов до клада
					switch(Pointer) {
						case '✺': ThermoMinStep = 1; ThermoMaxStep = 2; break;	//	✺ - очень горячо(1-2)
						case '☀': ThermoMinStep = 3; ThermoMaxStep = 5; break;	//	☀ - горячо(3-5)
						case '♨': ThermoMinStep = 6; ThermoMaxStep = 9; break;	//	♨ - тепло(6-9)
						case '☁': ThermoMinStep = 10; ThermoMaxStep = 13; break;	//	☁ - свежо(10-13)
						case '❄': ThermoMinStep = 14; ThermoMaxStep = 18; break;	//	❄ - холодно(14-18)
						case '✵': ThermoMinStep = 19; ThermoMaxStep = 100; break;	//	✵ - очень холодно(19)
					}
					//	Временная карта возможных ходов
					var MapThermo = [];
					for (ik = 0; ik < kRow; ik++) {
						MapThermo[ik] = [];
						for (jk = 0; jk < kColumn; jk++) {
							MapThermo[ik][jk] = ($boxML[ik].textContent[jk] === '#' || ((Math.abs(jk - sj) + Math.abs(ik - si)) > ThermoMaxStep)) ? -1 : 0;
						}
					}
					//	Запускаем итерацию
					this.MapIteration(MapThermo, si, sj, 0, kRow, kColumn);
					//	Метим возможный клад
					for (ik = ((si - ThermoMaxStep) > 0 ? si - ThermoMaxStep : 0); ik <= ((si + ThermoMaxStep) < kRow ? si + ThermoMaxStep : kRow - 1); ik++) {
						for (jk = ((sj - ThermoMaxStep) > 0 ? sj - ThermoMaxStep : 0); jk <= ((sj + ThermoMaxStep) < kColumn ? sj + ThermoMaxStep : kColumn - 1); jk++) {
							if (MapThermo[ik][jk] >= ThermoMinStep & MapThermo[ik][jk] <= ThermoMaxStep) {
								if (MapArray[ik][jk] >= 0) {
									MapArray[ik][jk]++;
								}
							}
						}
					}
				}
				// На будущее
				// ↻ ↺ ↬ ↫
			}
		}
		//	Отрисовываем возможный клад
		if (MaxMap !== 0) {
			for (i = 0; i < kRow; i++) {
				for (j = 0; j < kColumn; j++) {
					if (MapArray[i][j] === MaxMap) {
						$boxMC[i * kColumn + j].style.color = ($boxML[i].textContent[j] === '@') ? 'blue' : 'red';
					}
				}
			}
		}
	}
};
ui_improver.improveStats = function() {
	//	Парсер строки с золотом
	var gold_parser = function(val) {
		return parseInt(val.replace(/[^0-9]/g, '')) || 0;
	};

	if (ui_data.isDungeon) {
		ui_stats.setFromLabelCounter('Map_HP', worker.$('#m_info'), worker.GUIp_i18n.health_label);
		ui_stats.setFromLabelCounter('Map_Gold', worker.$('#m_info'), worker.GUIp_i18n.gold_label, gold_parser);
		ui_stats.setFromLabelCounter('Map_Inv', worker.$('#m_info'), worker.GUIp_i18n.inventory_label);
		ui_stats.set('Map_Charges', worker.$('#m_control .acc_val').text(), parseFloat);
		ui_stats.set('Map_Alls_HP', this.GroupHP(true));
		if (ui_storage.get('Logger:Location') === 'Field') {
			ui_storage.set('Logger:Location', 'Dungeon');
			ui_storage.set('Logger:Map_HP', ui_stats.get('Map_HP'));
			ui_storage.set('Logger:Map_Gold', ui_stats.get('Map_Gold'));
			ui_storage.set('Logger:Map_Inv', ui_stats.get('Map_Inv'));
			ui_storage.set('Logger:Map_Charges',ui_stats.get('Map_Charges'));
			ui_storage.set('Logger:Map_Alls_HP', ui_stats.get('Map_Alls_HP'));
		}
		ui_informer.update('low health', +ui_stats.get('Map_HP') < 130);
		return;
	}
	if (ui_data.isBattle) {
		ui_stats.setFromLabelCounter('Hero_HP', worker.$('#m_info'), worker.GUIp_i18n.health_label);
		ui_stats.setFromLabelCounter('Hero_Gold', worker.$('#m_info'), worker.GUIp_i18n.gold_label, gold_parser);
		ui_stats.setFromLabelCounter('Hero_Inv', worker.$('#m_info'), worker.GUIp_i18n.inventory_label);
		ui_stats.set('Hero_Charges', worker.$('#m_control .acc_val').text(), parseFloat);
		ui_stats.setFromLabelCounter('Enemy_Gold', worker.$('#o_info'), worker.GUIp_i18n.gold_label, gold_parser);
		ui_stats.setFromLabelCounter('Enemy_Inv', worker.$('#o_info'), worker.GUIp_i18n.inventory_label);
		ui_stats.set('Hero_Alls_HP', this.GroupHP(true));
		ui_stats.set('Enemy_HP', this.GroupHP(false));
		if (this.isFirstTime) {
			ui_storage.set('Logger:Hero_HP', ui_stats.get('Hero_HP'));
			ui_storage.set('Logger:Hero_Gold', ui_stats.get('Hero_Gold'));
			ui_storage.set('Logger:Hero_Inv', ui_stats.get('Hero_Inv'));
			ui_storage.set('Logger:Hero_Charges',ui_stats.get('Hero_Charges'));
			ui_storage.set('Logger:Enemy_HP', ui_stats.get('Enemy_HP'));
			ui_storage.set('Logger:Enemy_Gold', ui_stats.get('Enemy_Gold'));
			ui_storage.set('Logger:Enemy_Inv', ui_stats.get('Enemy_Inv'));
			ui_storage.set('Logger:Hero_Alls_HP', ui_stats.get('Hero_Alls_HP'));
		}
		ui_informer.update('low health', +ui_stats.get('Hero_HP') < 130);
		return;
	}
	if (ui_storage.get('Logger:Location') !== 'Field') {
		ui_storage.set('Logger:Location', 'Field');
	}
	var $box = worker.$('#stats');
	if (!ui_utils.isAlreadyImproved(worker.$('#stats'))) {
		// Add links
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.level_label, worker.GUIp_i18n.study, 'exp', worker.GUIp_i18n.ask9 + ui_data.char_sex[1] + worker.GUIp_i18n.to_study);
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.health_label, worker.GUIp_i18n.heal, 'heal', worker.GUIp_i18n.ask6 + ui_data.char_sex[1] + worker.GUIp_i18n.to_heal);
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.gold_label, worker.GUIp_i18n.dig, 'dig', worker.GUIp_i18n.ask10 + ui_data.char_sex[1] + worker.GUIp_i18n.to_dig);
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.task_label, worker.GUIp_i18n.cancel_task, 'cancel_task', worker.GUIp_i18n.ask11 + ui_data.char_sex[0] + worker.GUIp_i18n.to_cancel_task);
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.task_label, worker.GUIp_i18n.do_task, 'do_task', worker.GUIp_i18n.ask12 + ui_data.char_sex[1] + worker.GUIp_i18n.to_do_task);
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.death_label, worker.GUIp_i18n.die, 'die', worker.GUIp_i18n.ask13 + ui_data.char_sex[0] + worker.GUIp_i18n.to_die);
	}
	if (!worker.$('#hk_distance .voice_generator').length) {
		ui_utils.addSayPhraseAfterLabel($box, worker.GUIp_i18n.milestones_label, worker.$('#main_wrapper.page_wrapper_5c').length ? '回' : worker.GUIp_i18n.return, 'town', worker.GUIp_i18n.ask14 + ui_data.char_sex[0] + worker.GUIp_i18n.to_return);
	}

	ui_stats.setFromProgressBar('Exp', worker.$('#hk_level .p_bar'));
	ui_stats.setFromProgressBar('Task', worker.$('#hk_quests_completed .p_bar'));
	ui_stats.setFromLabelCounter('Level', $box, worker.GUIp_i18n.level_label);
	ui_stats.setFromLabelCounter('Monster', $box, worker.GUIp_i18n.monsters_label);
	ui_stats.setFromLabelCounter('Death', $box, worker.GUIp_i18n.death_label);
	ui_stats.setFromLabelCounter('Bricks', $box, worker.GUIp_i18n.bricks_label, parseFloat);
	ui_stats.setFromLabelCounter('Logs', $box, worker.GUIp_i18n.logs_label, parseFloat);
	ui_stats.setFromLabelCounter('Savings', $box, worker.GUIp_i18n.savings_label, gold_parser);
	ui_stats.set('Charges', worker.$('#control .acc_val').text(), parseFloat);
	if (ui_storage.get('Stats:Inv') !== ui_stats.setFromLabelCounter('Inv', $box, worker.GUIp_i18n.inventory_label) || worker.$('#inventory li:not(.improved)').length || worker.$('#inventory li:hidden').length) {
		this.inventoryChanged = true;
	}
	ui_informer.update('much gold', ui_stats.setFromLabelCounter('Gold', $box, worker.GUIp_i18n.gold_label, gold_parser) >= (ui_data.hasTemple ? 10000 : 3000));
	ui_informer.update('dead', ui_stats.setFromLabelCounter('HP', $box, worker.GUIp_i18n.health_label) === 0);
	ui_informer.update('guild quest', worker.$('.q_name').text().match(/членом гильдии|member of the guild/) && !worker.$('.q_name').text().match(/\((отменено|cancelled)\)/));
	ui_informer.update('mini quest', worker.$('.q_name').text().match(/\((мини|mini)\)/) && !worker.$('.q_name').text().match(/\((отменено|cancelled)\)/));

	//Shovel pictogramm start
	var $digVoice = worker.$('#hk_gold_we .voice_generator');
	//worker.$('#hk_gold_we .l_val').text('где-то 20 монет');
	if (this.isFirstTime) {
		$digVoice.css('background-image', 'url(' + worker.GUIp_getResource('images/shovel.png') + ')');
	}
	if (worker.$('#hk_gold_we .l_val').text().length > 16 - 2*worker.$('.page_wrapper_5c').length) {
		$digVoice[0].classList.add('shovel');
		if (worker.$('#hk_gold_we .l_val').text().length > 20 - 3*worker.$('.page_wrapper_5c').length) {
			$digVoice[0].classList.add('compact');
		} else {
			$digVoice[0].classList.remove('compact');
		}
	} else {
		$digVoice[0].classList.remove('shovel');
	}
	//Shovel pictogramm end
};
ui_improver.improvePet = function() {
	if (ui_data.isBattle) { return; }
	if (worker.so.state.pet.pet_is_dead && worker.so.state.pet.pet_is_dead.value) {
		if (!ui_utils.isAlreadyImproved(worker.$('#pet'))) {
			worker.$('#pet .block_title').after(worker.$('<div id="pet_badge" class="fr_new_badge equip_badge_pos">0</div>'));
		}
		worker.$('#pet_badge').text(ui_utils.findLabel(worker.$('#pet'), worker.GUIp_i18n.pet_status_label).siblings('.l_val').text().replace(/[^0-9:]/g, ''));
		if (worker.$('#pet .block_content')[0].style.display === 'none') {
			worker.$('#pet_badge').show();
		}
		else {
			worker.$('#pet_badge').hide();
		}
	} else {
		if (worker.$('#pet_badge').length === 1) {
			worker.$('#pet_badge').hide();
		}
	}
	// bruise informer
	ui_informer.update('pet knocked out', worker.so.state.pet.pet_is_dead && worker.so.state.pet.pet_is_dead.value);

	ui_stats.setFromLabelCounter('Pet_Level', worker.$('#pet'), worker.GUIp_i18n.pet_level_label);
};
ui_improver.improveEquip = function() {
	// Save stats
	var seq = 0;
	for (var i = 7; i >= 1;) {
		ui_stats.set('Equip' + i--, parseInt(worker.$('#eq_' + i + ' .eq_level').text()));
		seq += parseInt(worker.$('#eq_' + i + ' .eq_level').text()) || 0;
	}
	if (!ui_utils.isAlreadyImproved(worker.$('#equipment'))) {
		worker.$('#equipment .block_title').after(worker.$('<div id="equip_badge" class="fr_new_badge equip_badge_pos">0</div>'));
	}
	worker.$('#equip_badge').text((seq / 7).toFixed(1));
};
ui_improver.GroupHP = function(flag) {
	var seq = 0;
	var $box = flag ? worker.$('#alls .opp_h') : worker.$('#opps .opp_h');
	var GroupCount = $box.length;
	if (GroupCount > 0) {
		for (var i = 0; i < GroupCount; i++) {
			if (parseInt($box[i].textContent)) {
				seq += parseInt($box[i].textContent);
			}
		}
	}
	return seq;
};
ui_improver.improvePantheons = function() {
	if (ui_storage.get('Option:relocateDuelButtons') !== undefined && ui_storage.get('Option:relocateDuelButtons').match('arena')) {
		if (!worker.$('#pantheons.arena_link_relocated').length) {
			worker.$('#pantheons').addClass('arena_link_relocated');
			worker.$('.arena_link_wrap').insertBefore(worker.$('#pantheons_content')).addClass('p_group_sep').css('padding-top', 0);
		}
	} else if (worker.$('#pantheons.arena_link_relocated').length) {
		worker.$('#pantheons').removeClass('arena_link_relocated').removeClass('both');
		worker.$('.arena_link_wrap').insertBefore(worker.$('#control .arena_msg')).removeClass('p_group_sep').css('padding-top', '0.5em');
	}
	if (ui_storage.get('Option:relocateDuelButtons') !== undefined && ui_storage.get('Option:relocateDuelButtons').match('chf')) {
		if (!worker.$('#pantheons.chf_link_relocated').length) {
			worker.$('#pantheons').addClass('chf_link_relocated');
			worker.$('.chf_link_wrap:first').insertBefore(worker.$('#pantheons_content'));
			worker.$('#pantheons .chf_link_wrap').addClass('p_group_sep');
		}
	} else if (worker.$('#pantheons.chf_link_relocated').length) {
		worker.$('#pantheons').removeClass('chf_link_relocated').removeClass('both');
		worker.$('.chf_link_wrap').removeClass('p_group_sep');
		worker.$('#pantheons .chf_link_wrap').insertAfter(worker.$('#control .arena_msg'));
	}
	if (worker.$('#pantheons.arena_link_relocated.chf_link_relocated:not(.both)').length) {
		worker.$('#pantheons').addClass('both');
		worker.$('#pantheons .chf_link_wrap').insertBefore(worker.$('#pantheons_content'));
		worker.$('.arena_link_wrap').removeClass('p_group_sep');
	}
};
ui_improver.improveDiary = function() {
	if (ui_data.isBattle) { return; }
	var i, len;
	if (this.isFirstTime) {
		var $msgs = document.querySelectorAll('#diary .d_msg:not(.parsed)');
		for (i = 0, len = $msgs.length; i < len; i++) {
			$msgs[i].classList.add('parsed');
		}
	} else {
		var newMessages = worker.$('#diary .d_msg:not(.parsed)');
		if (newMessages.length) {
			if (this.voiceSubmitted) {
				if (newMessages.length - document.querySelectorAll('#diary .d_msg:not(.parsed) .vote_links_b').length >= 2) {
					ui_timeout.start();
				}
				worker.$('#god_phrase').change();
				this.voiceSubmitted = false;
			}
			newMessages.addClass('parsed');
		}
	}
};
ui_improver.parseDungeonPhrases = function(xhr) {
	for (var i = 0, temp, len = this.dungeonPhrases.length; i < len; i++) {
		temp = xhr.responseText.match(new RegExp('<p>' + this.dungeonPhrases[i] + '\\b([\\s\\S]+?)<\/p>'))[1].replace(/&#8230;/g, '...').replace(/^<br>\n|<br>$/g, '').replace(/<br>\n/g, '|');
		this[this.dungeonPhrases[i] + 'RegExp'] = new RegExp(temp);
		ui_storage.set('Dungeon:' + this.dungeonPhrases[i] + 'Phrases', temp);
	}
	this.improveChronicles();
};
ui_improver.getDungeonPhrases = function() {
	if (!ui_storage.get('Dungeon:bossPhrases')) {
		ui_utils.getXHR('/gods/' + (worker.GUIp_locale === 'ru' ? 'Спандарамет' : 'God Of Dungeons'), this.parseDungeonPhrases.bind(this));
	} else {
		for (var i = 0, temp, len = this.dungeonPhrases.length; i < len; i++) {
			this[this.dungeonPhrases[i] + 'RegExp'] = new RegExp(ui_storage.get('Dungeon:' + this.dungeonPhrases[i] + 'Phrases'));
		}
		this.improveChronicles();
	}
};
ui_improver.parseChronicles = function(xhr) {
	var last;
	if (document.querySelector('.sort_ch').textContent === '▼') {
		var temp = document.querySelectorAll('#m_fight_log .d_line .d_msg:not(.m_infl)');
		last = temp[temp.length - 1].textContent;
	} else {
		last = document.querySelector('#m_fight_log .d_line .d_msg:not(.m_infl)').textContent;
	}
	this.old_chronicles = [];
	var direction, entry, matches = xhr.responseText.match(/<div class="text_content ">[\s\S]+?<\/div>/g);
	for (var i = 0, len = matches.length; i < len; i++) {
		matches[i] = matches[i].replace('<div class="text_content ">', '').replace('</div>', '').trim();
		if (matches[i] === last) {
			break;
		} else {
			entry = {};
			direction = matches[i].match(/^.*?[\.!\?](?:\s|$)/)[0].match(/север|восток|юг|запад|north|east|south|west/i);
			if (direction) {
				entry.direction = direction[0];
			}
			for (var j = 0, len2 = this.dungeonPhrases.length; j < len2; j++) {
				if (matches[i].match(this[this.dungeonPhrases[j] + 'RegExp'])) {
					if (!entry.classList) {
						entry.classList = [];
					}
					entry.classList.push(this.dungeonPhrases[j]);
				}
			}
			this.old_chronicles.push(entry);
		}
	}
};
ui_improver.improveChronicles = function() {
	if (this.bossRegExp) {
		// chronicles painting
		var chronicles = document.querySelectorAll('#m_fight_log .d_msg:not(.parsed)');
		for (var i = 0, len = chronicles.length; i < len; i++) {
			for (var j = 0, len2 = this.dungeonPhrases.length; j < len2; j++) {
				if (chronicles[i].textContent.match(this[this.dungeonPhrases[j] + 'RegExp'])) {
					chronicles[i].parentNode.classList.add(this.dungeonPhrases[j]);
				}
			}
			chronicles[i].classList.add('parsed');
		}

		// informer
		ui_informer.update('close to boss', document.querySelector('.sort_ch').textContent === '▼' ? document.querySelectorAll('#m_fight_log .d_line.warning:nth-child(1)').length : document.querySelectorAll('#m_fight_log .d_line.warning:last-child').length);

		this.colorDungeonMap();
	}
	if (this.isFirstTime) {
		ui_utils.getXHR('/duels/log/' + worker.so.state.stats.perm_link.value, this.parseChronicles.bind(this));
	}
	ui_storage.set('Log:current', worker.so.state.stats.perm_link.value);
	ui_storage.set('Log:' + worker.so.state.stats.perm_link.value + ':steps', worker.$('#m_fight_log .block_title').text().match(/\d+/)[0]);
	ui_storage.set('Log:' + worker.so.state.stats.perm_link.value + ':map', JSON.stringify(worker.so.state.d_map));
};
ui_improver.colorDungeonMap = function() {
	// map cells painting
	var first_sentence, direction, step, i, len, j, len2,
		x = ui_utils.getNodeIndex(document.getElementsByClassName('map_pos')[0]),
		y = ui_utils.getNodeIndex(document.getElementsByClassName('map_pos')[0].parentNode),
		chronicles = document.querySelectorAll('.d_msg:not(.m_infl)'),
		ch_down = document.querySelector('.sort_ch').textContent === '▼';
	for (len = chronicles.length, i = ch_down ? 0 : len - 1; ch_down ? i < len : i >= 0; ch_down ? i++ : i--) {
		for (j = 0, len2 = this.dungeonPhrases.length; j < len2; j++) {
			if (chronicles[i].parentNode.classList.contains(this.dungeonPhrases[j])) {
				document.querySelectorAll('#map .dml')[y].children[x].classList.add(this.dungeonPhrases[j]);
			}
		}
		first_sentence = chronicles[i].textContent.match(/^.*?[\.!\?](?:\s|$)/);
		if (first_sentence) {
			direction = first_sentence[0].match(/север|восток|юг|запад|north|east|south|west/i);
			step = first_sentence[0].match(this.jumpingDungeonRegExp) ? 2 : 1;
			if (direction) {
				switch(direction[0]) {
				case 'север':
				case 'north': y += step; break;
				case 'восток':
				case 'east': x -= step; break;
				case 'юг':
				case 'south': y -= step; break;
				case 'запад':
				case 'west': x += step; break;
				}
			}
		}
	}
	if (this.old_chronicles && this.old_chronicles.length) {
		for (i = this.old_chronicles.length - 1; i >= 0; i--) {
			if (this.old_chronicles[i].classList) {
				for (j = 0, len2 = this.old_chronicles[i].classList.length; j < len2; j++) {
					document.querySelectorAll('#map .dml')[y].children[x].classList.add(this.old_chronicles[i].classList[j]);
				}
			}
			direction = this.old_chronicles[i].direction;
			step = this.old_chronicles[i].classList && this.old_chronicles[i].classList.indexOf('jumpingDungeon') >= 0 ? 2 : 1;
			if (direction) {
				switch(direction) {
				case 'север':
				case 'north': y += step; break;
				case 'восток':
				case 'east': x -= step; break;
				case 'юг':
				case 'south': y -= step; break;
				case 'запад':
				case 'west': x += step; break;
				}
			}
		}
	}
};
ui_improver.whenWindowResize = function() {
	this.chatsFix();
	//body widening
	worker.$('body').width(worker.$(worker).width() < worker.$('#main_wrapper').width() ? worker.$('#main_wrapper').width() : '');
};
ui_improver.improveInterface = function() {
	if (this.isFirstTime) {
		worker.$('a[href=#]').removeAttr('href');
		this.whenWindowResize();
		worker.$(worker).resize((function() {
			clearInterval(this.windowResizeInt);
			this.windowResizeInt = setTimeout(this.whenWindowResize.bind(this), 250);
		}).bind(this));
		if (ui_data.isBattle) {
			document.querySelector('#map .block_title, #control .block_title, #m_control .block_title').insertAdjacentHTML('beforeend', ' <a class="broadcast" href="/duels/log/' + worker.so.state.stats.perm_link.value + '" target="_blank">' + worker.GUIp_i18n.broadcast + '</a>');
		}
	}
	if (this.isFirstTime || ui_storage.get('UserCssChanged') === true) {
		ui_storage.set('UserCssChanged', false);
		worker.GUIp_addCSSFromString(ui_storage.get('UserCss'));
	}

	if (worker.localStorage.ui_s !== ui_storage.get('ui_s')) {
		ui_storage.set('ui_s', worker.localStorage.ui_s || 'th_classic');
		this.Shovel = false;
		if (document.body.classList.contains('has_temple')) {
			document.body.className = 'has_temple';
		} else {
			document.body.className = '';
		}
		document.body.classList.add(ui_storage.get('ui_s').replace('th_', ''));
	}

	if (ui_storage.get('Option:useBackground') === 'cloud') {
		if (worker.$('body').css('background-image') !== 'url(' + worker.GUIp_getResource("images/background.jpg") + ')') {
			worker.$('body').css('background-image', 'url(' + worker.GUIp_getResource("images/background.jpg") + ')');
		}
	} else if (ui_storage.get('Option:useBackground')) {
		//Mini-hash to check if that is the same background
		var hash = 0, ch, str = ui_storage.get('Option:useBackground');
		for (var i = 0; i < str.length; i++) {
			ch = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+ch;
			hash = hash & hash; // Convert to 32bit integer
		}
		if (hash !== this.hash) {
			this.hash = hash;
			worker.$('body').css('background-image', 'url(' + ui_utils.escapeHTML(str) + ')');
		}
	} else {
		if (worker.$('body').css('background-image')) {
			worker.$('body').css('background-image', '');
		}
	}
};
ui_improver.improveChat = function() {
	var i, len;

	// friends fetching
	if (this.isFirstTime && (ui_data.isBattle || ui_data.isDungeon)) {
		var $friends = document.querySelectorAll('.frline .frname'),
			friends = [];
		for (i = 0, len = $friends.length; i < len; i++) {
			friends.push($friends[i].textContent);
		}
		this.friendsRegexp = new RegExp('^(?:' + friends.join('|') + ')$');
	}

	// links replace
	var $cur_msg, $msgs = worker.$('.fr_msg_l:not(.improved)'),
		$temp = worker.$('<div id="temp" />');
	worker.$('body').append($temp);
	for (i = 1, len = $msgs.length; i < len; i++) {
		$cur_msg = $msgs.eq(i);
		$temp.append(worker.$('.fr_msg_meta', $cur_msg)).append(worker.$('.fr_msg_delete', $cur_msg));
		var text = $cur_msg.text();
		$cur_msg.empty();
		$cur_msg.append(ui_utils.escapeHTML(text).replace(/(https?:\/\/[^ \n\t]*[^\?\!\.\n\t ]+)/g, '<a href="$1" target="_blank" title="' + worker.GUIp_i18n.open_in_a_new_tab + '">$1</a>'));
		$cur_msg.append(worker.$('.fr_msg_meta', $temp)).append(worker.$('.fr_msg_delete', $temp));
	}
	$msgs.addClass('improved');
	$temp.remove();

	// godnames in gc paste fix
	worker.$('.gc_fr_god:not(.improved)').unbind('click').click(function() {
		var ta = this.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('textarea'),
			pos = ta.selectionDirection === 'backward' ? ta.selectionStart : ta.selectionEnd;
		ta.value = ta.value.slice(0, pos) + '@' + this.textContent + ', ' + ta.value.slice(pos);
		ta.focus();
		ta.selectionStart = ta.selectionEnd = pos + this.textContent.length + 3;
	}).addClass('improved');

	//"Shift+Enter → new line" improvement
	var keypresses, handlers,
	$tas = worker.$('.frInputArea textarea:not(.improved)');
	if ($tas.length) {
		var new_keypress = function(handlers) {
			return function(e) {
				if (e.which === 13 && !e.shiftKey) {
					for (var i = 0, len = handlers.length; i < len; i++) {
						handlers[i](e);
					}
				}
			};
		};
		for (i = 0, len = $tas.length; i < len; i++) {
			keypresses = worker.$._data($tas[i], 'events').keypress;
			handlers = [];
			for (var j = 0, klen = keypresses.length; j < klen; j++) {
				handlers.push(keypresses[j].handler);
			}
			$tas.eq(i).unbind('keypress').keypress(new_keypress(handlers));
		}
		$tas.addClass('improved');
		new_keypress = null;
	}
};
ui_improver.improveAllies = function() {
	var i, len, popover, allies_buttons = document.querySelectorAll('#alls .opp_dropdown.popover-button');
	if (this.isFirstTime) {
		this.alliesCount = allies_buttons.length;
		for (i = 0; i < 5; i++) {
			popover = document.getElementById('popover_opp_all' + i);
			if (popover) {
				popover.parentNode.parentNode.classList.add('hidden');
			}
		}
	}
	if (this.currentAlly < this.alliesCount) {
		this.currentAllyObserver = this.currentAlly;
		allies_buttons[this.currentAlly].click();
	} else {
		document.body.click();
		while ((popover = document.querySelector('.popover.hidden'))) {
			popover.classList.remove('hidden');
		}
	}
};
ui_improver.checkButtonsVisibility = function() {
	worker.$('.arena_link_wrap,.chf_link_wrap,.cvs_link_wrap', worker.$('#pantheons')).hide();
	if (ui_storage.get('Stats:Godpower') >= 50) {
		worker.$('#pantheons .chf_link_wrap').show();
		worker.$('#pantheons .cvs_link_wrap').show();
		worker.$('#pantheons .arena_link_wrap').show();
	}
	worker.$('.craft_button,.inspect_button,.voice_generator').hide();
	if (ui_storage.get('Stats:Godpower') >= 5 && !ui_storage.get('Option:disableVoiceGenerators')) {
		worker.$('.voice_generator, .inspect_button').show();
		if (ui_storage.get('Option:disableDieButton')) {
			worker.$('#hk_death_count .voice_generator').hide();
		}
		if (this.b_b.length) { worker.$('.b_b').show(); }
		if (this.b_r.length) { worker.$('.b_r').show(); }
		if (this.r_r.length) { worker.$('.r_r').show(); }
		if (worker.$('.b_b:visible, .b_r:visible, .r_r:visible').length) { worker.$('span.craft_button').show(); }
		//if (worker.$('.f_news').text() !== 'Возвращается к заданию...')fc
		if (!ui_data.isBattle) {
			if (worker.$('#hk_distance .l_capt').text().match(/Город|Current Town/) || worker.$('.f_news').text().match('дорогу') || worker.$('#news .line')[0].style.display !== 'none') { worker.$('#hk_distance .voice_generator').hide(); }
			//if (ui_storage.get('Stats:Godpower') === 100) worker.$('#control .voice_generator').hide();
			if (worker.$('#control .p_val').width() === worker.$('#control .p_bar').width() || worker.$('#news .line')[0].style.display !== 'none') { worker.$('#control .voice_generator')[0].style.display = 'none'; }
			if (worker.$('#hk_distance .l_capt').text().match(/Город|Current Town/)) { worker.$('#control .voice_generator')[1].style.display = 'none'; }
		}
		if (worker.$('#hk_quests_completed .q_name').text().match(/\(выполнено\)/)) { worker.$('#hk_quests_completed .voice_generator').hide(); }
		if (worker.$('#hk_health .p_val').width() === worker.$('#hk_health .p_bar').width()) { worker.$('#hk_health .voice_generator').hide(); }
	}
};
ui_improver.chatsFix = function() {
	var i, len, cells = document.querySelectorAll('.frDockCell');
	for (i = 0, len = cells.length; i < len; i++) {
		cells[i].classList.remove('left');
		cells[i].style.zIndex = len - i;
		if (cells[i].getBoundingClientRect().right < 350) {
			cells[i].classList.add('left');
		}
	}
	//padding for page settings link
	var padding_bottom = worker.$('.frDockCell:first').length ? Math.floor(worker.$('.frDockCell:first').position().top + worker.$('.frDockCell').height()) : 0,
		isBottom = worker.scrollY >= worker.scrollMaxY - 10;
	padding_bottom = Math.floor(padding_bottom*10)/10 + 10;
	padding_bottom = (padding_bottom < 0) ? 0 : padding_bottom + 'px';
	worker.$('.reset_layout').css('padding-bottom', padding_bottom);
	if (isBottom) {
		worker.scrollTo(0, worker.scrollMaxY);
	}
};
ui_improver.initSoundsOverride = function() {
	if (worker.so && worker.so.a_notify) {
		worker.so.a_notify_orig = worker.so.a_notify;
		worker.so.a_notify = function() {
			if (ui_storage.get('Option:disableArenaSound')) {
				if((worker.$(document.activeElement).is("input") || worker.$(document.activeElement).is("textarea")) &&
					worker.$(document.activeElement).attr("id") !== "god_phrase" &&
					worker.$(document.activeElement).val().length > 3) {
					var readyness = confirm(Loc.duel_switch_confirm);
					if (!readyness)  {
						return false;
					}
				}
				setTimeout(function() {
					document.location.href = document.location.pathname;
				}, 3e3);
			} else {
				worker.so.a_notify_orig();
			}
		};
	}
	if (worker.so && worker.so.play_sound) {
		worker.so.play_sound_orig = worker.so.play_sound;
		worker.so.play_sound = function(a, b) {
			if (!(ui_storage.get('Option:disablePmSound') && a === 'msg.mp3')) {
				worker.so.play_sound_orig(a, b);
			}
		};
	}
};
ui_improver.activity = function() {
	if (!ui_logger.Updating) {
		ui_logger.Updating = true;
		setTimeout(function() {
			ui_logger.Updating = false;
		}, 500);
		ui_logger.update();
	}
};
ui_improver.nodeInsertion = function() {
	if (!this.improveInProcess) {
		this.improveInProcess = true;
		setTimeout(this.nodeInsertionDelay.bind(this), 50);
	}
};
ui_improver.nodeInsertionDelay = function() {
	this.improve();
	if (ui_data.isBattle) {
		ui_logger.update();
	}
};