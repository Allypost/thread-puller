<style scoped lang="scss">
    @import "../../assets/style/modules/include";

    .container {
        @extend %container-base;
    }
</style>

<template>
    <div>
        <SearchInput
            :data="rawThreads"
            :keys="keys"
            @updateData="filteredThreads = arguments[0]"
            @updateQuery="updateQuery"
        />
        <div class="container">
            <board-thread
                v-for="thread in threads"
                :key="thread.id"
                :thread="thread"
            />
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import SearchInput from '../SearchInput';
    import BoardThread from './Thread';

    export default {
        name: 'ThreadsContainer',

        components: { SearchInput, BoardThread },

        data() {
            return {
                filteredThreads: null,
                keys: [
                    {
                        name: 'body.title',
                        weight: 0.50,
                    },
                    {
                        name: 'body.content',
                        weight: 0.40,
                    },
                    {
                        name: 'file.name',
                        weight: 0.10,
                    },
                ],
            };
        },

        computed: {
            threads() {
                return this.filteredThreads || this.rawThreads;
            },

            ...mapGetters({
                'rawThreads': 'threads/get',
            }),
        },

        methods: {
            updateQuery(action, data) {
                this.$router[ action ](data);
            },
        },
    };
</script>
