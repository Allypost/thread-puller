<style>
    video {
        width: 100%;
    }
</style>

<template>
    <video
        :autoplay="autoplay"
        :controls="controls"
        :preload="preload"
        :loop="loop"
    >
        <source :src="srcset.remote">
        <source :src="srcset.local">
        Your browser does not support the video tag.
    </video>
</template>

<script>
    export default {
        name: 'ThreadVideo',

        props: {
            file: {
                type: Object,
                required: true,
            },
            autoplay: {
                type: Boolean,
                default: true,
            },
            controls: {
                type: Boolean,
                default: true,
            },
            volume: {
                type: Number,
                default: 25,
            },
            preload: {
                type: String,
                default: 'metadata',
            },
            loop: {
                type: Boolean,
                default: true,
            },
        },

        computed: {
            srcset() {
                const { src } = this.file;
                const { local, remote } = src;

                return {
                    local: local.full,
                    remote: remote.full,
                };
            },
        },

        watch: {
            volume(newValue) {
                this.setVolume(newValue);
            },
        },

        mounted() {
            this.setVolume(this.volume);
        },

        methods: {
            setVolume(newVolume = 25) {
                if (1 < newVolume) {
                    newVolume /= 100;
                }

                this.$el.volume = newVolume;
            },
        },
    };
</script>
