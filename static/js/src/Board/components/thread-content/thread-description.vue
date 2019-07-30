<style lang="scss" scoped>
    @import "../../style/common";

    .thread-description {
        position: relative;
        display: block;
        overflow: hidden;
        max-height: $maxTextHeight;
        min-height: 85px;
        padding: .35em .5em;
        text-align: left;
        transition: height #{$transition-smooth};

        >>> .quote {
            color: #8bc34a;
        }

        >>> a:not(.linkified) {
            color: #4dd0e1;
        }

        >>> a.linkified {
            color: #b3e5fc;
        }
    }

    .long-post {

        &::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 2em;
            left: 0;
            top: calc(#{$maxTextHeight} - 1em);
            background-image: linear-gradient(to bottom, transparent, #000000 85%);
        }

    }

    .expanded {
        max-height: none !important;
        cursor: zoom-out !important;

        &::after {
            display: none !important;
        }
    }
</style>

<template>
    <section
            class="thread-description"
            :class="{ 'expanded': isExpanded, 'long-post': isLongPost }"
            @click="handleContentClick"
            v-html="parsedHtml"
            v-linkified
    ></section>
</template>

<script>
    import striptags from 'striptags';

    export default {
        props: {
            content: {
                type: String,
                required: true,
            },
        },

        data: () => ({
            isExpanded: false,
            isLongPost: false,
        }),

        methods: {

            handleContentClick() {
                if (!this.isLongPost)
                    return;

                this.isExpanded = !this.isExpanded;
                this.$emit('click', this.isExpanded);
            },

        },

        computed: {

            parsedHtml() {
                const allowedTags = [ 'a', 'br', 'span' ];

                return (
                    striptags(
                        this.content,
                        allowedTags,
                    )
                );
            },

        },

        mounted() {
            const { scrollHeight } = this.$el;

            this.isLongPost = scrollHeight > 163;
            this.$emit('longPost', this.isLongPost);
        },
    };
</script>
