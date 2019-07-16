<template>
    <li :data-focused="isFocused">
        [<img class="country-flag" :src="flagUrl" :alt="geo.country" :title="flagTitle"> | {{ geo.city || 'Unknown' }}]
        <span v-if="isLoading"><i>Loading...</i></span>
        <a :href="location.link" v-else>{{ title }}</a>
    </li>
</template>

<script>
    export default {
        props: [ 'entry' ],
        computed: {
            isFocused() {
                return Boolean(this.entry.focus);
            },

            isLoading() {
                return this.location.loading === true;
            },

            location() {
                return this.entry.location;
            },

            title() {
                const div = document.createElement('textarea');
                div.innerHTML = this.location.title;

                return div.innerText;
            },

            geo() {
                return this.entry.geo || {};
            },

            flagTitle() {
                const {
                          country = 'Unknown',
                          region  = 'Unknown',
                      } = this.geo;
                return `${country}, ${region}`;
            },

            flagUrl() {
                const { country = 'XK' } = this.geo;
                return `https://www.countryflags.io/${country}/flat/24.png`;
            },
        },
    };
</script>
