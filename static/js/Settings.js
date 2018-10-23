class Settings {

    constructor() {
        this._settingsCookie = 'threadpuller_settings';
        this._inputs = [];
        this._listeners = {};

        this.$cog = document.getElementById('settings');
        this.$modalWindow = document.getElementById('settings-modal');
        this.$modalContent = this.$modalWindow.querySelector('.settings-modal-content');

        this._settings = {
            volume: {
                title: 'Video volume',
                text: 'This is the volume that the video will be set to by default. You can change it in-video during playback as usual.',
                value: null,
            },
            autoplay: {
                title: 'Play on load',
                text: 'Whether to automatically play videos when you load a page.',
                value: null,
            },
            loop: {
                title: 'Loop video',
                text: 'Whether to loop videos after they\'ve finished.',
                value: null,
            },
        };
        this._settings = this.hydrateSettings(this._settings);
        this._settings = this.getProxied(this._settings, this._settingsProxyHandler());

        this.addEventListeners();
        this._handleListenerRequests();
    }

    listenToHandlerRequests(obj) {
        return new Proxy(obj, {
            set: (obj, key, value) => {
                obj[ key ] = value;

                if (key !== 'length')
                    setTimeout(() => this._handleListenerRequests(obj), 5);

                return true;
            },
        });
    }

    _handleListenerRequests(obj) {
        const listeners = obj || window.__settingsListeners;

        if (!listeners)
            return;

        let listener;
        while (listener = listeners.pop()) {
            try {
                listener(this);
            } catch (e) {
                console.warn('Couldn\'t execute listener', listener, e);
            }
        }
    }

    get() {
        return this._settings;
    }

    getOverrides() {
        return (
            location
                .search
                .substring(1)
                .split('&')
                .reduce((acc, curr) => {
                    const [ key, value ] = curr.split('=');
                    acc[ decodeURIComponent(key) ] = { value: Number(decodeURIComponent(value)) };
                    return acc;
                }, {})
        );
    }

    setting(key, allowOverrides = false) {
        const { [ key ]: setting = {} } = this.get();
        const { [ key ]: override = {} } = this.getOverrides();

        if (!allowOverrides)
            return setting.value;

        return Object.assign({}, setting, override).value;
    }

    onChange(setting = '*', handler = (() => 1)) {
        const listeners = this._listeners;

        if (setting === '*') {
            Object.keys(this.get())
                  .forEach((key) => this.onChange(key, handler));

            return;
        }

        if (!listeners[ setting ])
            listeners[ setting ] = [];

        listeners[ setting ].push(handler);
    }

    _trigger(setting, value) {
        const listeners = this._listeners[ setting ] || [];

        listeners.forEach((listener) => listener(setting, value));
    }

    getProxied(settings, proxy) {
        return Object.entries(Object.assign({}, settings))
                     .map(([ key, data ]) => [ key, new Proxy(data, proxy) ])
                     .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {});
    }

    _settingsProxyHandler() {
        return {
            set: (obj, key, val) => {
                this._trigger(obj.key, val);

                if (obj[ key ] === val)
                    return true;

                obj[ key ] = val;

                this.saveSettings();

                return true;
            },
        };
    }

    initModal(isOpen) {
        if (isOpen)
            this.destroyModal();
        else
            this.createModal();
    }

    createModal() {
        const modalContent = this.$modalContent;
        const settings = this.get();

        Object.entries(settings)
              .forEach(this._addSettingElement.bind(this, modalContent));

        this._addButtons();

        document.body.classList.add('settings-open');
    }

    destroyModal() {
        const modalContent = this.$modalContent;

        while (modalContent.firstChild)
            modalContent.removeChild(modalContent.firstChild);

        this._inputs = [];

        document.body.classList.remove('settings-open');
    }

    addEventListeners() {
        const els = [ this.$cog, this.$modalWindow ];
        const listener = () => this.initModal(document.body.classList.contains('settings-open'));

        els.forEach((el) => this.addPreciseClickListener(el, listener));
    }

    addPreciseClickListener(el, listener) {
        const events = [ 'click', 'tap' ];

        events.forEach(eventName => {
            const fn = (evt) => (el === evt.target) && listener.apply(this, el, evt);

            el.removeEventListener(eventName, fn);
            el.addEventListener(eventName, fn);
        });
    }

    hydrateSettings(settings) {
        return (
            Object.entries(settings)
                  .map(([ key, data ]) => [ key, Object.assign(data, { key, value: this.getSetting(key) }) ])
                  .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {})
        );
    }

    getCookieSettingsString() {
        const settings = this.get();
        const bareSettings =
                  Object.entries(settings)
                        .map(([ key, data ]) => [ key, data.value ])
                        .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {});

        const stringyfiedSettings = JSON.stringify(bareSettings);

        return `j:${stringyfiedSettings}`;
    }

    getSetting(name) {
        if (!window.Cookies) {
            console.warn('Can\'t fetch cookies');
            return null;
        }

        const cookieKey = this._settingsCookie;

        const rawCookie = (Cookies.get(cookieKey) || '').substr(2);
        const parsedCookie = {};

        try {
            const parsedCookieData = JSON.parse(rawCookie);

            Object.assign(parsedCookie, parsedCookieData);
        } catch (e) {
            console.warn('Can\'t parse settings');
        }

        return parsedCookie[ name ];
    }

    saveSettings() {
        if (!window.Cookies) {
            console.warn('Can\'t fetch cookies');
            return;
        }

        const settingsCookie = this._settingsCookie;
        const newSettings = this.getCookieSettingsString();

        Cookies.set(settingsCookie, newSettings, {
            domain: `${window.location.hostname}`,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
    }

    _addSettingElement(modalContentElement, [ valueName, data ]) {
        let elements = [];

        const container = document.createElement('div');
        container.className = [ 'setting-container', valueName ].join(' ');

        const title = document.createElement('h3');
        title.innerText = data.title;
        elements.push(title);

        const description = document.createElement('span');
        description.innerText = data.text;
        elements.push(description);

        const input = this._createInputElement([ valueName, data ]);
        elements.push(input);

        if (this._doShowValue(valueName))
            elements.push(this._getSettingValueDisplayElement(input, data));

        elements.forEach(container.appendChild.bind(container));

        this._inputs.push({ name: valueName, el: input.querySelector('input') });

        modalContentElement.appendChild(container);
    }

    _createInputElement([ valueName, data ]) {
        const inputID = `input-${valueName}`;

        const input = document.createElement('input');
        input.setAttribute('id', inputID);

        const container = document.createElement('div');
        container.appendChild(input);

        const label = this._createInputLabelElement(inputID);

        switch (valueName) {
            case 'volume':
                input.setAttribute('type', 'range');
                input.setAttribute('min', '0');
                input.setAttribute('max', '100');
                input.setAttribute('value', data.value);
                break;
            case 'autoplay':
                container.appendChild(label);
                this.addPreciseClickListener(container, () => input.checked = !input.checked);

                input.setAttribute('type', 'checkbox');
                input.checked = !!data.value;
                break;
            case 'loop':
                container.appendChild(label);
                this.addPreciseClickListener(container, () => input.checked = !input.checked);

                input.setAttribute('type', 'checkbox');
                input.checked = !!data.value;
                break;
            default:
                input.setAttribute('type', 'text');
                input.setAttribute('value', data.value);
                break;
        }

        container.classList.add(`${input.getAttribute('type')}-container`);

        return container;
    }

    _createInputLabelElement(inputID) {
        const label = document.createElement('label');
        label.setAttribute('for', inputID);

        return label;
    }

    _doShowValue(valueName) {
        switch (valueName) {
            case 'volume':
                return true;
            default:
                return false;
        }
    }

    _getSettingValueDisplayElement(inputElement, initialData = undefined) {
        const valueContainer = document.createElement('div');

        const text = document.createTextNode('Current value: ');
        valueContainer.appendChild(text);

        const value = document.createElement('span');
        value.className = 'bold';
        valueContainer.appendChild(value);

        inputElement.addEventListener('input', (evt) => value.innerText = evt.srcElement.value || evt.srcElement.checked);

        if (initialData !== undefined)
            value.innerText = initialData.value;

        return valueContainer;
    }

    _addButtons() {
        const saveListener = () => {
            const inputs = this._inputs;
            const getVal = (el) => {
                switch (el.getAttribute('type')) {
                    case 'checkbox':
                        return el.checked;
                    default:
                        return el.value;
                }
            };
            const settings = this.get();

            inputs.forEach(({ name: name, el: el }) => settings[ name ].value = getVal(el));

            this.destroyModal();
        };

        const container = document.createElement('div');
        container.classList.add('settings-action-buttons');

        const cancel = document.createElement('button');
        cancel.innerText = 'Cancel';
        cancel.classList.add('settings-btn', 'settings-cancel-btn');
        this.addPreciseClickListener(cancel, this.destroyModal.bind(this));
        container.appendChild(cancel);

        const save = document.createElement('button');
        save.innerText = 'Save';
        save.classList.add('settings-btn', 'settings-save-btn');
        this.addPreciseClickListener(save, saveListener.bind(this));
        container.appendChild(save);

        this.$modalContent.appendChild(container);
    }

}
