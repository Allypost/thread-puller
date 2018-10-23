const Board = {
    isLongPost(el) {
        return el.scrollHeight > 163;
    },
    getLongPosts() {
        return Array.from(document.querySelectorAll('.description'))
                    .filter(this.isLongPost);
    },
    markLongPosts() {
        this.getLongPosts()
            .forEach(this.markLongPost.bind(this));
    },
    markLongPost(el) {
        if (this.isLongPost(el))
            el.parentNode.parentNode.classList.add('long');

        this.addLongPostListener(el);
    },
    postListener(evt) {
        const { path } = evt || {};

        if (!path || !path.find)
            return;

        const el = path.find(el => el.classList.contains('description'));

        if (!el || el === document)
            return;

        const func =
                  Array.from(el.classList)
                       .includes('extended')
                  ? el.classList.remove.bind(el.classList)
                  : el.classList.add.bind(el.classList);

        func('extended');
    },
    addLongPostListener(el) {
        el.removeEventListener('click', this.postListener);
        el.removeEventListener('tap', this.postListener);

        el.addEventListener('click', this.postListener);
        el.addEventListener('tap', this.postListener);
    },
    fixQuoteLinks() {
        Array.from(document.querySelectorAll('.description .quotelink'))
             .forEach(el => {
                 // el.setAttribute('href', `https://boards.4chan.org${el.getAttribute('href')}`);
                 el.setAttribute('target', '_blank');
             });
    },
    addExpandListeners() {
        Array.from(document.querySelectorAll('.post-image-container'))
             .forEach(el => {
                 const vid = (el) => {
                     const classList = el.classList;
                     const isVid = classList.contains('large');
                     const img = el.getElementsByTagName('img')[ 0 ];

                     const func =
                               isVid
                               ? classList.remove.bind(classList)
                               : classList.add.bind(classList);

                     func('large');

                     if (!isVid) {
                         const vid = document.createElement('video');
                         const src = document.createElement('source');

                         const hasSettings = window.settings && window.settings.setting;

                         vid.controls = true;
                         vid.autoplay = true;
                         if (hasSettings) {
                             const getSetting = hasSettings.bind(window.settings);

                             vid.volume = getSetting('volume', true) / 100;
                             vid.loop = getSetting('loop', true);
                         } else {
                             vid.volume = 0.5;
                         }

                         src.src = img.dataset.srcFull;

                         vid.appendChild(src);

                         img.style.display = 'none';
                         el.appendChild(vid);
                     } else {
                         img.style.display = '';
                         el.removeChild(el.getElementsByTagName('video')[ 0 ]);
                     }
                 };

                 const img = (el) => {
                     const src = [ el.dataset.srcFull, el.dataset.srcThumb ];
                     const index = (src.indexOf(el.src) + 1) % 2;

                     const classList = el.parentNode.classList;

                     const func =
                               index
                               ? classList.remove.bind(classList)
                               : classList.add.bind(classList);

                     func('large');

                     el.src = src[ index ];
                 };

                 el.addEventListener('click', (evt) => {
                     const isVideo = !!+el.dataset.isVideo;
                     evt.preventDefault();
                     evt.stopPropagation();

                     if (isVideo)
                         vid(el);
                     else
                         img(el.getElementsByTagName('img')[ 0 ]);

                     return false;
                 });
             });
    },
    addImageLoadListener() {
        document.querySelectorAll('img')
                .forEach(el => el.addEventListener('load', (evt) => {
                    const { path } = evt || {};

                    if (!path || !path.find)
                        return;

                    this.markLongPost(path.find(el => el.classList.contains('board')).querySelector('.description'));
                }));
    },
    removeWbrTags() {
        const wbrs = document.getElementsByTagName('wbr');

        while (wbrs.length) {
            wbrs[ 0 ].parentNode.removeChild(wbrs[ 0 ]);
        }
    },
    linkifyDescriptions() {
        document.querySelectorAll('.description')
                .forEach(el => el.innerHTML = linkifyHtml(el.innerHTML));
    },
    _handleSettingChange(key, value) {
        const handlers = {
            volume: (value) => {
                document.querySelectorAll('.board .content video').forEach((el) => el.volume = value / 100);
            },
            loop: (value) => {
                document.querySelectorAll('.board .content video').forEach((el) => el.loop = value);
            },
        };

        const handler = handlers[ key ] || (() => !0);

        return handler(value);
    },
    _addSettingsListeners(settings) {
        settings.onChange('*', this._handleSettingChange.bind(this));
    },
    init() {
        // this.markLongPosts();
        this.fixQuoteLinks();
        this.addExpandListeners();
        this.addImageLoadListener();
        window.__settingsListeners.push((settings) => this._addSettingsListeners(settings));
        document.addEventListener('DOMContentLoaded', () => {
            this.removeWbrTags();
            this.linkifyDescriptions();
        });
    },
};
