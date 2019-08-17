<style scoped lang="scss">
    @import "../assets/style/modules/include";

    .peers {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        padding: .2em .6em;
        background: $background-color;
        border-top-right-radius: 5px;
        font-weight: bold;

        @include no-select();

        &.show {
            display: inline-block;
        }

        .help-text {
            display: none;
        }

        &:hover {

            .help-text {
                display: inline;
            }

        }
    }
</style>

<template>
    <div
        class="peers"
        :class="{ show }"
    >
        <span class="title">P: </span><span class="count">{{ peers }}</span><span class="help-text"> {{ helpText }}</span>
    </div>
</template>

<script>
    export default {
        name: 'PeerCount',

        props: {
            socket: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                peers: 0,
            };
        },

        computed: {

            show() {
                return Boolean(this.peers);
            },

            helpText() {
                if (1 < this.peers) {
                    return 'other users on this page';
                } else {
                    return 'other user on this page';
                }
            },

        },

        mounted() {
            this.socket.on('event:peers:page:count', (peers) => {
                this.peers = peers - 1;
            });
        },
    };
</script>
