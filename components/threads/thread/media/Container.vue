<style lang="scss" scoped>
    .container {
        max-height: 140px;
        overflow: hidden;

        &.expanded {
            max-height: initial;
        }

        .img {
            width: 100%;
            cursor: zoom-in;

            &.expanded {
                cursor: zoom-out;
            }
        }
    }
</style>

<template>
    <section
        class="container"
        :class="{ expanded }"
        @click="expanded = !expanded"
    >
        <thread-video
            v-if="expanded && isVideo"
            :autoplay="true"
            :file="file"
        />

        <thread-image
            v-else
            :src-set="srcset"
            :alt="file.name"
            class="img"
            :class="{expanded}"
        />
    </section>
</template>

<script>
    import ThreadVideo from './components/Video';
    import ThreadImage from './components/Image';

    export default {

        name: 'ThreadMediaContainer',

        components: { ThreadVideo, ThreadImage },

        props: {
            file: {
                type: [ Object, null ],
                required: true,
            },
        },

        data() {
            return {
                expanded: false,
            };
        },

        computed: {
            isVideo() {
                return this.file.meta.isVideo;
            },

            thumbSrc() {
                const { src } = this.file;
                const { local, remote } = src;

                return {
                    local: local.thumb,
                    remote: remote.thumb,
                };
            },

            fullSrc() {
                const { src } = this.file;
                const { local, remote } = src;

                return {
                    local: local.full,
                    remote: remote.full,
                };
            },

            srcset() {
                if (this.expanded) {
                    return this.fullSrc;
                } else {
                    return this.thumbSrc;
                }
            },
        },

    };
</script>
