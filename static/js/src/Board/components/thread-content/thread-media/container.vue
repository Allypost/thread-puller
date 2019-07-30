<template>
    <thread-media-video :file="file" v-if="isVideo" />
    <thread-media-image :file="file" v-else />
</template>

<script>
    import ThreadMediaVideo from './video';
    import ThreadMediaImage from './image';

    export default {
        components: { ThreadMediaImage, ThreadMediaVideo },

        props: {
            file: {
                type: Object,
                required: true,
            },
        },

        computed: {
            isVideo() {
                const { meta = {} } = this.file;
                const { isVideo } = meta;

                return Boolean(isVideo);
            },
        },
    };
</script>
