<style lang="scss" scoped>
    $content-height: 140px;

    .description {
        max-height: $content-height;
        min-height: 85px;
        padding: .35em .5em;
        text-align: left;
        position: relative;

        &.isLong {
            cursor: zoom-in;

            &:not(.expanded)::after {
                content: "";
                position: absolute;
                width: 100%;
                height: 2em;
                left: 0;
                top: calc(140px - 1em);
                background-image: linear-gradient(180deg, transparent, #000000 85%);
            }

            &.expanded {
                cursor: zoom-out;
                max-height: none;
            }

        }
    }
</style>

<style lang="scss">
    .quote {
        color: #8bc34a;
    }

    .prettyprint {
        white-space: pre-wrap;
    }
</style>

<template>
    <section
        class="description"
        :class="{isLong, expanded}"
        @click="expanded = !expanded"
        v-html="description"
    />
</template>

<script>
    export default {
        name: 'ThreadDescription',

        props: {
            description: {
                type: String,
                required: true,
            },
        },

        data() {
            return {
                isLong: false,
                expanded: false,
            };
        },

        computed: {

            hasDescription() {
                return Boolean(this.description);
            },

        },

        mounted() {
            this.isLong = 164 < this.$el.scrollHeight;
        },
    };
</script>
