import MobileDetect from 'mobile-detect';
import '../styles/thread.scss';
import { onReady } from './src/util/onReady';

if (!('fullscreenElement' in document)) {
    Object.defineProperty(document, 'fullscreenElement', {
        get() {
            return document.mozFullScreenElement ||
                   document.msFullscreenElement ||
                   document.webkitFullscreenElement;
        },
    });
}

function debounce(fn, time = 100) {
    let timeout;

    return function () {
        const functionCall = () => fn.apply(this, arguments);

        clearTimeout(timeout);
        timeout = setTimeout(functionCall, time);
    };
}

function isNodeOrChildFullscreen(el) {
    const { fullscreenElement } = document;

    if (!fullscreenElement)
        return false;

    const candidateNodes = [ el, ...Array.from(el.childNodes) ];

    return candidateNodes.includes(fullscreenElement);
}

function isAnyPartOfElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    // DOMRect { x: 8, y: 8, width: 100, height: 100, top: 8, right: 108, bottom: 108, left: 8 }
    const windowHeight = (window.innerHeight || document.documentElement.clientHeight) + 100;
    const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

    // http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    return (vertInView && horInView) || isNodeOrChildFullscreen(el);
}

function videoHasAudio(videoEl) {
    if (typeof videoEl.webkitAudioDecodedByteCount !== 'undefined')
        return videoEl.webkitAudioDecodedByteCount > 0;

    if (typeof videoEl.mozHasAudio !== 'undefined')
        return !!videoEl.mozHasAudio;

    return true;
}

class Thread {
    constructor() {
        const md = new MobileDetect(window.navigator.userAgent);
        this.isMobile = md.mobile();

        this.addListeners();
        this.updateElementVisibility();
        this.preloadVideos();
        this.addImageListeners();
    }

    preloadVideos() {
        const videos = Array.from(this.getVideos());

        videos
            .filter((video) => video.parentNode.dataset.visible === 'yes')
            .map(this.preloadVideo.bind(this));
    }

    addImageListeners() {
        const roots = document.getElementsByClassName('resource');

        Array.from(roots)
             .forEach((el) => {
                 const img = el.getElementsByTagName('img').item(0);

                 if (img)
                     return this.addImageLoadListener(img, el);

             });
    }

    preloadVideo(video) {
        if (this.isMobile)
            return video;

        if (!video.dataset.poster)
            return video;

        video.preload = 'auto';

        video.addEventListener('loadedmetadata', () => {
            if (!video.dataset.poster)
                return;

            video.setAttribute('poster', video.dataset.poster);
            video.removeAttribute('data-poster');

            video.addEventListener('loadeddata', () => {
                if (!videoHasAudio(video))
                    video.parentElement.dataset.isMuted = 'yes';
            });
        });

        return video;
    }

    handleOffSiteImage(el, parent) {
        const currentSource = Array.from(parent.getElementsByTagName('source')).find(source => source.srcset === el.currentSrc);

        if (currentSource && currentSource.dataset.isThumb)
            return currentSource.remove();

        if (el.complete && el.naturalWidth !== 0)
            return parent.classList.remove('loading');
    }

    preloadImage(el) {
        const parent = this.getResourceParentElement(el);

        if (!parent)
            return;

        if (parent.dataset.visible === 'no')
            return;

        if (!parent.dataset.requiresProxy)
            return this.handleOffSiteImage(el, parent);

        if (el.dataset.masterSrc) {
            el.src = el.dataset.masterSrc;
            el.removeAttribute('data-master-src');
        } else if (el.complete && el.naturalWidth !== 0) {
            parent.classList.remove('loading');
        }
    }

    getVideos() {
        return Array.from(document.querySelectorAll('.resource video'));
    }

    getImages() {
        return Array.from(document.querySelectorAll('.resource img'));
    }

    addListeners() {
        window.addEventListener('scroll', debounce(() => this.updateElementVisibility(), 10));
        window.bootData.settingsListeners.push((settings) => this._addSettingsListeners(settings));
    }

    _addSettingsListeners(settings) {
        settings.onChange('*', this._handleSettingChange.bind(this));
    }

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
    }

    updateElementVisibility() {
        Array.from(document.getElementsByClassName('resource'))
             .forEach((el) => {
                 const isVisible = isAnyPartOfElementInViewport(el);
                 const video = el.getElementsByTagName('video').item(0);
                 const image = el.getElementsByTagName('img').item(0);

                 el.dataset.visible = isVisible ? 'yes' : 'no';

                 if (video)
                     this.updateVideoElement(video, el, isVisible);

                 if (image)
                     this.updateImageElement(image, el, isVisible);
             });
    }

    updateVideoElement(el) {
        const isVisible = el.parentNode.dataset.visible === 'yes';
        const setting = window.settings && window.settings.setting && window.settings.setting.bind(window.settings) || (() => undefined);

        const autoplay = setting('autoplay', true);

        if (!isVisible)
            return el.pause();

        if (!this.isMobile)
            this.preloadVideo(el);

        if (autoplay && el.paused && !el.ended)
            return el.play();
    }

    /**
     * @param {HTMLElement} el
     * @return {HTMLElement|null}
     */
    getResourceParentElement(el) {
        while (!el.classList.contains('resource') && el !== window.document.documentElement)
            el = el.parentElement;

        if (el === window.document.documentElement)
            return null;

        return el;
    }

    /**
     * @param {HTMLElement} el
     */
    handleError(el) {
        const parent = this.getResourceParentElement(el);

        if (!parent)
            return;

        if (parent.dataset.requiresProxy)
            return;

        parent.dataset.requiresProxy = 'yes';
        parent.getElementsByTagName('source').item(0).remove();
        this.preloadImage(el);
    }

    addImageLoadListener(el) {
        el.dataset.processed = 'yes';

        (function () {
            const ratio = Number(this.dataset.ratio);
            const height = this.offsetWidth * ratio;

            if (!height)
                return;

            this.style.height = `${height}px`;
        }).call(el);

        el.addEventListener('load', () => this.preloadImage(el));
        el.addEventListener('error', () => this.handleError(el));
    }

    updateImageElement(el) {
        const parent = this.getResourceParentElement(el);

        if (!parent)
            return;

        const isVisible = parent.dataset.visible === 'yes';

        if (!isVisible)
            return;

        if (el.dataset.processed === 'yes')
            return this.preloadImage(el);

        return this.addImageLoadListener(el);
    }
}

onReady(() => new Thread());
