<style scoped lang="scss">
    @import "../../../../assets/style/modules/include";

    .spinner {
        @keyframes spin {
            to {
                -webkit-transform: rotate(360deg);
            }
        }

        display: inline-block;
        width: 50px;
        height: 50px;
        border: 3px solid rgba(255, 255, 255, .3);
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: spin 1s cubic-bezier(0.65, 0.05, 0.3, 0.8) infinite;
        background: #455a64;
    }
</style>

<template>
    <div
        class="spinner"
        :style="style"
    />
</template>

<script>
    export default {
        name: 'LoaderSpinner',

        props: {
            size: {
                type: String,
                default: '50px',
            },
        },

        computed: {
            style() {
                const { size } = this;
                return `width: ${ size }; height: ${ size }`;
            },
        },
    };
</script>
