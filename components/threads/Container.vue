<style scoped lang="scss">
    @import "../../assets/style/modules/include";

    .container {
        @extend %container-base;
    }
</style>

<template>
    <div class="container">
        <board-thread
            v-for="thread in threads"
            :key="thread.id"
            :thread="thread"
        />
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import BoardThread from './Thread';

    export default {
        name: 'ThreadsContainer',

        components: { BoardThread },

        computed: {
            ...mapGetters({
                'threads': 'threads/get',
            }),
        },
    };
</script>
