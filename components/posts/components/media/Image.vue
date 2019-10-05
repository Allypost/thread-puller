<template>
    <thread-image
        :alt="file.name"
        :src-set="src"
        @click.native="handleClick"
    />
</template>
<script>
    import ThreadImage from '../../../threads/thread/media/components/Image.vue';

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
        name: 'PostImage',

        components: { ThreadImage },

        props: {
            file: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                isVisible: false,
                listener: null,
            };
        },

        computed: {
            src() {
                if (this.isVisible) {
                    return this.fullSrc;
                } else {
                    return this.thumbSrc;
                }
            },

            srcset() {
                const { src } = this.file;

                return src;
            },

            thumbSrc() {
                const { local, remote } = this.srcset;

                return {
                    local: local.thumb,
                    remote: remote.thumb,
                };
            },

            fullSrc() {
                const { local, remote } = this.srcset;

                return {
                    local: local.full,
                    remote: remote.full,
                };
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
        },

        beforeDestroy() {
            window.removeEventListener('scroll', this.listener);
        },

        methods: {
            handleClick() {
                this.$store.commit('posts/setFocused', this.file.postId);
            },
        },
    };
</script>
