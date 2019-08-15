<style lang="scss" src="../assets/style/global.scss"></style>
<style lang="scss" scoped>
    @import "../assets/style/modules/include";

    #wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 100%;
        margin: 0;
        text-align: center;
        flex: 1 0 auto;

        > footer {
            flex-shrink: 0;
            max-width: 700px;
            margin: 0 auto;
            margin-top: 2em;
            padding: 10px 18px;
            text-align: center;
            border-radius: 6px 6px 0 0;
            background: darken($background-color, 5%);

            @include no-select();
        }

    }
</style>

<template>
    <div id="wrap">
        <nuxt />
        <footer>
            Copyright &copy; {{ new Date().getFullYear() }} Allypost | All content is courtesy of
            <a
                href="https://www.4chan.org"
                rel="noopener noreferrer"
                target="_blank"
            >
                4chan
            </a>
            <span v-if="hasDonateLink">
                |
                <a
                    :href="donateLink"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    Buy me a coffee
                </a>
            </span>
        </footer>
    </div>
</template>

<script>
    export default {
        data: () => (
            {
                donateLink: '',
            }
        ),

        computed: {
            hasDonateLink() {
                return Boolean(this.donateLink);
            },
        },

        head() {
            return {
                titleTemplate(titleChunk) {
                    if (titleChunk) {
                        return `${ titleChunk } | ThreadPuller`;
                    }

                    return 'ThreadPuller - Pull 4Chan media';
                },
            };
        },
    };
</script>

