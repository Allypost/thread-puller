<style lang="scss" scoped>
    @import "../style/common";

    .post-content {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        min-height: $maxTextHeight;
        overflow: hidden;
        border-radius: 6px 6px 0 0;
        color: #ffffff;
        background-color: $content-background-color;

        &.expanded {
            grid-template-columns: 1fr;
        }
    }

    .long-post {

        section {
            cursor: zoom-in;
        }

    }

    .description {
        grid-column: span 2;
    }

    .extend-media,
    .extend-description {
        grid-column: span 3;
    }
</style>

<template>
    <section :class="{ 'no-content': !hasContent, 'long-post': isLongPost, 'expanded': showAsExpanded }" class="post-content">
        <thread-media
                :class="{'extend-media': !hasContent}"
                :file="file"
                @click="handleClick('media', $event)"
                v-if="hasFile"
        />

        <thread-description
                :class="{'extend-description': !hasFile}"
                :content="content"
                @longPost="handleLongPost"
                class="description"
                v-if="hasContent"
        />
    </section>
</template>

<script>
    import ThreadDescription from './thread-content/thread-description';
    import ThreadMedia from './thread-content/thread-media';

    export default {
        props: {
            content: {
                type: String,
                default: '',
            },
            file: {
                type: Object,
                default: null,
            },
        },

        components: { ThreadMedia, ThreadDescription },

        data: () => ({
            isLongPost: false,
            isExpanded: {
                media: false,
                description: false,
            },
        }),

        computed: {

            hasFile() {
                return Boolean(this.file);
            },

            hasContent() {
                return Boolean(this.content);
            },

            showAsExpanded() {
                return Object.values(this.isExpanded).some(x => x);
            },

        },

        methods: {

            handleLongPost(isLongPost) {
                this.isLongPost = isLongPost;
            },

            handleClick(field, value) {
                this.$set(this.isExpanded, field, value);
            },

        },
    };
</script>
