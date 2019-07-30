<style lang="scss" scoped>
    header {
        margin-bottom: .3em;

        &[data-missing-title] {

            a {
                font-weight: normal;
            }

        }

    }

    h1 {
        display: inline-block;
        font-size: 1em;
        margin: 0;
        text-align: center;
        font-weight: bold;

        a {
            font-size: 1.3em;
            text-decoration: underline;
            color: #000000;

            &:hover {
                text-decoration: none;
            }

        }

    }
</style>

<template>
    <header :data-missing-title="!hasTitle">
        <h1>
            <a :href="threadLink">
                <span v-if="hasTitle">{{ parsedTitle }}</span>
                <i v-else>No title</i>
            </a>
        </h1>
    </header>
</template>

<script>
    export default {
        props: {
            title: {
                type: String,
                required: true,
            },
            threadLink: {
                type: String,
                required: true,
            },
        },

        computed: {
            parsedTitle() {
                const textAreaElement = document.createElement('textarea');
                textAreaElement.innerHTML = this.title;

                return textAreaElement.value;
            },

            hasTitle() {
                return Boolean(this.title);
            },
        },
    };
</script>
