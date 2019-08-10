<style lang="scss" scoped>
    @import "../../assets/style/modules/include";

    .container {
        @extend %container-base;
    }
</style>

<template>
    <div class="container">
        <board-entry
            v-for="board of boards"
            :key="board.board"
            :board="board"
        />
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import BoardEntry from './Board';

    export default {
        name: 'Container',

        components: { BoardEntry },

        computed: {
            ...mapGetters({
                'boards': 'boards/get',
            }),
        },
    };
</script>
