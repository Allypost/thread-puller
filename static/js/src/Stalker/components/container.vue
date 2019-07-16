<template>
    <ol class="container" v-if="parsedEntries.length">
        <stalker-group v-for="(entry, key) in parsedEntries" :entry="entry" :key="key" />
    </ol>
    <h3 v-else>
        Nobody online :(
    </h3>
</template>

<style>
    body {
        flex-direction: initial;
    }

    img {
        width: initial;
    }
</style>

<style scoped>
    .container {
        display: inline-block;
    }
</style>

<script>
    import StalkerGroup from './group';

    export default {
        components: {
            StalkerGroup,
        },
        props: [ 'entries' ],
        computed: {
            parsedEntries() {
                return Object.entries(this.entries);
            },
        },
    };
</script>
