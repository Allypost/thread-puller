function debounce(fn, time = 100) {
    let timeout;

    return function () {
        const functionCall = () => fn.apply(this, arguments);

        clearTimeout(timeout);
        timeout = setTimeout(functionCall, time);
    };
}

function isAnyPartOfElementInViewport(el) {

    const rect = el.getBoundingClientRect();
    // DOMRect { x: 8, y: 8, width: 100, height: 100, top: 8, right: 108, bottom: 108, left: 8 }
    const windowHeight = (window.innerHeight || document.documentElement.clientHeight) + 100;
    const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

    // http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    return (vertInView && horInView);
}

const Thread = {
    init() {
        if (window.MobileDetect)
            this.md = new MobileDetect(window.navigator.userAgent);
        else
            this.md = { mobile: () => false };

        this.isMobile = this.md.mobile();

        this.addListeners();
        this.updateElementVisibility();
        this.preloadVideos();
        this.addImageListeners();
    },

    preloadVideos() {
        const videos = Array.from(this.getVideos());

        videos
            .filter((video) => video.parentNode.dataset.visible === 'yes')
            .map(this.preloadVideo);
    },

    addImageListeners() {
        const images = Array.from(this.getImages());

        images
            .map(this.addImageLoadListener.bind(this));
    },

    preloadVideo(video) {
        if (this.isMobile)
            return video;

        if (!video.dataset.poster)
            return video;

        video.preload = 'metadata';
        video.addEventListener('loadedmetadata', () => {
            if (!video.dataset.poster)
                return;

            video.setAttribute('poster', video.dataset.poster);
            video.removeAttribute('data-poster');
        });

        return video;
    },

    preloadImage(el) {
        if (el.parentElement.dataset.visible === 'no')
            return;

        if (el.dataset.masterSrc) {
            el.src = el.dataset.masterSrc;
            el.removeAttribute('data-master-src');
        } else {
            el.parentElement.classList.remove('loading');
        }
    },

    getVideos() {
        return Array.from(document.querySelectorAll('.resource video'));
    },

    getImages() {
        return Array.from(document.querySelectorAll('.resource img'));
    },

    addListeners() {
        window.addEventListener('scroll', debounce(() => this.updateElementVisibility(), 10));
        window.__settingsListeners.push((settings) => this._addSettingsListeners(settings));
    },

    _addSettingsListeners(settings) {
        settings.onChange('*', this._handleSettingChange.bind(this));
    },

    _handleSettingChange(key, value) {
        const handlers = {
            volume: (value) => {
                this.getVideos().forEach((el) => el.volume = value / 100);
            },
            loop: (value) => {
                this.getVideos().forEach((el) => el.loop = value);
            },
        };

        const handler = handlers[ key ] || (() => !0);

        return handler(value);
    },

    updateElementVisibility() {
        Array.from(document.querySelectorAll('.resource'))
             .forEach((el) => {
                 const isVisible = isAnyPartOfElementInViewport(el);
                 const video = el.querySelector('video');
                 const image = el.querySelector('img');

                 el.dataset.visible = isVisible ? 'yes' : 'no';

                 if (video)
                     this.updateVideoElement(video, isVisible);

                 if (image)
                     this.updateImageElement(image, isVisible);
             });
    },

    updateVideoElement(el) {
        const isVisible = el.parentNode.dataset.visible === 'yes';
        const autoplay = window.settings && window.settings.setting('autoplay', true);

        if (!isVisible)
            return el.pause();

        if (!this.isMobile)
            this.preloadVideo(el);

        if (autoplay && el.paused && !el.ended)
            return el.play();
    },

    addImageLoadListener(el) {
        el.dataset.processed = '1';

        el.addEventListener('loadstart', function () {
            const ratio = Number(this.dataset.ratio);
            const height = this.offsetWidth * ratio;

            if (!height)
                return;

            this.setAttribute('height', `${height}px`);
        });

        el.addEventListener('load', () => this.preloadImage(el));
    },

    updateImageElement(el) {
        const isVisible = el.parentNode.dataset.visible === 'yes';

        if (!isVisible)
            return;

        if (Number(el.dataset.processed))
            return this.preloadImage(el);

        return this.addImageLoadListener(el);
    },
};
