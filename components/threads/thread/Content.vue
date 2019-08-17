<style lang="scss" scoped>
    $content-height: 140px;

    .content {
        display: grid;
        grid-template-columns: [media] minmax(0, 1fr) [description] minmax(0, 2fr);
        grid-template-areas: "media description";
        min-height: $content-height;
        overflow: hidden;
        border-radius: 6px 6px 0 0;
        color: #ffffff;
        background-color: #383838;

        &[data-no-description] {
            grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) minmax(0, 2fr);
            grid-template-areas: "_ media __";
            align-items: center;
        }

        &[data-no-file] {
            grid-template-columns: minmax(0, 1fr) minmax(0, 4fr) minmax(0, 1fr);
            grid-template-areas: "_ description __";
            align-items: center;
        }

        &.extended {
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas: "media" "description";
        }

    }
</style>

<template>
    <section
        class="content"
        :class="{ extended }"
        :data-no-file="!hasFile"
        :data-no-description="!hasDescription"
    >
        <thread-media-container
            v-if="hasFile"
            :file="thread.file"
            style="grid-area: media"
            @click.native="extended = !extended"
        />

        <thread-description
            v-if="hasDescription"
            :description="description"
            style="grid-area: description"
        />
    </section>
</template>

<script>
    import ThreadMediaContainer from './media/Container';
    import ThreadDescription from './Description';

    export default {
        name: 'ThreadContent',

        components: { ThreadDescription, ThreadMediaContainer },

        props: {
            thread: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                extended: false,
            };
        },

        computed: {
            description() {
                const { body } = this.thread;
                const { content } = body;

                return content;
            },

            hasFile() {
                return Boolean(this.thread.file);
            },

            hasDescription() {
                return Boolean(this.description);
            },
        },
    };
</script>
