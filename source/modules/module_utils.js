// utils
window.GUIp = window.GUIp || {};

GUIp.utils = {};

GUIp.utils.init = function() {};

GUIp.utils.BUTTON_ENABLED = true;
GUIp.utils.BUTTON_DISABLED = false;

GUIp.utils.notiLaunch = 0;
GUIp.utils.messagesShown = [];
// base phrase say algorythm
GUIp.utils.setVoice = function(voice) {
    var voiceInput = document.querySelector('#godvoice, #god_phrase');
    if (voiceInput.value !== voice) {
        voiceInput.value = voice;
    }

    if (voiceInput.value && !(GUIp.improver.freezeVoiceButton.match('after_voice') && parseInt(GUIp.timeout.bar.style.width))) {
        GUIp.utils.setVoiceSubmitState(GUIp.utils.BUTTON_DISABLED);
    } else if (GUIp.improver.freezeVoiceButton.match('when_empty')) {
        GUIp.utils.setVoiceSubmitState(GUIp.utils.BUTTON_ENABLED);
    }

    GUIp.utils.hideElem(document.getElementById('clear_voice_input'), !voiceInput.value);
};
// finds a label with given name
GUIp.utils.findLabel = function($base_elem, label_name) {
    return window.$('.l_capt', $base_elem).filter(function() {
        return this.textContent === label_name;
    });
};
// checks if $elem already improved
GUIp.utils.isAlreadyImproved = function(elem) {
    if (elem.classList.contains('improved')) {
        return true;
    } else {
        elem.classList.add('improved');
        return false;
    }
};
// generic voice generator
GUIp.utils.getGenericVoicegenButton = function(text, section, title) {
    var voicegen = document.createElement('a');
    voicegen.title = title;
    voicegen.textContent = text;
    voicegen.className = 'voice_generator ' + (GUIp.stats.isDungeon() ? 'dungeon' : GUIp.stats.isFight() ? 'battle' : 'field') + ' ' + section;
    voicegen.onclick = function() {
        if (document.querySelector('#godvoice, #god_phrase').getAttribute('disabled') !== 'disabled') {
            GUIp.utils.setVoice(GUIp.words.longPhrase(section));
            GUIp.words.currentPhrase = "";
        }
        return false;
    };
    return voicegen;
};
GUIp.utils.addVoicegen = function(elem, voicegen_name, section, title) {
    elem.parentNode.insertBefore(GUIp.utils.getGenericVoicegenButton(voicegen_name, section, title), elem.nextSibling);
};
// Случайный индекс в массиве
GUIp.utils.getRandomIndex = function(arr) {
    return Math.floor(Math.random()*arr.length);
};
// Форматирование времени
GUIp.utils.formatClock = function(godvilleTime) {
    return ('0' + godvilleTime.getUTCHours()).slice(-2) + ':' + ('0' + godvilleTime.getUTCMinutes()).slice(-2) + ':' + ('0' + godvilleTime.getUTCSeconds()).slice(-2);
};
// Случайный элемент массива
GUIp.utils.getRandomItem = function(arr) {
    return arr[GUIp.utils.getRandomIndex(arr)];
};
// Вытаскивает случайный элемент из массива
GUIp.utils.popRandomItem = function(arr) {
    var ind = GUIp.utils.getRandomIndex(arr);
    var res = arr[ind];
    arr.splice(ind, 1);
    return res;
};
// Escapes HTML symbols
GUIp.utils.escapeHTML = function(str) {
    return String(str).replace(/&/g, "&amp;")
                      .replace(/"/g, "&quot;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
};
GUIp.utils.addCSS = function () {
    GUIp.common.addCSSFromURL(GUIp.common.getResourceURL('css/superhero.css'), 'guip_css');
    GUIp.common.addCSSFromURL(GUIp.common.getResourceURL('css/common.css'), 'guip_common_css');
};
/* aParams: {
    url:       string,
    type:      'GET'|'POST',
    postData:  string   [optional],
    onSuccess: function [optional],
    onFail:    function [optional]
}*/
GUIp.utils.sendXHR = function(aParams) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState < 4) {
            return;
        } else if (this.status === 200) {
            if (aParams.onSuccess) {
                aParams.onSuccess(this);
            }
        } else if (aParams.onFail) {
            aParams.onFail(this);
        }
    };

    xhr.open(aParams.type, aParams.url, true);
    if (aParams.type === 'GET') {
        xhr.send();
    } else {
        //Send the proper header information along with the request
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(aParams.postData);
    }
};
GUIp.utils.getXHR = function(aParams) {
    aParams.type = 'GET';
    GUIp.utils.sendXHR(aParams);
};
GUIp.utils.postXHR = function(aParams) {
    aParams.type = 'POST';
    GUIp.utils.sendXHR(aParams);
};
GUIp.utils.showMessage = function(aMessageId, aMessage) {
    if (isNaN(aMessageId)) {
        GUIp.utils.messagesShown.push(aMessageId);
    }
    GUIp.common.showMessage(aMessageId, aMessage, function() {
        if (!isNaN(aMessageId)) {
            GUIp.storage.set('lastShownMessage', aMessageId);
        }
    });
};
GUIp.utils.inform = function() {
    var last_shown = !isNaN(GUIp.storage.get('lastShownMessage')) ? +GUIp.storage.get('lastShownMessage') : -1;
    for (var i = 0, len = GUIp.utils.messages[GUIp.locale].length; i < len; i++) {
        if (GUIp.utils.messages[GUIp.locale][i].msg_no > last_shown) {
            GUIp.utils.showMessage(GUIp.utils.messages[GUIp.locale][i].msg_no, GUIp.utils.messages[GUIp.locale][i]);
        }
    }
};
GUIp.utils.messages = {
    ru: [/*{
        msg_no: 0,
        title: 'Приветственное сообщение Godville UI+',
        get content() { return '<div>Приветствую бог' + (document.title.match('её') ? 'иню' : 'а') + ', использующ' + (document.title.match('её') ? 'ую' : 'его') +
            ' дополнение <b>Godville UI+</b>.</div>'+

            '<div style="text-align: justify; margin: 0.2em 0 0.3em;">&emsp;Нажмите на кнопку <b>настройки ui+</b> в верхнем меню или ' +
            'откройте вкладку <b>Настройки UI+</b> в <b>профиле</b> героя и ознакомьтесь с настройками дополнения, если еще этого не сделали.<br>' +

            '&emsp;Касательно форумных информеров: по умолчанию, вы подписаны только на тему дополнения и, скорее всего, видите ее <i>форумный информер</i> в левом верхнем углу.<br>' +

            '&emsp;Если с каким-то функционалом дополнения не удалось интуитивно разобраться — прочтите <b>статью дополнения в богии</b> ' +
            'или в соответствующей <b>теме на форуме</b>.<br>' +

            '&emsp;Инструкции на случай проблем можно прочесть в <i>диалоговом окне помощи</i> (оно сейчас открыто), которое открывается/закрывается ' +
            'по щелчку на кнопке <b style="text-decoration: underline;">help</b> в верхнем меню. Ссылки на все ранее упомянутое находятся там же.<br>' +

            '<div style="text-align: right;">Приятной игры!<br>~~Бэдлак</div>';
        },
        callback: function() {
            if (!GUIp.storage.get('helpDialogVisible')) {
                GUIp.help.toggleDialog();
            }
        }
    }*/
    {
        msg_no: 10, // 0..9 are used
        title: 'Godville UI+: новые мировые порядки',
        content: '<div style="text-align: justify;">&emsp;С связи с требованиями Демиургов на текущий момент вся функциональность, которая работала на внутренних игровых объектах, отключена (а это почти вся вообще). Большую часть удастся восстановить в соответствии с требованиями Демиургов, но это, учитывая мою личную загруженность, займет некоторое время. Но я таки намерен это сделать. Такие дела.</div>' +
                 '<div style="text-align: right;">Подпись.<br>~~Бэдлак</div>'
    }
    /*{
        msg_no: 11, // 0..10 are used
        title: 'Godville UI+: Заголовок',
        content: '<div style="text-align: justify;">&emsp;Текст.</div>' +
                 '<div style="text-align: right;">Подпись.<br>~~Бэдлак</div>'
    }*/],
    en: [/*{
        msg_no: 0,
        title: 'Godville UI+ greeting message',
        get content() { return '<div>Greetings to a god' + (document.title.match('his') ? '' : 'dess') + ', using <b>Godville UI+</b> ' + (GUIp.browser === 'Firefox' ? 'add-on' : 'extension') + '.</div>' +
            '<div style="text-align: justify; margin: 0.2em 0 0.3em;">&emsp;Please click <b>ui+ settings</b> button at the top of a page, or ' +
            'open <b>UI+ settings</b> tab in the hero <b>profile</b> and familiarize yourself with the settings available in this ' + (GUIp.browser === 'Firefox' ? 'add-on' : 'extension') + ', if you haven\'t done so yet.<br>' +

            '&emsp;In respect to forum informers, by default you are only subscribed to the topic for this addon, and most likely you can see it <i>in the upper left corner</i> right now.<br>' +

            '&emsp;If you can\'t figure out some functions of the ' + (GUIp.browser === 'Firefox' ? 'add-on' : 'extension') + ' - feel free to ask in the forums.<br>' +

            '&emsp;Guides for handling errors can be found in the <i>help dialog</i> (which is open now), that can be shown or hidden by clicking <b style="text-decoration: underline;">ui+ help</b> in the top menu. ' +
            'Links to everything mentioned above can also be found there.<br>' +

            '<div style="text-align: right;">Enjoy the game!<br>~~Bad Luck</div>';
        },
        callback: function() {
            if (!GUIp.storage.get('helpDialogVisible')) {
                GUIp.help.toggleDialog();
            }
        }
    }*/
    {
        msg_no: 5, // 0..4 are used
        title: 'Godville UI+: new world orders',
        content: '<div style="text-align: justify;">&emsp;In order to comply with demands of Godville Developers, to date all functionality, that worked on internal game objects, are disabled (and that\'s almost all functionality in general). Most part of it will be restored without violating new rules, but it would take some time, regarding my personal business. But I\'m intended to do that anyway. That\'s all.</div>' +
                 '<div style="text-align: right;">Signature.<br>~~Bad Luck</div>'
    }
    /*{
        msg_no: 6, // 0..5 are used
        title: 'Godville UI+: Title',
        content: '<div style="text-align: justify;">&emsp;Text.</div>' +
                 '<div style="text-align: right;">Signature.<br>~~Bad Luck</div>'
    }*/]
};
GUIp.utils.getNodeIndex = function(node) {
    return Array.prototype.indexOf.call(node.parentNode.children, node);
};
GUIp.utils.openChatWith = function(friend, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    /*so.nm.bindings.show_friend[0].update(friend); -- fixme: this doesn't mark incoming messages as read */
    var current, friends = document.querySelectorAll('.msgDockPopupW .frline');
    for (var i = 0, len = friends.length; i < len; i++) {
        current = friends[i].querySelector('.frname');
        if (current.textContent === friend) {
            current.click();
            break;
        }
    }
};
GUIp.utils.dateToMoscowTimeZone = function(date) {
    var temp = new Date(date);
    temp.setTime(temp.getTime() + (temp.getTimezoneOffset() + (GUIp.locale === 'en' ? 115 : 175))*60*1000);
    return temp.getFullYear() + '/' +
          (temp.getMonth() + 1 < 10 ? '0' : '') + (temp.getMonth() + 1) + '/' +
          (temp.getDate() < 10 ? '0' : '') + temp.getDate();
};
GUIp.utils.setVoiceSubmitState = function(toDisabledState) {
    if (GUIp.stats.isField()) {
        var voice_submit = document.getElementById('voice_submit');
        if (toDisabledState) {
            voice_submit.setAttribute('disabled', 'disabled');
        } else {
            voice_submit.removeAttribute('disabled');
        }
    }
};
GUIp.utils.hideElem = function(elem, hide) {
    if (hide) {
        elem.classList.add('hidden');
    } else {
        elem.classList.remove('hidden');
    }
};
GUIp.utils._parseVersion = function(isNewestCallback, isNotNewestCallback, failCallback, xhr) {
    var match = xhr.responseText.match(/Godville UI\+ (\d+)\.(\d+)\.(\d+)/);
    if (match) {
        var currentVersion = GUIp.version.split(/\.| /),
            lastVersion = [+match[1], +match[2], +match[3]],
            isNewest = +currentVersion[0] < lastVersion[0] ? false :
                       +currentVersion[0] > lastVersion[0] ? true  :
                       +currentVersion[1] < lastVersion[1] ? false :
                       +currentVersion[1] > lastVersion[1] ? true  :
                       +currentVersion[2] < lastVersion[2] ? false : true;
        if (isNewest) {
            GUIp.isNewestVersion = true;
            if (isNewestCallback) {
                isNewestCallback();
            }
        } else if (isNotNewestCallback) {
            GUIp.isNewestVersion = false;
            isNotNewestCallback();
        }
    } else if (failCallback) {
        failCallback();
    }
};
GUIp.utils.checkVersion = function(isNewestCallback, isNotNewestCallback, failCallback) {
    switch(GUIp.isNewestVersion) {
    case true: isNewestCallback(); break;
    case false: isNotNewestCallback(); break;
    default:
        GUIp.utils.getXHR({
            url: '/forums/show/' + (GUIp.locale === 'ru' ? '2' : '1'),
            onSuccess: GUIp.utils._parseVersion.bind(null, isNewestCallback, isNotNewestCallback, failCallback),
            onFail: failCallback
        });
    }
};

