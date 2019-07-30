<style lang="scss" scoped>
    @import "../../style/common";

    section {
        display: grid;
        justify-items: center;
        align-items: center;
        max-height: $maxTextHeight;
        overflow: hidden;

        &.extended {
            cursor: zoom-out !important;
            max-height: none;
            height: initial;
        }
    }

    .thumb-image {
        cursor: pointer;
        max-width: 100%;
    }
</style>

<template>
    <section
            :class="{ 'extended': isExpanded }"
            @click="handleMediaClick"
            v-if="hasFile"
    >
        <thread-media :file="file" v-if="isExpanded" />
        <img :alt="file.name" :src="file.meta.thumbSrc" class="thumb-image" v-else>
    </section>
</template>

<script>
    import ThreadMedia from './thread-media/container';

    export default {
        components: { ThreadMedia },

        props: {
            file: {
                type: Object,
                required: true,
            },
        },

        data: () => ({
            isExpanded: false,
        }),

        methods: {

            handleMediaClick() {
                this.isExpanded = !this.isExpanded;
                this.$emit('click', this.isExpanded);
            },

        },

        computed: {

            hasFile() {
                return Boolean(this.file);
            },

        },
    };
</script>
