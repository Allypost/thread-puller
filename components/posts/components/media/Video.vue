<template>
    <thread-vid
        :file="file"
        :poster="poster"
        :preload="isVisible ? 'auto' : 'metadata'"
        :autoplay="false"
    />
</template>

<script>
    import ThreadVid from '../../../../components/threads/thread/media/components/Video.vue';
    import MobileDetect from 'mobile-detect';

    function isElementInViewport(el) {
        const scroll = window.scrollY || window.pageYOffset;
        const boundsTop = el.getBoundingClientRect().top + scroll;

        const viewport = {
            top: scroll,
            bottom: scroll + window.innerHeight,
        };

        const bounds = {
            top: boundsTop,
            bottom: boundsTop + el.clientHeight,
        };

        return (
            (
                bounds.bottom >= viewport.top && bounds.bottom <= viewport.bottom
            )
            || (
                bounds.top <= viewport.bottom && bounds.top >= viewport.top
            )
        );
    }

    export default {
        name: 'ThreadVideo',

        components: { ThreadVid },

        props: {
            file: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                isMobile: false,
                isVisible: false,
                thumbSrc: '',
            };
        },

        computed: {

            posterSrcSet() {
                const { src } = this.file;
                const { local, remote } = src;
                const { thumb: localThumb, thumbHD: localThumbHD } = local;
                const { thumb: remoteThumb } = remote;

                return {
                    local: localThumb,
                    remote: remoteThumb,
                    hd: localThumbHD,
                };
            },

            poster() {
                if (!this.isVisible) {
                    return this.thumbSrc;
                }

                const { hd } = this.posterSrcSet;

                return hd;
            },

        },

        mounted() {
            this.listener = () => {
                if (!isElementInViewport(this.$el)) {
                    return;
                }

                this.isVisible = true;
                window.removeEventListener('scroll', this.listener);
            };

            window.addEventListener('scroll', this.listener);
            this.listener();

            this.isMobile = (
                new MobileDetect()
            ).mobile();

            this.computePoster();
        },

        beforeDestroy() {
            window.removeEventListener('scroll', this.listener);
        },

        methods: {
            computePoster() {
                const img = new Image();
                const { remote, local } = this.posterSrcSet;

                img.src = remote;

                img.onerror = () => {
                    if (!this.isVisible) {
                        this.thumbSrc = local;
                    }
                };

                img.onload = () => {
                    if (!this.isVisible) {
                        this.thumbSrc = remote;
                    }
                };
            },
        },

    };
</script>
