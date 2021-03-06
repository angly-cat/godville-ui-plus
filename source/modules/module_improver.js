// improver
window.GUIp = window.GUIp || {};

GUIp.improver = {};

GUIp.improver.init = function() {
    if (GUIp.stats.isField()) {
        window.onmousemove = window.onscroll = window.ontouchmove = GUIp.improver.activity;
    }

    if (GUIp.browser === 'firefox') {
        // svg for #logger fade-out in FF
        var is5c = document.getElementsByClassName('page_wrapper_5c').length;
        document.getElementById('guip').insertAdjacentHTML('beforeend',
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
    }

    GUIp.utils.addCSS();
    GUIp.utils.inform();

    GUIp.improver.improve();
};

GUIp.improver.improveTmt = 0;
GUIp.improver.isFirstTime = true;
GUIp.improver.pmParsed = false;
GUIp.improver.pmNoted = {};
GUIp.improver.voiceSubmitted = false;
GUIp.improver.wantedMonsters = null;
GUIp.improver.friendsRegExp = null;
GUIp.improver.windowResizeInt = 0;
GUIp.improver.mapColorizationTmt = 0;
// dungeon
GUIp.improver.chronicles = {};
GUIp.improver.directionlessMoveIndex = 0;
GUIp.improver.dungeonPhrases = [
    'bossHint',
    'boss',
    'bonusGodpower',
    'bonusHealth',
    'trapUnknown',
    'trapTrophy',
    'trapGold',
    'trapLowDamage',
    'trapModerateDamage',
    'trapMoveLoss',
    'jumpingDungeon',
    'pointerMarker'
];
GUIp.improver.corrections = { n: 'north', e: 'east', s: 'south', w: 'west' };
GUIp.improver.pointerRegExp = new RegExp('[^а-яa-z](северо-восток|северо-запад|юго-восток|юго-запад|' +
                                                        'север|восток|юг|запад|' +
                                                        'очень холодно|холодно|свежо|тепло|очень горячо|горячо|' +
                                                        'north-east|north-west|south-east|south-west|' +
                                                        'north|east|south|west|' +
                                                        'freezing|very cold|cold|mild|warm|hot|burning|very hot|hot)', 'gi');
GUIp.improver.dungeonXHRCount = 0;
GUIp.improver.needLog = true;
// resresher
GUIp.improver.softRefreshInt = 0;
GUIp.improver.hardRefreshInt = 0;
GUIp.improver.softRefresh = function() {
    window.console.info('Godville UI+ log: Soft reloading...');
    document.getElementById('d_refresh').click();
};
GUIp.improver.hardRefresh = function() {
    window.console.warn('Godville UI+ log: Hard reloading...');
    document.location.reload();
};
GUIp.improver.improve = function() {
    GUIp.improver.improveInProcess = true;
    //GUIp.informer.update('fight', !GUIp.stats.isField());
    //GUIp.informer.update('arena available', GUIp.stats.isArenaAvailable());
    //GUIp.informer.update('dungeon available', GUIp.stats.isDungeonAvailable());

    GUIp.improver.optionsChanged = GUIp.improver.isFirstTime ? false : GUIp.storage.get('optionsChanged');
    if (GUIp.improver.isFirstTime) {
        if (GUIp.stats.isField()) {
            //GUIp.improver.improveDiary();
        } else if (GUIp.stats.isDungeon()) {
            GUIp.improver.getDungeonPhrases();
        }
    }
    //GUIp.improver.improveStats();
    /*if (GUIp.stats.isField()) {
        GUIp.improver.improvePet();
    }*/
    //GUIp.improver.improveVoiceDialog();
    /*if (GUIp.stats.isField()) {
        GUIp.improver.improveNews();
        GUIp.improver.improveEquip();
        GUIp.improver.improvePantheons();
    }*/
    if (GUIp.improver.isFirstTime && GUIp.stats.isDungeon()) {
        GUIp.improver.improveMap();
    }
    GUIp.improver.improveInterface();
    //GUIp.improver.improveChat();
    /*if (!GUIp.stats.isField()) {
        GUIp.improver.improveAllies();
    }*/
    //GUIp.improver.calculateButtonsVisibility();
    GUIp.improver.isFirstTime = false;
    GUIp.improver.improveInProcess = false;
    GUIp.storage.set('optionsChanged', false);
};
GUIp.improver.improveVoiceDialog = function() {
    // If playing in pure ZPG mode there won't be control block at all.
    if (!document.querySelector('#control, #m_control')) {
        if (GUIp.improver.isFirstTime) {
            GUIp.improver.isPureZPG = true;
        }
        return;
    }
    if (GUIp.improver.isFirstTime || GUIp.improver.optionsChanged) {
        GUIp.improver.freezeVoiceButton = GUIp.storage.get('Option:freezeVoiceButton') || '';
    }
    // Add voicegens and show timeout bar after saying
    var controlDialog = document.getElementById('cntrl');
    if (!GUIp.utils.isAlreadyImproved(controlDialog)) {
        if (GUIp.improver.freezeVoiceButton.match('when_empty')) {
            GUIp.utils.setVoiceSubmitState(GUIp.utils.BUTTON_ENABLED);
        }
        var voiceInput = document.querySelector('#godvoice, #god_phrase');
        voiceInput.onchange =
        voiceInput.oncut    =
        voiceInput.onfocus  =
        voiceInput.oninput  =
        voiceInput.onpaste  = function() {
            if (voiceInput) {
                GUIp.utils.setVoice(voiceInput.value);
            }
        };
        document.onclick = function(e) {
            if (e.target.classList &&
                e.target.classList.contains('gv_text') &&
                e.target.classList.contains('div_link') &&
                voiceInput
            ) {
                GUIp.utils.setVoice(voiceInput.value);
            }
        };
        document.querySelector('#ve_wrap, #voice_edit_wrap').insertAdjacentHTML('afterbegin', '<div id="clear_voice_input" class="div_link_nu gvl_popover hidden" title="' + GUIp.i18n.clear_voice_input + '">×</div>');
        document.getElementById('clear_voice_input').onclick = function() {
            GUIp.utils.setVoice('');
        };
        document.getElementById('voice_submit').onclick = function() {
            GUIp.utils.hideElem(document.getElementById('clear_voice_input'), true);
            GUIp.improver.voiceSubmitted = true;
        };

        var gp_label = document.getElementsByClassName('gp_label')[0];
        gp_label.classList.add('l_capt');
        document.getElementsByClassName('gp_val')[0].classList.add('l_val');
        if (GUIp.stats.isDungeon()) {
            var isContradictions = document.getElementById('map').textContent.match(/Противоречия|Disobedience/);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.east, (isContradictions ? 'go_west' : 'go_east'), GUIp.i18n.ask3 + GUIp.data.char_sex[0] + GUIp.i18n.go_east);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.west, (isContradictions ? 'go_east' : 'go_west'), GUIp.i18n.ask3 + GUIp.data.char_sex[0] + GUIp.i18n.go_west);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.south, (isContradictions ? 'go_north' : 'go_south'), GUIp.i18n.ask3 + GUIp.data.char_sex[0] + GUIp.i18n.go_south);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.north, (isContradictions ? 'go_south' : 'go_north'), GUIp.i18n.ask3 + GUIp.data.char_sex[0] + GUIp.i18n.go_north);
        } else if (GUIp.stats.isFight()) {
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.defend, 'defend', GUIp.i18n.ask4 + GUIp.data.char_sex[0] + GUIp.i18n.to_defend);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.pray, 'pray', GUIp.i18n.ask5 + GUIp.data.char_sex[0] + GUIp.i18n.to_pray);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.heal, 'heal', GUIp.i18n.ask6 + GUIp.data.char_sex[1] + GUIp.i18n.to_heal);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.hit, 'hit', GUIp.i18n.ask7 + GUIp.data.char_sex[1] + GUIp.i18n.to_hit);
        } else if (GUIp.stats.isField()) {
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.sacrifice, 'sacrifice', GUIp.i18n.ask8 + GUIp.data.char_sex[1] + GUIp.i18n.to_sacrifice);
            GUIp.utils.addVoicegen(gp_label, GUIp.i18n.pray, 'pray', GUIp.i18n.ask5 + GUIp.data.char_sex[0] + GUIp.i18n.to_pray);
        }
    }

    GUIp.informer.update('full godpower', GUIp.stats.Godpower() === GUIp.stats.Max_Godpower() && !GUIp.data.isDungeon);
};
GUIp.improver.improveNews = function() {
    if (!GUIp.utils.isAlreadyImproved(document.getElementById('news'))) {
        GUIp.utils.addVoicegen(document.querySelector('#news .l_capt'), GUIp.i18n.hit, 'hit', GUIp.i18n.ask7 + GUIp.data.char_sex[1] + GUIp.i18n.to_hit);
    }
    var isWantedMonster = false,
        isSpecialMonster = false,
        isTamableMonster = false,
        isFavoriteMonster = false;
    // Если герой дерется с монстром
    var currentMonster = GUIp.stats.monsterName();
    if (currentMonster) {
        isWantedMonster = GUIp.improver.wantedMonsters && currentMonster.match(GUIp.improver.wantedMonsters);
        if (GUIp.words.base.special_monsters.length) {
            isSpecialMonster = currentMonster.match(new RegExp(GUIp.words.base.special_monsters.join('|'),'i'));
        }
        if (GUIp.words.base.chosen_monsters.length) {
            isFavoriteMonster = currentMonster.match(new RegExp(GUIp.words.base.chosen_monsters.join('|'),'i'));
        }
        if (!GUIp.stats.heroHasPet()) {
            var hasArk = GUIp.stats.Logs() >= 1000;
            var pet, hero_level = GUIp.stats.Level();
            for (var i = 0; i < GUIp.words.base.pets.length; i++) {
                pet = GUIp.words.base.pets[i];
                if (currentMonster.toLowerCase() === pet.name.toLowerCase() && hero_level >= pet.min_level && hero_level <= (pet.min_level + (hasArk ? 29 : 14))) {
                    isTamableMonster = true;
                    break;
                }
            }
        }
    }

    GUIp.informer.update('wanted monster', isWantedMonster);
    GUIp.informer.update('special monster', isSpecialMonster);
    GUIp.informer.update('tamable monster', isTamableMonster);
    GUIp.informer.update('chosen monster', isFavoriteMonster);

    if (GUIp.stats.hasTemple() && GUIp.improver.optionsChanged) {
        GUIp.timers.layingTimerIsDisabled = GUIp.storage.get('Option:disableLayingTimer');
        GUIp.utils.hideElem(GUIp.timers.layingTimer ? GUIp.timers.layingTimer : GUIp.timers.logTimer, GUIp.timers.layingTimerIsDisabled); // todo: if it's got enabled, it should also be made clickable and switchable.
        GUIp.timers.tick();
    }
};
GUIp.improver.improveMap = function() {
    if (GUIp.improver.isFirstTime) {
        var legendDiv;
        try {
            legendDiv = document.getElementsByClassName('map_legend')[0].nextElementSibling;
        } catch(e) {
            var block_content = document.querySelector('#map .block_content');
            block_content.insertAdjacentHTML('beforeend', '<div class="map_legend div_link">' + GUIp.i18n.legend + '</div>');
            block_content.insertAdjacentHTML('beforeend', '<div class="map_legend_container" style="display: none;"></div>');
            var legendButton = document.getElementsByClassName('map_legend')[0];
            legendDiv = document.getElementsByClassName('map_legend_container')[0];
            legendButton.onclick = function() {
                legendDiv.style.display = legendDiv.style.display === 'none' ? 'block' : 'none';
            };
        }
        legendDiv.style.marginLeft = 0;
        legendDiv.insertAdjacentHTML('beforeend',
            '<div class="guip_legend"><div class="dmc bossHint"></div><div> - ' + GUIp.i18n.boss_warning_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc boss"></div><div> - ' + GUIp.i18n.boss_slay_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc bonusGodpower"></div><div> - ' + GUIp.i18n.small_prayer_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc bonusHealth"></div><div> - ' + GUIp.i18n.small_healing_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc trapUnknown"></div><div> - ' + GUIp.i18n.unknown_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc trapTrophy"></div><div> - ' + GUIp.i18n.trophy_loss_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc trapLowDamage"></div><div> - ' + GUIp.i18n.low_damage_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc trapModerateDamage"></div><div> - ' + GUIp.i18n.moderate_damage_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc trapMoveLoss"></div><div> - ' + GUIp.i18n.move_loss_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc bossHint trapMoveLoss"></div><div> - ' + GUIp.i18n.boss_warning_and_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc boss trapMoveLoss"></div><div> - ' + GUIp.i18n.boss_slay_and_trap_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc" style="color: red;">?</div><div> - ' + GUIp.i18n.treasury_hint + '</div></div>' +
            '<div class="guip_legend"><div class="dmc" style="color: darkorange;">?</div><div> - ' + GUIp.i18n.treasury_th_hint + '</div></div>'
        );
    }
    if (document.querySelectorAll('#map .dml').length) {
        var i, j, ik, jk, len, directionVoicegens, chronolen = +Object.keys(GUIp.improver.chronicles).reverse()[0],
            mapRows = document.querySelectorAll('#map .dml'),
            kRow = mapRows.length,
            kColumn = mapRows[0].textContent.length,
            isJumping = document.getElementById('map').textContent.match(/Прыгучести|Jumping|Загадки|Mystery/), /* [E] allow moving almost everywhere in Mystery as it could be Jumping or Disobedience */
            regularPointersCount = 0,          // count of any pointers
            thermoPointersCount = 0, // count of thermo pointers
            MapArray = [];
        var REGULAR_POINTER_MATCH = 1024;
        var THERMO_POINTER_MATCH = 128;
        for (i = 0; i < kRow; i++) {
            MapArray[i] = [];
            for (j = 0; j < kColumn; j++) {
                MapArray[i][j] = 0;
            }
        }
        directionVoicegens = document.querySelectorAll('#cntrl .voice_generator');
        if (!GUIp.improver.isPureZPG && directionVoicegens.length) {
            // Гласы направления делаем невидимыми
            for (i = 0; i < 4; i++) {
                directionVoicegens[i].style.visibility = 'hidden';
            }
        }
        for (var si = 0; si < kRow; si++) {
            for (var sj = 0; sj < kColumn; sj++) {
                var pointer = mapRows[si].children[sj].textContent.trim();

                // Check for heroes position and voicegens
                if (pointer === '@') {
                    if (!GUIp.improver.isPureZPG && directionVoicegens.length) {
                        var isMoveLoss = [];
                        for (i = 0; i < 4; i++) {
                            isMoveLoss[i] = chronolen > i && GUIp.improver.chronicles[chronolen - i].marks.indexOf('trapMoveLoss') !== -1;
                        }
                        var directionsShouldBeShown = !isMoveLoss[0] || (isMoveLoss[1] && (!isMoveLoss[2] || isMoveLoss[3]));
                        if (directionsShouldBeShown) {
                            //    Проверяем куда можно пройти
                            if (mapRows[si - 1].children[sj].textContent.trim() !== '#' || isJumping && (si === 1 || mapRows[si - 2].children[sj].textContent.trim() !== '#')) {
                                directionVoicegens[0].style.visibility = '';    //    Север
                            }
                            if (mapRows[si + 1].children[sj].textContent.trim() !== '#' || isJumping && (si === kRow - 2 || mapRows[si + 2].children[sj].textContent.trim() !== '#')) {
                                directionVoicegens[1].style.visibility = '';    //    Юг
                            }
                            if (mapRows[si].children[sj - 1].textContent.trim() !== '#' || isJumping && (sj === 1 || mapRows[si].children[sj - 2].textContent.trim() !== '#')) {
                                directionVoicegens[2].style.visibility = '';    //    Запад
                            }
                            if (mapRows[si].children[sj + 1].textContent.trim() !== '#' || isJumping && (sj === kColumn - 2 || mapRows[si].children[sj + 2].textContent.trim() !== '#')) {
                                directionVoicegens[3].style.visibility = '';    //    Восток
                            }
                        }
                    }
                }
                // Ищем указатели
                var ij, ttl = '';
                var chronopointers = chronolen > 1 ? GUIp.improver.chronicles[chronolen].pointers : [];
                /* [E] check if current position has some directions in chronicle */
                if (pointer === '@' && chronopointers.length) {
                    for (i = 0, len = chronopointers.length; i < len; i++) {
                        switch (chronopointers[i]) {
                            case 'north_east': ttl += '↗'; break;
                            case 'north_west': ttl += '↖'; break;
                            case 'south_east': ttl += '↘'; break;
                            case 'south_west': ttl += '↙'; break;
                            case 'north':      ttl += '↑'; break;
                            case 'east':       ttl += '→'; break;
                            case 'south':      ttl += '↓'; break;
                            case 'west':       ttl += '←'; break;
                            case 'freezing': ttl += '✵'; break;
                            case 'cold':     ttl += '❄'; break;
                            case 'mild':     ttl += '☁'; break;
                            case 'warm':     ttl += '♨'; break;
                            case 'hot':      ttl += '☀'; break;
                            case 'burning':  ttl += '✺'; break;
                        }
                    }
                    //window.console.log("current position has pointers: "+ttl);
                }
                if (pointer.match(/[←→↓↑↙↘↖↗⌊⌋⌈⌉∨<∧>]/) || ttl.match(/[←→↓↑↙↘↖↗]/)) {
                    regularPointersCount++;
                    mapRows[si].children[sj].style.color = 'green';
                    /* [E] get directions from the arrows themselves, not relying on parsed chronicles */
                    if (!ttl.length) {
                        switch (pointer) {
                            case '⌊': ttl = '↑→'; break;
                            case '⌋': ttl = '↑←'; break;
                            case '⌈': ttl = '↓→'; break;
                            case '⌉': ttl = '↓←'; break;
                            case '∨': ttl = '↖↗'; break;
                            case '<': ttl = '↗↘'; break;
                            case '∧': ttl = '↙↘'; break;
                            case '>': ttl = '↖↙'; break;
                            default: ttl = pointer; break;
                        }
                    }
                    for (ij = 0, len = ttl.length; ij < len; ij++) {
                        if (ttl[ij].match(/[→←↓↑↘↙↖↗]/)) {
                            for (ik = 0; ik < kRow; ik++) {
                                for (jk = 0; jk < kColumn; jk++) {
                                    var relativeX = jk - sj;
                                    var relativeY = ik - si;
                                    var arrow = ttl[ij];
                                    if (arrow === '→' && 5*relativeY <   relativeX && 5*relativeY >    -relativeX ||
                                        arrow === '←' && 5*relativeY >   relativeX && 5*relativeY <    -relativeX ||
                                        arrow === '↓' &&   relativeY > 5*relativeX &&   relativeY >  -5*relativeX ||
                                        arrow === '↑' &&   relativeY < 5*relativeX &&   relativeY <  -5*relativeX ||
                                        arrow === '↘' && 5*relativeY >=  relativeX &&   relativeY <=  5*relativeX ||
                                        arrow === '↙' && 5*relativeY >= -relativeX &&   relativeY <= -5*relativeX ||
                                        arrow === '↖' && 5*relativeY <=  relativeX &&   relativeY >=  5*relativeX ||
                                        arrow === '↗' && 5*relativeY <= -relativeX &&   relativeY >= -5*relativeX
                                    ) {
                                        if (!(relativeX === 0 && relativeY === 0) && MapArray[ik][jk] >= 0) {
                                            MapArray[ik][jk] += REGULAR_POINTER_MATCH;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (pointer.match(/[✺☀♨☁❄✵]/) || ttl.match(/[✺☀♨☁❄✵]/)) {
                    thermoPointersCount++;
                    mapRows[si].children[sj].style.color = 'green';
                    /* [E] if we're standing on the pointer - use parsed value from chronicle */
                    if (ttl.length) {
                        pointer = ttl;
                    }
                    var ThermoMinStep = 0;    //    Минимальное количество шагов до клада
                    var ThermoMaxStep = 0;    //    Максимальное количество шагов до клада
                    switch(pointer) {
                        case '✺': ThermoMinStep = 1; ThermoMaxStep = 2; break;    //    ✺ - очень горячо(1-2)
                        case '☀': ThermoMinStep = 3; ThermoMaxStep = 5; break;    //    ☀ - горячо(3-5)
                        case '♨': ThermoMinStep = 6; ThermoMaxStep = 9; break;    //    ♨ - тепло(6-9)
                        case '☁': ThermoMinStep = 10; ThermoMaxStep = 13; break;    //    ☁ - свежо(10-13)
                        case '❄': ThermoMinStep = 14; ThermoMaxStep = 18; break;    //    ❄ - холодно(14-18)
                        case '✵': ThermoMinStep = 19; ThermoMaxStep = 100; break;    //    ✵ - очень холодно(19)
                    }
                    //    thermo map data
                    var MapData = {
                        kColumn: kColumn,
                        kRow: kRow,
                        minStep: ThermoMinStep,
                        maxStep: ThermoMaxStep,
                        scanList: []
                    };
                    for (ik = -1; ik <= kRow; ik++) {
                        for (jk = -1; jk <= kColumn; jk++) {
                            if (ik < 0 || jk < 0 || ik === kRow || jk === kColumn) {
                                MapData[ik+':'+jk] = { explored: false, specway: false, scanned: false, wall: false, unknown: true };
                                continue;
                            }
                            MapData[ik+':'+jk] = {
                                explored: !mapRows[ik].children[jk].textContent.trim().match(/[#?!]/),
                                specway: false,
                                scanned: false,
                                wall: mapRows[ik].children[jk].textContent.trim() === '#',
                                unknown: mapRows[ik].children[jk].textContent.trim() === '?'
                            };
                        }
                    }
                    // remove unknown marks from cells located near explored ones
                    for (ik = 0; ik < kRow; ik++) {
                        for (jk = 0; jk < kColumn; jk++) {
                            if (MapData[ik+':'+jk].explored) {
                                for (i = -1; i <= 1; i++) {
                                    for (j = -1; j <= 1; j++) {
                                        if (MapData[(ik+i)+':'+(jk+j)]) { MapData[(ik+i)+':'+(jk+j)].unknown = false; }
                                    }
                                }
                            }
                        }
                    }
                    //
                    GUIp.common.mapIteration(MapData, si, sj, 0, false);
                    //
                    for (ik = 0; ik < kRow; ik++) {
                        for (jk = 0; jk < kColumn; jk++) {
                            if (MapData[ik+':'+jk].step < ThermoMinStep && MapData[ik+':'+jk].explored && !MapData[ik+':'+jk].specway) {
                                MapData[ik+':'+jk].scanned = true;
                                MapData.scanList.push({i:ik, j:jk, lim:(ThermoMinStep - MapData[ik+':'+jk].step)});
                            }
                        }
                    }
                    while (MapData.scanList.length) {
                        var scanCell = MapData.scanList.shift();
                        for (var cell in MapData) {
                            if (MapData[cell].substep) {
                                MapData[cell].substep = 0;
                            }
                        }
                        GUIp.common.mapSubIteration(MapData, scanCell.i, scanCell.j, 0, scanCell.lim, false);
                    }
                    //
                    for (ik = ((si - ThermoMaxStep) > 0 ? si - ThermoMaxStep : 0); ik <= ((si + ThermoMaxStep) < kRow ? si + ThermoMaxStep : kRow - 1); ik++) {
                        for (jk = ((sj - ThermoMaxStep) > 0 ? sj - ThermoMaxStep : 0); jk <= ((sj + ThermoMaxStep) < kColumn ? sj + ThermoMaxStep : kColumn - 1); jk++) {
                            if (MapData[ik+':'+jk].step >= ThermoMinStep & MapData[ik+':'+jk].step <= ThermoMaxStep) {
                                if (MapArray[ik][jk] >= 0) {
                                    MapArray[ik][jk] += THERMO_POINTER_MATCH;
                                }
                            } else if (MapData[ik+':'+jk].step < ThermoMinStep && MapData[ik+':'+jk].specway) {
                                if (MapArray[ik][jk] >= 0) {
                                    MapArray[ik][jk]++;
                                }
                            }
                        }
                    }
                }
            }
        }
        //    Отрисовываем возможный клад
        if (regularPointersCount !== 0 || thermoPointersCount !== 0) {
            for (i = 0; i < kRow; i++) {
                for (j = 0; j < kColumn; j++) {
                    if (!mapRows[i].children[j].textContent.match(/[?!@]/)) {
                        continue;
                    }
                    if (MapArray[i][j] === REGULAR_POINTER_MATCH*regularPointersCount + THERMO_POINTER_MATCH*thermoPointersCount) {
                        mapRows[i].children[j].style.color = (mapRows[i].children[j].textContent.trim() === '@') ? 'blue' : 'red';
                    } else {
                        for (ik = 0; ik < thermoPointersCount; ik++) {
                            if (MapArray[i][j] === REGULAR_POINTER_MATCH*regularPointersCount + THERMO_POINTER_MATCH*ik + (thermoPointersCount - ik)) {
                                mapRows[i].children[j].style.color = (mapRows[i].children[j].textContent.trim() === '@') ? 'blue' : 'darkorange';
                            }
                        }
                    }
                }
            }
        }
    }
};
GUIp.improver.improveOppsHP = function(isAlly) {
    var color, opp, opp_type = isAlly ? 'alls' : 'opps';
    for (var number in window.so.state[opp_type]) {
        opp = window.so.state[opp_type][number];
        if (opp.hp < 1 || (isAlly && opp.hp === 1)) {
            color = 'darkgray';
        } else if (opp.hp < opp.hpm * 0.30) {
            color = 'rgb(235,0,0)';
        } else {
            color = '';
        }
        if (opp.li.opp_hp && opp.li.opp_hp[0]) {
            opp.li.opp_hp[0].style.color = color;
        }
    }
};
GUIp.improver.improveStats = function() {
    var i, len;

    if (GUIp.stats.isDungeon()) {
        if (GUIp.storage.get('Logger:Location') === 'Field') {
            GUIp.storage.set('Logger:Location', 'Dungeon');
            GUIp.storage.set('Logger:Map_HP', GUIp.stats.HP());
            GUIp.storage.set('Logger:Map_Exp', GUIp.stats.Exp());
            GUIp.storage.set('Logger:Map_Gold', GUIp.stats.Gold());
            GUIp.storage.set('Logger:Map_Inv', GUIp.stats.Inv());
            GUIp.storage.set('Logger:Map_Charges',GUIp.stats.Charges());
            GUIp.storage.set('Logger:Map_Allies_HP', GUIp.stats.Allies_HP());
            for (i = 1, len = GUIp.stats.Allies_Count(); i <= len; i++) {
                GUIp.storage.set('Logger:Map_Ally' + i + '_HP', GUIp.stats.Ally_HP(i));
            }
        }
        /* [E] informer to notify about low health when in dungeon mode */
        GUIp.informer.update('low health', GUIp.stats.HP() < 130 && GUIp.stats.HP() > 1);
        GUIp.improver.improveOppsHP(true);
        return;
    }
    if (GUIp.stats.isFight() || GUIp.stats.isSail()) {
        if (GUIp.improver.isFirstTime) {
            GUIp.storage.set('Logger:Hero_HP', GUIp.stats.HP());
            GUIp.storage.set('Logger:Hero_Gold', GUIp.stats.Gold());
            GUIp.storage.set('Logger:Hero_Inv', GUIp.stats.Inv());
            GUIp.storage.set('Logger:Hero_Charges', GUIp.stats.Charges());
            GUIp.storage.set('Logger:Enemies_HP', GUIp.stats.Enemies_HP());
            GUIp.storage.set('Logger:Enemy_Gold', GUIp.stats.Enemy_Gold());
            GUIp.storage.set('Logger:Enemy_Inv', GUIp.stats.Enemy_Inv());
            GUIp.storage.set('Logger:Hero_Allies_HP', GUIp.stats.Allies_HP());
            for (i = 1, len = GUIp.stats.Allies_Count(); i < len; i++) {
                GUIp.storage.set('Logger:Hero_Ally'+i+'_HP', GUIp.stats.Ally_HP(i));
            }
            for (i = 1, len = GUIp.stats.Enemies_Count(); i < len; i++) {
                GUIp.storage.set('Logger:Enemy'+i+'_HP', GUIp.stats.Enemy_HP(i));
            }
            GUIp.storage.set('Logger:Enemies_AliveCount', GUIp.stats.Enemies_AliveCount());
        }
        /* [E] informer to notify about low health when in fight mode */
        var health_lim;
        if (GUIp.stats.fightType() === 'multi_monster') { // corovan
            health_lim = GUIp.stats.Max_HP() * 0.05 * GUIp.stats.Enemies_AliveCount();
        } else if (GUIp.stats.fightType() === 'monster') { // single enemy
            health_lim = GUIp.stats.Max_HP() * 0.15;
        } else if (GUIp.stats.fightType() === 'monster_m') { // raid boss or dungeon boss
            health_lim = (GUIp.stats.Allies_MaxHP() + GUIp.stats.Max_HP()) * (GUIp.stats.Enemy_HasAbility('second_strike') ? 0.094 : 0.068);
            if (GUIp.stats.Enemies_AliveCount() > 1) { // boss has an active minion
                health_lim *= 1.3;
            }
            if (GUIp.stats.Allies_Count() < 4) { // allies count less than 4 -- clearly speculative calculation below!
                health_lim *= (4 - GUIp.stats.Allies_Count()) * 0.2 + 1;
            }
        }
        GUIp.informer.update('low health', GUIp.stats.HP() < health_lim && GUIp.stats.HP() > 1);
        GUIp.improver.improveOppsHP(true);
        GUIp.improver.improveOppsHP(false);
        return;
    }
    if (GUIp.storage.get('Logger:Location') !== 'Field') {
        GUIp.storage.set('Logger:Location', 'Field');
    }
    if (!GUIp.utils.isAlreadyImproved(document.getElementById('stats'))) {
        // Add voicegens
        GUIp.utils.addVoicegen(document.querySelector('#hk_level .l_capt'), GUIp.i18n.study, 'exp', GUIp.i18n.ask9 + GUIp.data.char_sex[1] + GUIp.i18n.to_study);
        GUIp.utils.addVoicegen(document.querySelector('#hk_health .l_capt'), GUIp.i18n.heal, 'heal', GUIp.i18n.ask6 + GUIp.data.char_sex[1] + GUIp.i18n.to_heal);
        GUIp.utils.addVoicegen(document.querySelector('#hk_gold_we .l_capt'), GUIp.i18n.dig, 'dig', GUIp.i18n.ask10 + GUIp.data.char_sex[1] + GUIp.i18n.to_dig);
        GUIp.utils.addVoicegen(document.querySelector('#hk_quests_completed .l_capt'), GUIp.i18n.cancel_task, 'cancel_task', GUIp.i18n.ask11 + GUIp.data.char_sex[0] + GUIp.i18n.to_cancel_task);
        GUIp.utils.addVoicegen(document.querySelector('#hk_quests_completed .l_capt'), GUIp.i18n.do_task, 'do_task', GUIp.i18n.ask12 + GUIp.data.char_sex[1] + GUIp.i18n.to_do_task);
        GUIp.utils.addVoicegen(document.querySelector('#hk_death_count .l_capt'), GUIp.i18n.die, 'die', GUIp.i18n.ask13 + GUIp.data.char_sex[0] + GUIp.i18n.to_die);
    }
    if (!document.querySelector('#hk_distance .voice_generator')) {
        GUIp.utils.addVoicegen(document.querySelector('#hk_distance .l_capt'), document.querySelector('#main_wrapper.page_wrapper_5c') ? '回' : GUIp.i18n.return, 'town', GUIp.i18n.ask14 + GUIp.data.char_sex[0] + GUIp.i18n.to_return);
    }

    GUIp.informer.update('much gold', GUIp.stats.Gold() >= (GUIp.stats.hasTemple() ? 10000 : 3000));
    GUIp.informer.update('dead', GUIp.stats.HP() === 0);
    var questName = GUIp.stats.Task_Name();
    GUIp.informer.update('guild quest', questName.match(/членом гильдии|member of the guild/) && !questName.match(/\((отменено|cancelled)\)/));
    GUIp.informer.update('mini quest', questName.match(/\((мини|mini)\)/) && !questName.match(/\((отменено|cancelled)\)/));

    //Shovel pictogramm start
    var digVoice = document.querySelector('#hk_gold_we .voice_generator');
    if (GUIp.improver.isFirstTime) {
        digVoice.style.backgroundImage = 'url(' + GUIp.common.getResourceURL('images/shovel.png') + ')';
    }
    if (GUIp.stats.goldTextLength() > 16 - 2*document.getElementsByClassName('page_wrapper_5c').length) {
        digVoice.classList.add('shovel');
        if (GUIp.stats.goldTextLength() > 20 - 3*document.getElementsByClassName('page_wrapper_5c').length) {
            digVoice.classList.add('compact');
        } else {
            digVoice.classList.remove('compact');
        }
    } else {
        digVoice.classList.remove('shovel');
    }
    //Shovel pictogramm end
};
GUIp.improver.improvePet = function() {
    var pet_badge;
    if (GUIp.stats.petIsKnockedOut()) {
        if (!GUIp.utils.isAlreadyImproved(document.getElementById('pet'))) {
            document.querySelector('#pet .block_title').insertAdjacentHTML('beforeend', '<div id="pet_badge" class="fr_new_badge equip_badge_pos hidden">0</div>');
        }
        pet_badge = document.getElementById('pet_badge');
        pet_badge.textContent = GUIp.utils.findLabel(window.$('#pet'), GUIp.i18n.pet_status_label).siblings('.l_val').text().replace(/[^0-9:]/g, '');
        GUIp.utils.hideElem(pet_badge, document.querySelector('#pet .block_content').style.display !== 'none');
    } else {
        pet_badge = document.getElementById('pet_badge');
        if (pet_badge) {
            GUIp.utils.hideElem(pet_badge, true);
        }
    }
    // knock out informer
    GUIp.informer.update('pet knocked out', GUIp.stats.petIsKnockedOut());
};
GUIp.improver.improveEquip = function() {
    if (!GUIp.utils.isAlreadyImproved(document.getElementById('equipment'))) {
        document.querySelector('#equipment .block_title').insertAdjacentHTML('afterend', '<div id="equip_badge" class="fr_new_badge equip_badge_pos">0</div>');
    }
    var equipBadge = document.getElementById('equip_badge'),
        averageEquipLevel = 0;
    for (var i = 1; i <= 7; i++) {
        averageEquipLevel += GUIp.stats['Equip' + i]();
    }
    averageEquipLevel = (averageEquipLevel/7).toFixed(1) + '';
    if (equipBadge.textContent !== averageEquipLevel) {
        equipBadge.textContent = averageEquipLevel;
    }
};
GUIp.improver.improvePantheons = function() {
    var pants = document.querySelector('#pantheons .block_content');
    if (GUIp.improver.isFirstTime) {
        pants.insertAdjacentHTML('afterbegin', '<div class="guip p_group_sep" />');
    }
    if (GUIp.improver.isFirstTime || GUIp.improver.optionsChanged) {
        var relocateDuelButtons = GUIp.storage.get('Option:relocateDuelButtons') || '';
        var arenaRelocated = relocateDuelButtons.match('arena'),
            arenaInPantheons = document.querySelector('#pantheons .arena_link_wrap');
        if (arenaRelocated && !arenaInPantheons) {
            pants.insertBefore(document.getElementsByClassName('arena_link_wrap')[0], pants.firstChild);
        } else if (!arenaRelocated && arenaInPantheons) {
            document.getElementById('cntrl2').insertBefore(arenaInPantheons, document.querySelector('#control .arena_msg'));
        }
        var chfRelocated = relocateDuelButtons.match('chf'),
            chfInPantheons = document.querySelector('#pantheons .chf_link_wrap');
        if (chfRelocated && !chfInPantheons) {
            pants.insertBefore(document.getElementsByClassName('chf_link_wrap')[0], document.getElementsByClassName('guip p_group_sep')[0]);
        } else if (!chfRelocated && chfInPantheons) {
            document.getElementById('cntrl2').insertBefore(chfInPantheons, document.querySelector('#control .arena_msg').nextSibling);
        }
    }
};
GUIp.improver.improveDiary = function() {
    var i, len;
    if (GUIp.improver.isFirstTime) {
        var $msgs = document.querySelectorAll('#diary .d_msg:not(.parsed)');
        for (i = 0, len = $msgs.length; i < len; i++) {
            $msgs[i].classList.add('parsed');
        }
    } else {
        var newMessages = window.$('#diary .d_msg:not(.parsed)');
        if (newMessages.length) {
            if (GUIp.improver.voiceSubmitted) {
                if (newMessages.length - document.querySelectorAll('#diary .d_msg:not(.parsed) .vote_links_b').length >= 2) {
                    GUIp.timeout.start();
                }
                GUIp.improver.voiceSubmitted = false;
            }
            newMessages.addClass('parsed');
        }
    }
    GUIp.improver.improvementDebounce();
};
GUIp.improver.parseDungeonPhrases = function(xhr) {
    for (var i = 0, temp, len = GUIp.improver.dungeonPhrases.length; i < len; i++) {
        temp = xhr.responseText.match(new RegExp('<p>' + GUIp.improver.dungeonPhrases[i] + '\\b([\\s\\S]+?)<\/p>'))[1].replace(/&#8230;/g, '...').replace(/^<br>\n|<br>$/g, '').replace(/<br>\n/g, '|');
        GUIp.improver[GUIp.improver.dungeonPhrases[i] + 'RegExp'] = new RegExp(temp);
        GUIp.storage.set('Dungeon:' + GUIp.improver.dungeonPhrases[i] + 'Phrases', temp);
    }
    GUIp.improver.improveChronicles();
};
GUIp.improver.getDungeonPhrases = function() {
    if (!GUIp.storage.get('Dungeon:pointerMarkerPhrases')) {
        GUIp.improver.dungeonXHRCount++;
        var customChronicler = GUIp.storage.get('Option:customDungeonChronicler') || '';
        GUIp.utils.getXHR({
            url: '/gods/' + (customChronicler.length >= 3 ? customChronicler : 'Dungeoneer'),
            onSuccess: GUIp.improver.parseDungeonPhrases.bind(GUIp.improver)
        });
    } else {
        for (var i = 0, len = GUIp.improver.dungeonPhrases.length; i < len; i++) {
            GUIp.improver[GUIp.improver.dungeonPhrases[i] + 'RegExp'] = new RegExp(GUIp.storage.get('Dungeon:' + GUIp.improver.dungeonPhrases[i] + 'Phrases'));
        }
        GUIp.improver.improveChronicles();
    }
};
GUIp.improver.parseSingleChronicle = function(texts, step) {
    if (!GUIp.improver.chronicles[step]) {
        GUIp.improver.chronicles[step] = { direction: null, marks: [], pointers: [], jumping: false, directionless: false, text: texts.join(' ') };
    }
    // First step isn't an actual "step".
    if (step === 1) {
        return;
    }
    var i, len, j, len2, chronicle = GUIp.improver.chronicles[step];
    for (j = 0, len2 = texts.length; j < len2; j++) {
        texts[j] = texts[j].replace(/offered to trust h.. gut feeling\./, '');
        for (i = 0, len = GUIp.improver.dungeonPhrases.length - 1; i < len; i++) {
            if (texts[j].match(GUIp.improver[GUIp.improver.dungeonPhrases[i] + 'RegExp']) && chronicle.marks.indexOf(GUIp.improver.dungeonPhrases[i]) === -1) {
                chronicle.marks.push(GUIp.improver.dungeonPhrases[i]);
            }
        }
        var firstSentence = texts[j].match(/^.*?[\.!\?](?:\s|$)/);
        if (firstSentence) {
            var direction = firstSentence[0].match(/[^\w\-А-Яа-я](север|восток|юг|запад|north|east|south|west)/);
            if (direction) {
                chronicle.direction = direction[1];
            }
            chronicle.directionless = chronicle.directionless || !!firstSentence[0].match(/went somewhere|too busy bickering to hear in which direction to go next|The obedient heroes move in the named direction/);
            chronicle.jumping = chronicle.jumping || !!firstSentence[0].match(GUIp.improver.jumpingDungeonRegExp);
        }
    }
    if (texts.join(' ').match(GUIp.improver.pointerMarkerRegExp)) {
        var middle = texts.join(' ').match(/^.+?\.(.+)[.!?].+?[.!?]$/)[1];
        var pointer, pointers = middle.match(GUIp.improver.pointerRegExp);
        for (i = 0, len = pointers.length; i < len; i++) {
            switch (pointers[i].replace(/^./, '')) {
            case 'северо-восток':
            case 'north-east': pointer = 'north_east'; break;
            case 'северо-запад':
            case 'north-west': pointer = 'north_west'; break;
            case 'юго-восток':
            case 'south-east': pointer = 'south_east'; break;
            case 'юго-запад':
            case 'south-west': pointer = 'south_west'; break;
            case 'север':
            case 'north': pointer = 'north'; break;
            case 'восток':
            case 'east': pointer = 'east'; break;
            case 'юг':
            case 'south': pointer = 'south'; break;
            case 'запад':
            case 'west': pointer = 'west'; break;
            case 'очень холодно':
            case 'very cold':
            case 'freezing': pointer = 'freezing'; break;
            case 'холодно':
            case 'cold': pointer = 'cold'; break;
            case 'свежо':
            case 'mild': pointer = 'mild'; break;
            case 'тепло':
            case 'warm': pointer = 'warm'; break;
            case 'горячо':
            case 'hot': pointer = 'hot'; break;
            case 'очень горячо':
            case 'very hot':
            case 'burning': pointer = 'burning'; break;
            }
            if (chronicle.pointers.indexOf(pointer) === -1) {
                chronicle.pointers.push(pointer);
            }
        }
    }
};
GUIp.improver.parseChronicles = function(xhr) {
    GUIp.improver.needLog = false;
    GUIp.improver.dungeonXHRCount++;

    if (Object.keys(GUIp.improver.chronicles)[0] === '1') {
        return;
    }

    var lastNotParsed, texts = [],
        step = 1,
        step_max = +Object.keys(GUIp.improver.chronicles)[0],
        matches = xhr.responseText.match(/<div class="new_line ?" style='[^']*'>[\s\S]*?<div class="text_content .*?">[\s\S]+?<\/div>/g);
    for (var i = 0; step <= step_max; i++) {
        lastNotParsed = true;
        if (!matches[i].match(/<div class="text_content infl">/)) {
            texts.push(matches[i].match(/<div class="text_content ">([\s\S]+?)<\/div>/)[1].trim().replace(/&#39;/g, "'"));
        }
        if (matches[i].match(/<div class="new_line ?" style='[^']+'>/)) {
            GUIp.improver.parseSingleChronicle(texts, step);
            lastNotParsed = false;
            texts = [];
            step++;
        }
    }
    if (lastNotParsed) {
        GUIp.improver.parseSingleChronicle(texts, step);
    }

    //window.console.log('after log chronicles');
    //window.console.log(GUIp.improver.chronicles);
    //window.console.log(JSON.stringify(GUIp.improver.chronicles));

    GUIp.improver.colorDungeonMap();
};
GUIp.improver.calculateXY = function(cell) {
    var coords = {};
    coords.x = GUIp.utils.getNodeIndex(cell);
    coords.y = GUIp.utils.getNodeIndex(cell.parentNode);
    return coords;
};
GUIp.improver.getHeroesCell = function() {
    return Array.prototype.filter.call(document.querySelectorAll('.dml .dmc'), function(cell) {
        return cell.textContent.match(/@/);
    })[0];
};
GUIp.improver.calculateExitXY = function() {
    var exit_coords = { x: null, y: null },
        cells = document.querySelectorAll('.dml .dmc');
    for (var i = 0, len = cells.length; i < len; i++) {
        if (cells[i].textContent.trim().match(/В|E|🚪/)) {
            exit_coords = GUIp.improver.calculateXY(cells[i]);
            break;
        }
    }
    if (!exit_coords.x) {
        exit_coords = GUIp.improver.calculateXY(GUIp.improver.getHeroesCell());
    }
    return exit_coords;
};
GUIp.improver.deleteInvalidChronicles = function() {
    var isHiddenChronicles = true,
        chronicles = document.querySelectorAll('#m_fight_log .line.d_line');
    for (var i = chronicles.length - 1; i >= 0; i--) {
        if (isHiddenChronicles) {
            if (chronicles[i].style.display !== 'none') {
                isHiddenChronicles = false;
            }
        } else {
            if (chronicles[i].style.display === 'none') {
                chronicles[i].parentNode.removeChild(chronicles[i]);
            }
        }
    }
};
GUIp.improver.improveChronicles = function() {
    if (!GUIp.storage.get('Dungeon:pointerMarkerPhrases')) {
        if (GUIp.improver.dungeonXHRCount < 5) {
            GUIp.improver.getDungeonPhrases();
        }
    } else {
        var numberInBlockTitle = document.querySelector('#m_fight_log .block_title').textContent.match(/\d+/);
        if (!numberInBlockTitle) {
            return;
        }
        GUIp.improver.deleteInvalidChronicles();
        var i, len, lastNotParsed, texts = [],
            chronicles = document.querySelectorAll('#m_fight_log .d_msg:not(.parsed)'),
            ch_down = document.querySelector('.sort_ch').textContent === '▼',
            step = +numberInBlockTitle[0];
        //window.console.log('new ', chronicles.length, ' chronicles from step #', step);
        for (len = chronicles.length, i = ch_down ? 0 : len - 1; (ch_down ? i < len : i >= 0) && step; ch_down ? i++ : i--) {
            lastNotParsed = true;
            if (!chronicles[i].className.match('m_infl')) {
                texts = [chronicles[i].textContent].concat(texts);
            }
            if (chronicles[i].parentNode.className.match('turn_separator')) {
                GUIp.improver.parseSingleChronicle(texts, step);
                //window.console.log('chronicle #', step);
                //window.console.log(chronicles[i].textContent);
                lastNotParsed = false;
                texts = [];
                step--;
            }
            if (chronicles[i].textContent.match(GUIp.improver.bossHintRegExp)) {
                chronicles[i].parentNode.classList.add('bossHint');
            }
            chronicles[i].classList.add('parsed');
        }
        if (lastNotParsed) {
            GUIp.improver.parseSingleChronicle(texts, step);
        }
        //window.console.log('last step #', step);

        if (!GUIp.improver.initial) {
            GUIp.improver.initial = true;
            //window.console.log('initial chronicles');
            //window.console.log(GUIp.improver.chronicles);
            //window.console.log(JSON.stringify(GUIp.improver.chronicles));
        }

        if (GUIp.improver.needLog) {
            if (Object.keys(GUIp.improver.chronicles)[0] === '1') {
                GUIp.improver.needLog = false;
                GUIp.improver.colorDungeonMap();
            } else if (GUIp.improver.dungeonXHRCount < 5) {
                GUIp.utils.getXHR({
                    url: '/duels/log/' + GUIp.stats.logId(),
                    onSuccess: GUIp.improver.parseChronicles
                });
            }
        }
        // informer
        GUIp.informer.update('close to boss', GUIp.improver.chronicles[Object.keys(GUIp.improver.chronicles).reverse()[0]].marks.indexOf('bossHint') !== -1);

        if (GUIp.storage.get('Log:current') !== GUIp.stats.logId()) {
            GUIp.storage.set('Log:current', GUIp.stats.logId());
            GUIp.storage.set('Log:' + GUIp.stats.logId() + ':corrections', '');
        }
        GUIp.storage.set('Log:' + GUIp.stats.logId() + ':steps', (document.querySelector('#m_fight_log .block_title').textContent.match(/\d+/) || [0])[0]);
        GUIp.storage.set('Log:' + GUIp.stats.logId() + ':map', JSON.stringify(GUIp.improver.getDungeonMap()));
    }
    GUIp.improver.improvementDebounce();
};
GUIp.improver.getDungeonMap = function() {
    var dungeonRows = document.querySelectorAll('#map .dml');
    var dungeonMap = Array.prototype.map.call(dungeonRows, function(aRow) {
        var currentRowCells = aRow.querySelectorAll('.dmc');
        return Array.prototype.map.call(currentRowCells, function(aCell) {
            return aCell.textContent.trim();
        });
    });
    return dungeonMap;
};
GUIp.improver.moveCoords = function(coords, chronicle) {
    if (chronicle.direction) {
        var step = chronicle.jumping ? 2 : 1;
        switch(chronicle.direction) {
        case 'север':
        case 'north': coords.y -= step; break;
        case 'восток':
        case 'east': coords.x += step; break;
        case 'юг':
        case 'south': coords.y += step; break;
        case 'запад':
        case 'west': coords.x -= step; break;
        }
    }
};

GUIp.improver.getRPerms = function(array, size, initialStuff, output) {
    if (initialStuff.length >= size) {
        output.push(initialStuff);
    } else {
        for (var i = 0; i < array.length; ++i) {
            GUIp.improver.getRPerms(array, size, initialStuff.concat(array[i]), output);
        }
    }
};

GUIp.improver.getAllRPerms = function(array, size) {
    var output = [];
    GUIp.improver.getRPerms(array, size, [], output);
    return output;
};

GUIp.improver.calculateDirectionlessMove = function(initCoords, initStep) {
    var i, len, j, len2, coords = { x: initCoords.x, y: initCoords.y },
        dmap = document.querySelectorAll('#map .dml'),
        heroesCoords = GUIp.improver.calculateXY(GUIp.improver.getHeroesCell()),
        steps = Object.keys(GUIp.improver.chronicles),
        directionless = 0;

    //window.console.log('going to calculate directionless move from step #'+initStep);
    for (i = initStep, len = steps.length; i <= len; i++) {
        if (GUIp.improver.chronicles[i].directionless) {
            directionless++;
        }
        GUIp.improver.moveCoords(coords, GUIp.improver.chronicles[i]);
    }

    var variations = GUIp.improver.getAllRPerms('nesw'.split(''),directionless);

    for (i = 0, len = variations.length; i < len; i++) {
        //window.console.log('trying combo '+variations[i].join());
        coords = { x: initCoords.x, y: initCoords.y };
        directionless = 0;
        for (j = initStep, len2 = steps.length; j <= len2; j++) {
            if (GUIp.improver.chronicles[j].directionless) {
                GUIp.improver.moveCoords(coords, { direction: GUIp.improver.corrections[variations[i][directionless]] });
                directionless++;
            } else {
                GUIp.improver.moveCoords(coords, GUIp.improver.chronicles[j]);
            }
            if (!dmap[coords.y] || !dmap[coords.y].children[coords.x] || dmap[coords.y].children[coords.x].textContent.match(/#|!|\?/)) {
                break;
            }
        }
        if (heroesCoords.x - coords.x === 0 && heroesCoords.y - coords.y === 0) {
            var currentCorrections = GUIp.storage.get('Log:' + GUIp.stats.logId() + ':corrections') || '';
            //window.console.log('found result: '+variations[i].join());
            GUIp.storage.set('Log:' + GUIp.stats.logId() + ':corrections', currentCorrections + variations[i].join(''));
            return GUIp.improver.corrections[variations[i][0]];
        }
    }
};
GUIp.improver.colorDungeonMap = function() {
    if (GUIp.improver.colorDungeonMapTimer) {
        clearTimeout(GUIp.improver.colorDungeonMapTimer);
    }
    GUIp.improver.colorDungeonMapTimer = setTimeout(function() { GUIp.improver.colorDungeonMapInternal(); }, 150);
};
GUIp.improver.colorDungeonMapTimer = null;
GUIp.improver.colorDungeonMapInternal = function() {
    GUIp.improver.improveMap();

    if (Object.keys(GUIp.improver.chronicles)[0] !== '1') {
        return;
    }

    var step, mark_no, marks_length, steptext, lasttext, titlemod, titletext, currentCell,
        trapMoveLossCount = 0,
        coords = GUIp.improver.calculateExitXY(),
        steps = Object.keys(GUIp.improver.chronicles),
        steps_length = steps.length;
    for (step = 1; step <= steps_length; step++) {
        if (GUIp.improver.chronicles[step].directionless) {
            var shortCorrection = GUIp.storage.get('Log:' + GUIp.stats.logId() + ':corrections')[GUIp.improver.directionlessMoveIndex++];
            if (shortCorrection) {
                GUIp.improver.chronicles[step].direction = GUIp.improver.corrections[shortCorrection];
            } else {
                GUIp.improver.chronicles[step].direction = GUIp.improver.calculateDirectionlessMove(coords, step);
            }
            GUIp.improver.chronicles[step].directionless = false;
        }
        GUIp.improver.moveCoords(coords, GUIp.improver.chronicles[step]);
        currentCell = document.querySelectorAll('#map .dml')[coords.y].children[coords.x];
        for (mark_no = 0, marks_length = GUIp.improver.chronicles[step].marks.length; mark_no < marks_length; mark_no++) {
            currentCell.classList.add(GUIp.improver.chronicles[step].marks[mark_no]);
        }
        if (!currentCell.title.length && GUIp.improver.chronicles[step].pointers.length) {
            currentCell.title = '[' + GUIp.i18n.map_pointer + ': ' + GUIp.i18n[GUIp.improver.chronicles[step].pointers[0]] + (GUIp.improver.chronicles[step].pointers[1] ? GUIp.i18n.or + GUIp.i18n[GUIp.improver.chronicles[step].pointers[1]] : '') + ']';
        }
        //currentCell.title += (currentCell.title.length ? '\n\n' : '') + '#' + step + ' : ' + GUIp.improver.chronicles[step].text;
        steptext = GUIp.improver.chronicles[step].text.replace('.»','».').replace(/(\!»|\?»)/g,'$1.'); // we're not going to do natural language processing, so just simplify nested sentence (yeah, result will be a bit incorrect)
        steptext = steptext.match(/[^\.]+[\.]+/g);
        if (step === 1) {
            steptext = steptext.slice(0,-1);
        } else if (step === steps_length) {
            steptext = steptext.slice(1);
        } else if (GUIp.improver.chronicles[step].marks.indexOf('boss') !== -1) {
            steptext = steptext.slice(1,-2);
        } else if (GUIp.improver.chronicles[step].marks.indexOf('trapMoveLoss') !== -1 || trapMoveLossCount) {
            if (!trapMoveLossCount) {
                steptext = steptext.slice(1);
                trapMoveLossCount++;
            } else {
                steptext = steptext.slice(0,-1);
                trapMoveLossCount = 0;
            }
        } else {
            steptext = steptext.length > 2 ? steptext.slice(1,-1) : steptext.slice(0,-1);
        }
        steptext = steptext.join('').trim();
        if (currentCell.title.length) {
            titlemod = false;
            titletext = currentCell.title.split('\n');
            for (var i = 0, len = titletext.length; i < len; i++) {
                lasttext = titletext[i].match(/^(.*?) : (.*?)$/);
                if (lasttext && lasttext[2] === steptext) {
                    titletext[i] = lasttext[1] + ', #' + step + ' : ' + steptext;
                    titlemod = true;
                    break;
                }
            }
            if (!titlemod) {
                titletext.push('#' + step + ' : ' + steptext);
            }
            currentCell.title = titletext.join('\n');
        } else {
            currentCell.title = '#' + step + ' : ' + steptext;
        }
    }

    if (steps_length) {
        var heroesCoords = GUIp.improver.calculateXY(GUIp.improver.getHeroesCell());
        if (heroesCoords.x !== coords.x || heroesCoords.y !== coords.y) {
            /*window.console.log('current chronicles');
            window.console.log(GUIp.improver.chronicles);
            window.console.log('m_fight_log');
            window.console.log(document.getElementById('m_fight_log').innerHTML);*/
            if (GUIp.utils.hasShownInfoMessage !== true) {
                GUIp.utils.showMessage('info', {
                    title: GUIp.i18n.coords_error_title,
                    content: '<div>' + GUIp.i18n.coords_error_desc + ': [x:' + (heroesCoords.x - coords.x) + ', y:' + (heroesCoords.y - coords.y) + '].</div>'
                });
                GUIp.utils.hasShownInfoMessage = true;
            }
        }
    }
};
GUIp.improver.whenWindowResize = function() {
    GUIp.improver.chatsFix();
    //body widening
    window.$('body').width(window.$(window).width() < window.$('#main_wrapper').width() ? window.$('#main_wrapper').width() : '');
};
GUIp.improver._clockToggle = function(e) {
    if (e) {
        e.stopPropagation();
    }
    if (!GUIp.improver.clockToggling) {
        GUIp.improver.clockToggling = true;
    } else {
        return;
    }
    var restoreText, clockElem = window.$('#control .block_title');
    if (GUIp.improver.clock) {
        clearInterval(GUIp.improver.clock.updateTimer);
        restoreText = GUIp.improver.clock.prevText;
        clockElem.fadeOut(500, function() {
            clockElem.css('color', '');
            clockElem.text(restoreText).fadeIn(500);
            clockElem.prop('title', GUIp.i18n.show_godville_clock);
            GUIp.improver.clockToggling = false;
        });
        delete GUIp.improver.clock;
    } else {
        GUIp.improver.clock = {};
        GUIp.improver.clock.prevText = clockElem.text();
        GUIp.improver.clock.blocked = true;
        clockElem.fadeOut(500, function() {
            clockElem.text('--:--:--').fadeIn(500);
            clockElem.prop('title', GUIp.i18n.hide_godville_clock);
            GUIp.improver.clock.timeBegin = new Date();
            GUIp.utils.getXHR({
                url: '//time.akamai.com/?iso',
                onSuccess: GUIp.improver._clockSync,
                onFail: function() {
                    GUIp.improver.clockToggling = false;
                    GUIp.improver._clockToggle();
                }
            });
        });
    }
};
GUIp.improver._clockSync = function(xhr) {
    GUIp.improver.clockToggling = false;
    var currentTime = new Date(),
        offsetHours = GUIp.storage.get("Option:offsetGodvilleClock") || 3,
        clockTitle = window.$('#control .block_title');
    if (currentTime - GUIp.improver.clock.timeBegin > 500) {
        clockTitle.css('color', '#CC0000');
    }
    if (!GUIp.improver.clock.useGVT) {
        GUIp.improver.clock.timeDiff = new Date(xhr.responseText) - currentTime + (GUIp.storage.get('Option:localtimeGodvilleClock') ? (currentTime.getTimezoneOffset() * -60000) : (offsetHours * 3600000));
    } else {
        GUIp.improver.clock.timeDiff = new Date(xhr.getResponseHeader("Date")) - currentTime + (GUIp.storage.get('Option:localtimeGodvilleClock') ? (currentTime.getTimezoneOffset() * -60000) : (offsetHours * 3600000));
    }
    GUIp.improver.clock.updateTimer = setInterval(function() { GUIp.improver._clockUpdate(); }, 250);
    GUIp.improver._clockUpdate();
};
GUIp.improver._clockUpdate = function() {
    var currentTime = new Date();
    if (currentTime.getTime() - GUIp.improver.clock.timeBegin.getTime() > (300 * 1000)) {
        GUIp.improver._clockToggle();
        return;
    }
    var clockElem = window.$('#control .block_title'),
        godvilleTime = new Date(currentTime.getTime() + GUIp.improver.clock.timeDiff);
    clockElem.text(GUIp.utils.formatClock(godvilleTime));
};

GUIp.improver.improveInterface = function() {
    if (GUIp.improver.isFirstTime) {
        var links = document.querySelectorAll('a[href="#"]');
        for (var i = 0, len = links.length; i < len; i ++) {
            links[i].removeAttribute('href');
        }

        GUIp.improver.whenWindowResize();
        window.onresize = function() {
            clearInterval(GUIp.improver.windowResizeInt);
            GUIp.improver.windowResizeInt = setTimeout(function() { GUIp.improver.whenWindowResize(); }, 250);
        };

        if (!GUIp.stats.isField() && document.querySelector('#map .block_title, #control .block_title, #m_control .block_title')) {
            document.querySelector('#map .block_title, #control .block_title, #m_control .block_title').insertAdjacentHTML('beforeend', ' <a class="broadcast" href="/duels/log/' + GUIp.stats.logId() + '" target="_blank">' + GUIp.i18n.broadcast + '</a>');
        }
        /* [E] clock is to be initialized somewhere here */
        /*else if (!GUIp.storage.get('Option:disableGodvilleClock') && document.querySelector('#control .block_title')) {
            var controlTitle = document.querySelector('#control .block_title');
            controlTitle.title = GUIp.i18n.show_godville_clock;
            controlTitle.style.cursor = 'pointer';
            controlTitle.onclick = GUIp.improver._clockToggle.bind(null);
        }*/
    }
    if (GUIp.improver.isFirstTime || GUIp.storage.get('UserCssChanged') === true) {
        GUIp.storage.set('UserCssChanged', false);
        GUIp.common.addCSSFromString(GUIp.storage.get('UserCss'), 'guip_user_css');
    }

    if (localStorage.getItem('ui_s') !== GUIp.storage.get('ui_s')) {
        GUIp.storage.set('ui_s', localStorage.getItem('ui_s') || 'th_classic');
        GUIp.improver.Shovel = false;
        document.body.className = document.body.className.replace(/\s?th_\w+/g, '') + ' ' + GUIp.storage.get('ui_s');
    }

    if (GUIp.improver.isFirstTime || GUIp.improver.optionsChanged) {
        var background = GUIp.storage.get('Option:useBackground'),
            cssRule = '';
        if (background) {
            var cloud_background = background === 'cloud' && GUIp.common.getResourceURL('images/background.jpg') || background === 'cloud_alt' && GUIp.common.getResourceURL('images/background_alt.png');
            cssRule =
                'body {\n' +
                '    background-image: url(' + (cloud_background || background) + ')\n' +
                '}';
        }
        GUIp.common.addCSSFromString(cssRule, 'guip_background');

        //hide_charge_button
        var charge_button = document.querySelector('#cntrl .hch_link');
        if (charge_button) {
            charge_button.style.visibility = GUIp.storage.get('Option:hideChargeButton') ? 'hidden' : '';
        }
    }
};
GUIp.improver.improveChat = function() {
    var i, len;

    // friends fetching
    var $friends = document.querySelectorAll('.frline .frname'),
        friends = [];
    for (i = 0, len = $friends.length; i < len; i++) {
        friends.push($friends[i].textContent);
    }
    GUIp.improver.friendsRegExp = new RegExp('^(?:' + friends.join('|') + ')$');
};
GUIp.improver.improveAllies = function() {
    var ally, opp_n, star, anspan;
    for (var number in window.so.state.alls) {
        ally = window.so.state.alls[number];
        opp_n = ally.li[0].getElementsByClassName('opp_n')[0];
        star = opp_n.getElementsByClassName('open_chat')[0] || document.createElement('a');
        if (!opp_n.classList.contains('improved')) {
            opp_n.classList.add('improved');
            anspan = document.createElement('span');
            anspan.textContent = ally.hero;
            anspan.title = ally.god;
            if (ally.clan === GUIp.stats.guildName()) {
                anspan.className = "guildsmanAlly";
            }
            opp_n.textContent = '';
            opp_n.insertBefore(anspan, null);
            opp_n.insertBefore(document.createTextNode(' '), null);
            opp_n.insertBefore(star, null);
            star.className = 'open_chat';
            star.title = GUIp.i18n.open_chat_with + ally.god;
            star.textContent = '★';
            star.onclick = GUIp.utils.openChatWith.bind(null, ally.god);
        }
        GUIp.utils.hideElem(star, !ally.god.match(GUIp.improver.friendsRegExp));
    }
};
GUIp.improver.calculateButtonsVisibility = function() {
    var i, len, baseCond = GUIp.stats.Godpower() >= 5 && !GUIp.storage.get('Option:disableVoiceGenerators'),
        isMonster = GUIp.stats.monsterName();
    if (GUIp.stats.isField()) {
        // pantheon links
        var pantLinks = document.querySelectorAll('#pantheons .arena_link_wrap, #pantheons .chf_link_wrap'),
            pantBefore = [], pantAfter = [];
        for (i = 0, len = pantLinks.length; i < len; i++) {
            pantBefore[i] = !pantLinks[i].classList.contains('hidden');
            pantAfter[i] = GUIp.stats.Godpower() >= 50;
        }
        GUIp.improver.setButtonsVisibility(pantLinks, pantBefore, pantAfter);
        // inspect buttons
        var inspBtns = document.getElementsByClassName('inspect_button'),
            inspBtnsBefore = [], inspBtnsAfter = [];
        for (i = 0, len = inspBtns.length; i < len; i++) {
            inspBtnsBefore[i] = !inspBtns[i].classList.contains('hidden');
            inspBtnsAfter[i] = baseCond && !isMonster;
        }
        GUIp.improver.setButtonsVisibility(inspBtns, inspBtnsBefore, inspBtnsAfter);
        // craft buttons
        if (GUIp.improver.isFirstTime) {
            GUIp.improver.crftBtns = [document.getElementsByClassName('craft_button b_b')[0],
                             document.getElementsByClassName('craft_button b_r')[0],
                             document.getElementsByClassName('craft_button r_r')[0],
                             document.getElementsByClassName('craft_button span')[0]
                            ];
        }
        var crftBtnsBefore = [], crftBtnsAfter = [];
        for (i = 0, len = GUIp.improver.crftBtns.length; i < len; i++) {
            crftBtnsBefore[i] = !GUIp.improver.crftBtns[i].classList.contains('hidden');
            crftBtnsAfter[i] = baseCond && !isMonster;
        }
        crftBtnsAfter[0] = crftBtnsAfter[0] && GUIp.inventory.b_b.length;
        crftBtnsAfter[1] = crftBtnsAfter[1] && GUIp.inventory.b_r.length;
        crftBtnsAfter[2] = crftBtnsAfter[2] && GUIp.inventory.r_r.length;
        crftBtnsAfter[3] = crftBtnsAfter[0] || crftBtnsAfter[1] || crftBtnsAfter[2];
        GUIp.improver.setButtonsVisibility(GUIp.improver.crftBtns, crftBtnsBefore, crftBtnsAfter);
    }
    // voice generators
    if (GUIp.improver.isFirstTime) {
        GUIp.improver.voicegens = document.getElementsByClassName('voice_generator');
        GUIp.improver.voicegenClasses = [];
        for (i = 0, len = GUIp.improver.voicegens.length; i < len; i++) {
            GUIp.improver.voicegenClasses[i] = GUIp.improver.voicegens[i].className;
        }
    }
    var voicegensBefore = [], voicegensAfter = [],
        specialConds, specialClasses;
    if (GUIp.stats.isField()) {
        var isGoingBack = window.so.state.stats.dir.value !== 'ft',
            isTown = GUIp.stats.townName(),
            isSearching = window.so.state.last_news && window.so.state.last_news.value.match('дорогу'),
            dieIsDisabled = GUIp.storage.get('Option:disableDieButton'),
            isFullGP = GUIp.stats.Godpower() === GUIp.stats.Max_Godpower(),
            isFullHP = GUIp.stats.HP() === GUIp.stats.Max_HP(),
            canQuestBeAffected = !GUIp.stats.Task_Name().match(/\((?:выполнено|completed|отменено|cancelled)\)/);
        specialClasses = ['heal', 'do_task', 'cancel_task', 'die', 'exp', 'dig', 'town', 'pray'];
        specialConds = [isMonster || isGoingBack || isTown || isSearching || isFullHP,                // heal
                        isMonster || isGoingBack || isTown || isSearching || !canQuestBeAffected,    // do_task
                                                                             !canQuestBeAffected,    // cancel_task
                        isMonster ||                isTown ||                 dieIsDisabled,            // die
                        isMonster,                                                                    // exp
                        isMonster ||                                         isTown,                // dig
                        isMonster || isGoingBack || isTown ||                 isSearching,            // town
                        isMonster ||                                         isFullGP                // pray
                       ];
    }
    baseCond = baseCond && !window.$('.r_blocked:visible').length;
    for (i = 0, len = GUIp.improver.voicegens.length; i < len; i++) {
        voicegensBefore[i] = !GUIp.improver.voicegens[i].classList.contains('hidden');
        voicegensAfter[i] = baseCond;
        if (baseCond && GUIp.stats.isField()) {
            for (var j = 0, len2 = specialConds.length; j < len2; j++) {
                if (specialConds[j] && GUIp.improver.voicegenClasses[i].match(specialClasses[j])) {
                    voicegensAfter[i] = false;
                }
            }
        }
    }
    GUIp.improver.setButtonsVisibility(GUIp.improver.voicegens, voicegensBefore, voicegensAfter);
};
GUIp.improver.setButtonsVisibility = function(btns, before, after) {
    for (var i = 0, len = btns.length; i < len; i++) {
        if (before[i] && !after[i]) {
            GUIp.utils.hideElem(btns[i], true);
        }
        if (!before[i] && after[i]) {
            GUIp.utils.hideElem(btns[i], false);
        }
    }
};
GUIp.improver.chatsFix = function() {
    var i, len, cells = document.querySelectorAll('.frDockCell');
    for (i = 0, len = cells.length; i < len; i++) {
        cells[i].classList.remove('left');
        cells[i].style.zIndex = len - i;
        if (cells[i].getBoundingClientRect().right < 350) {
            cells[i].classList.add('left');
        }
    }
    //padding for page settings link
    var chats = document.getElementsByClassName('frDockCell'),
        clen = chats.length,
        padding_bottom = clen ? chats[0].getBoundingClientRect().bottom - chats[clen - 1].getBoundingClientRect().top : GUIp.browser === 'opera' ? 27 : 0,
        isBottom = window.scrollY >= document.documentElement.scrollHeight - document.documentElement.clientHeight - 10;
    padding_bottom = Math.floor(padding_bottom*10)/10 + 10;
    padding_bottom = (padding_bottom < 0) ? 0 : padding_bottom + 'px';
    document.getElementsByClassName('reset_layout')[0].style.paddingBottom = padding_bottom;
    if (isBottom) {
        window.scrollTo(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
    }
};
GUIp.improver.activity = function() {
    if (!GUIp.improver.updatingInFight) {
        GUIp.improver.updatingInFight = true;
        setTimeout(function() {
            GUIp.improver.updatingInFight = false;
        }, 500);
        //GUIp.logger.update();
    }
};
GUIp.improver.improvementDebounce = function() {
    clearTimeout(GUIp.improver.improveTmt);
    GUIp.improver.improveTmt = setTimeout(function() {
        GUIp.improver.improve();
        if (!GUIp.stats.isField()) {
            //GUIp.logger.update();
        }
    }, 250);
};

GUIp.improver.loaded = true;

document.currentScript.remove();
