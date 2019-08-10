<style lang="scss" scoped>
    @import "../assets/style/modules/include";

    h1 {
        text-shadow: 1px 1px 3px #000000, 0 0 5px #000000, 3px 3px 8px #000000;
        text-align: center;
        font-size: 3em;
        margin: .67em 0;
        margin-bottom: 0;
        @include no-select();

        > a {
            text-shadow: none;
        }
    }
</style>

<template>
    <h1>
        <n-link :to="backLink">
            Back
        </n-link>
        <span class="separator">|</span>
        <a
            :href="externalHref"
            target="_blank"
            rel="noopener noreferrer"
        >
            Go to board
        </a>
    </h1>
</template>

<script>
    export default {
        name: 'ThreadBacklinks',

        props: {
            backLink: {
                type: String,
                required: true,
            },
            externalHref: {
                type: String,
                required: true,
            },
        },
    };
</script>
