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
            const { src } = this.file;
            const { local } = src;
            const { thumb } = local;

            return {
                isVisible: false,
                poster: thumb,
            };
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
        },

        beforeDestroy() {
            window.removeEventListener('scroll', this.listener);
        },

    };
</script>
