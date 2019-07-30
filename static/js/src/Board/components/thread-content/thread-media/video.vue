<style scoped>
    video {
        width: 100%;
    }
</style>

<template>
    <video
            :src="file.meta.fullSrc"
            autoplay controls
            ref="video"
            v-if="file.meta.isVideo"
    >
        <source :src="file.meta.originalSrc">
        <source :src="file.meta.fullSrc">
    </video>
</template>

<script>
    export const videoSettings = [ 'volume', 'loop' ];

    export default {
        props: {
            file: {
                type: Object,
                required: true,
            },
        },

        methods: {

            handleSettingChange(key, value) {
                switch (key) {
                    case 'volume':
                        this.setVideoProp('volume', value / 100);
                        break;
                    case 'loop':
                        this.setVideoProp('loop', value);
                        break;
                }
            },

            addSettingsListeners(settings) {
                for (const key of videoSettings)
                    settings.onChange(key, this.handleSettingChange.bind(this), this.id);
            },

            setVideoProp(prop, val) {
                const { video } = this.$refs;

                if (video)
                    video[ prop ] = val;
            },

            refreshSettings() {
                if (typeof window === 'undefined')
                    return;

                const hasSettings = window.settings && window.settings.setting;

                if (!hasSettings)
                    return;

                const getSetting = hasSettings.bind(window.settings);

                const loop = getSetting('loop', true);
                const volume = getSetting('volume', true) / 100;

                this.setVideoProp('loop', loop);
                this.setVideoProp('volume', volume);
            },

        },

        computed: {

            id() {
                return `board-thread-video-${this.file.id}`;
            },

        },

        mounted() {
            this.refreshSettings();

            if (typeof window === 'undefined')
                return;

            const { bootData = {} } = window;
            const { settingsListeners } = bootData;

            if (settingsListeners)
                window.bootData.settingsListeners.push(() => {
                    this.addSettingsListeners();
                });
        },

        destroyed() {
            const { settings = {} } = window || {};
            const { remove } = settings;

            if (remove)
                window.settings.remove(this.id);
        },
    };
</script>
