<style scoped lang="scss">
    @import "../../../../../assets/style/modules/include";

    .img-container {
        width: 100%;
        position: relative;
        display: inline-block;
    }

    .img-spinner {
        position: absolute;
        top: .5em;
        right: .5em;
    }

    img {
        width: 100%;
        filter: none;
        transition: .25s filter ease-out;

        &.isLoading {
            filter: progid:DXImageTransform.Microsoft.Blur(PixelRadius='2');
            filter: blur(2px);
        }
    }

</style>

<template>
    <span class="img-container">
        <img
            :alt="alt"
            :src="src"
            :class="{isLoading}"
            @error="hadError = true"
            @load="isLoading = false"
        >
        <img-loader
            v-if="isLoading"
            class="img-spinner"
        />
    </span>
</template>

<script>
    import ImgLoader from '../Loader';

    export default {
        name: 'ThreadMediaThumb',

        components: { ImgLoader },

        props: {
            srcSet: {
                type: Object,
                required: true,
            },
            alt: {
                type: String,
                required: true,
            },
        },

        data() {
            return {
                hadError: false,
                isLoading: false,
            };
        },

        computed: {
            src() {
                if (!this.hadError) {
                    return this.srcSet.remote;
                }

                return this.srcSet.local;
            },
        },

        watch: {
            src() {
                this.isLoading = true;
            },
        },
    };
</script>
