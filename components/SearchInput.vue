<style lang="scss" scoped>
    @import "../assets/style/modules/include";

    .hidden {
        @include no-select();

        opacity: 0;
    }
</style>

<template>
    <label>
        Search:
        <input
            v-model="query"
            v-focus
            type="text"
        >
        <button
            :class="{ hidden: !query.length }"
            :tabindex="-1 * !query.length"
            @click="query = ''"
        >
            Clear
        </button>
    </label>
</template>

<script>
    import { Fuse } from '../lib/Search/Fuse';

    export default {
        name: 'SearchInput',

        props: {
            data: {
                type: Array,
                required: true,
            },
            keys: {
                type: Array,
                default() {
                    return [];
                },
            },
        },

        data() {
            return {
                query: String(this.$route.query.q || ''),
            };
        },

        computed: {
            fuse() {
                return Fuse(this.data, this.keys);
            },
        },

        watch: {
            query(...args) {
                return this.updateQuery(...args);
            },

            '$route.query'({ q }) {
                /**
                 * If the URL query isn't set or is empty
                 * and the local query data is set,
                 * clear the local query value.
                 */
                if (!q && this.query) {
                    this.query = '';
                }
            },
        },

        created() {
            this.updateData(this.query);
        },

        methods: {
            updateData(query) {
                const getData = (query) => {
                    if (!query) {
                        return null;
                    }

                    return (
                        this
                            .fuse
                            .search(query)
                            .map(({ item }) => item)
                    );
                };

                this.$emit(
                    'updateData',
                    getData(query),
                );
            },

            updateQuery(newValue) {
                const { q, ...query } = this.$route.query;

                this.updateData(newValue);

                /*
                 * If the query value is empty, but there exists an URL query parameter value.
                 * That means that we should remove the URL query parameter.
                 */
                if (!newValue && q) {
                    return this.$emit('updateQuery', 'replace', { query });
                }

                const route = {
                    query: {
                        q: newValue,
                        ...query,
                    },
                };

                /**
                 * If a query was already set, replace it in the history
                 */
                if (q) {
                    return this.$emit('updateQuery', 'replace', route);
                }

                /**
                 * Add a query parameter to the URL if a query exists
                 */
                if (newValue) {
                    return this.$emit('updateQuery', 'push', route);
                }
            },
        },
    };
</script>
