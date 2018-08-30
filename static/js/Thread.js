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

        this.fixMobileVideos();
        this.addListeners();
        this.updateElementVisibility();
    },

    fixMobileVideos() {
        const md = this.md;

        if (!md.mobile())
            return;

        this.getVideos()
            .forEach(el => el.setAttribute('poster', el.dataset.poster));
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

                    if (!isVisible && video)
                        video.pause();
                });
    },
};