GUIp.utils.informAboutOldVersion = function() {
    if (!~GUIp.utils.messagesShown.indexOf('update_required')) {
        GUIp.utils.showMessage('update_required', {
            title: GUIp.i18n.error_message_title,
            content: '<div>' + GUIp.i18n.error_message_in_old_version + '</div>',
            callback: function() {
                if (!GUIp.storage.get('helpDialogVisible')) {
                    GUIp.help.toggleDialog();
                }
            }
        });
    }
};

GUIp.utils.showNotification = function(title,text,callback) {
    setTimeout(function() {
        var notification = new Notification(title, {
            icon: GUIp.common.getResourceURL('icon64.png'),
            body: text
        });
        notification.onclick = callback;
        var notificationTimeout = 5, customTimeout = GUIp.storage.get('Option:informerAlertsTimeout');
        if (parseInt(customTimeout) >= 0) {
            notificationTimeout = parseInt(customTimeout);
        }
        if (notificationTimeout > 0) {
            setTimeout(function() { notification.close(); }, notificationTimeout * 1000);
        }
        setTimeout(function() { if (GUIp.utils.notiLaunch) { GUIp.utils.notiLaunch--; } }, 500);
    }, 500 * GUIp.utils.notiLaunch++);
};

GUIp.utils.getCurrentChat = function() {
    // not that nice but working way to get current contact name without searching for matches in HTML
    for (var obj in window.so.messages.nm.bindings.messages[0]) {
        if (obj.indexOf('fc_') === 0) {
            var msgBinding = window.so.messages.nm.bindings.messages[0][obj];
            if (msgBinding && msgBinding[0].classList.contains('frbutton_pressed')) {
                return obj.substring(3);
            }
        }
    }
    return null;
    // there should definitely be a better way to detect this, probably via window.so.<whatever>
    /*var docktitle = window.$('.frbutton_pressed .dockfrname_w .dockfrname').text().replace(/\.+/g,''),
        headtitle = window.$('.frbutton_pressed .frMsgBlock .fr_chat_header').text().match('^(.*?)(\ и\ е|\ and\ h)');
    if (docktitle && headtitle && headtitle[1].indexOf(docktitle) === 0) {
        return headtitle[1];
    } else {
        return null;
    }*/
};

GUIp.utils.loaded = true;

document.currentScript.remove();
