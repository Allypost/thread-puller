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
            draggable="false"
            :alt="alt"
            :src="src"
            :class="{isLoading}"
            @error="handleError"
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
    import FileDeletedImage from '../../../../../assets/images/deleted.gif';

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
                errors: {},
                isLoading: false,
            };
        },

        computed: {
            src() {
                const { local, remote } = this.srcSet;

                const src = [ remote, local, FileDeletedImage ];

                return src.find((src) => !this.srcHadError(src));
            },
        },

        watch: {
            src() {
                this.isLoading = true;
            },
        },

        methods: {
            handleError() {
                this.$set(this.errors, this.src, true);
            },

            srcHadError(src) {
                const { errors } = this;

                return Boolean(errors[ src ]);
            },
        },
    };
</script>
