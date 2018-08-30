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
        this.md = new MobileDetect(window.navigator.userAgent);
        this.isMobile = this.md.mobile();

        this.addListeners();
        this.updateElementVisibility();
        this.preloadVideos();
    },

    preloadVideos() {
        const videos = Array.from(this.getVideos());

        videos
            .filter((video) => video.parentNode.dataset.visible === 'yes')
            .map(this.preloadVideo);
    },

    preloadVideo(video) {
        if (this.isMobile)
            return video;

        if (!video.poster)
            return video;

        video.preload = 'metadata';
        video.addEventListener('loadedmetadata', () => {
            if (!video.poster)
                return;

            video.removeAttribute('poster');
        });

        return video;
    },

    getVideos() {
        return document.querySelectorAll('.resource video');
    },

    addListeners() {
        window.addEventListener('scroll', () => this.updateElementVisibility());
    },

    updateElementVisibility() {
        document.querySelectorAll('.resource')
                .forEach((el) => {
                    const isVisible = isAnyPartOfElementInViewport(el);
                    const video = el.querySelector('video');

                    el.dataset.visible = isVisible ? 'yes' : 'no';

                    if (video)
                        this.updateVideoElement(video, isVisible);
                });
    },

    updateVideoElement(el) {
        const isVisible = el.parentNode.dataset.visible === 'yes';
        const autoplay = window.settings && window.settings.setting('autoplay');

        if (!isVisible)
            return el.pause();

        if (!this.isMobile)
            this.preloadVideo(el);

        if (autoplay && el.paused && !el.ended)
            return el.play();
    },
};
