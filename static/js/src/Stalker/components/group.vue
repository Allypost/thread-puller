<template>
    <li>
        <details open>
            <summary>
                <span class="session-id">{{ id }}</span>
                <span class="metadata">
                        <span class="country-flags">
                            <img v-for="country in countries" :src="country.src" :alt="country.alt">
                        </span>
                    </span>
            </summary>
            <ol>
                <stalker-entry v-for="[id, session] in sessions" :entry="session" :key="id" />
            </ol>
        </details>
    </li>
</template>

<style lang="scss">
    li {
        text-align: left;
        margin-top: .69em;

        &:first-child {
            margin-top: 0;
        }

        &[data-focused]::before {
            content: '(F) ';
            color: #03a9f4;
        }
    }
</style>

<style scoped lang="scss">
    details {

        summary {
            outline: none;
            cursor: pointer;

            .metadata {
                display: initial;
            }

            .session-id:after {
                content: ' | ';
            }

        }

        &[open] {

            summary {

                .metadata {
                    display: none;
                }

                .session-id:after {
                    content: none;
                }

            }

        }

    }
</style>

<script>
    import StalkerEntry from './entry';

    export default {
        components: {
            StalkerEntry,
        },
        props: [ 'entry' ],
        computed: {
            id() {
                return this.entry[ 0 ];
            },

            sessions() {
                return Object.entries(this.entry[ 1 ]);
            },

            countries() {
                const countries = {};

                for (const [_, session] of this.sessions) {
                    const {
                              country,
                              region = 'Unknown region',
                              city   = 'Unknown city',
                          } = session.geo;

                    const countryCode = country || 'XK';
                    const countryName = country || 'Unknown country';

                    countries[ countryCode ] = {
                        src: `https://www.countryflags.io/${countryCode}/flat/24.png`,
                        alt: `${countryName}, ${region}, ${city}`,
                    };
                }

                return Object.values(countries);
            },
        },
    };
</script>
