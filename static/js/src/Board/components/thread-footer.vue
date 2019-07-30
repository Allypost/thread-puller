<style lang="scss" scoped>
    @import "../style/common";

    footer {
        @include no-select();

        display: grid;
        font-size: .8em;
        border-radius: 0 0 6px 6px;
        background-color: $meta-background-color;
        text-align: center;
        align-items: center;
        justify-items: center;
    }
</style>

<template>
    <footer>
        <span>
            {{ imageCount }} images | {{ replyCount }} replies
        </span>
    </footer>
</template>

<script>
    export default {
        props: {
            imageCount: {
                type: Number,
                required: true,
            },
            replyCount: {
                type: Number,
                required: true,
            },
        },
    };
</script>
