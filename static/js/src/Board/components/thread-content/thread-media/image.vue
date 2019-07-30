<style lang="scss" scoped>
    img {
        display: inline-block;
        width: 100%;
    }
</style>

<template>
    <img :alt="alt" :data-loading="loading" :src="src">
</template>

<script>
    export default {
        props: {
            file: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                loading: false,
                src: this.file.meta.thumbSrc,
                errors: {
                    remote: false,
                    local: false,
                },
            };
        },

        methods: {

            setFullUrl() {
                const { remote, local } = this.srcList;
                const img = new Image();

                img.src = remote;

                img.onerror = () => {
                    if (img.src === local) {
                        this.errors.local = true;
                        console.error('Can\'t load image');
                        return;
                    }

                    this.errors.remote = true;
                    img.src = local;
                };

                img.onload = () => {
                    this.loading = false;
                    this.src = img.src;
                };
            },

        },

        computed: {

            alt() {
                const { name } = this.file;

                return name;
            },

            meta() {
                const { meta } = this.file;

                return meta;
            },

            srcList() {
                const { originalSrc, fullSrc } = this.meta;

                return {
                    remote: originalSrc,
                    local: fullSrc,
                };
            },

        },

        mounted() {
            this.loading = Boolean(this.$el.complete);

            setTimeout(() => {
                this.loading = true;
                this.setFullUrl();
            }, 10);
        },
    };
</script>
