const Thread = {
    init() {
        this.md = new MobileDetect(window.navigator.userAgent);

        this.fixMobileVideos();
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
};
