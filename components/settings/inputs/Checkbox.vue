<style lang="scss" scoped>
    @import "../../../assets/style/modules/include";

    .checkbox-container {
        $left-padding: .2em;

        position: relative;
        display: inline-block;
        background: #36484f;
        border-radius: 8px;
        padding: #{$left-padding} 1em;

        &::before,
        &::after {
            position: absolute;
            top: .48em;
            font-size: .8em;
            line-height: 1.1em;
        }

        &::before {
            content: 'On';
            left: .4em;
            color: $success-color;
        }

        &::after {
            content: 'Off';
            right: .4em;
            color: $settings-background-color;
        }

        label {
            @include no-select;

            display: block;
            width: 1.4em;
            height: 1.2em;
            border-radius: 6px;
            color: transparent;
            overflow: hidden;

            z-index: 1;
            position: relative;
            top: 0;
            left: calc(-1em + #{$left-padding});
            cursor: pointer !important;
            background: $settings-background-color;

            transition: all .5s #{$transition-smooth};

            &:hover {
                background: #fafafa;
            }
        }

        input[type="checkbox"]:checked + label {
            left: calc(1em - #{$left-padding});
            background: $success-color;
        }

        input[type="checkbox"] {
            display: none;
        }
    }
</style>

<template>
    <div
        class="checkbox-container"
    >
        <input
            :id="id"
            v-model="value"
            type="checkbox"
            :name="id"
            @input="$emit('input', $event.target.checked)"
        >
        <label :for="id">{{ name }}</label>
    </div>
</template>

<script>
    export default {
        name: 'ThreadpullerCheckbox',

        props: {
            name: {
                type: String,
                required: true,
            },

            value: {
                type: Boolean,
                default: false,
            },
        },

        computed: {
            id() {
                const timePart = Number(new Date()).toString(36);
                const randPart = Math.random().toString(36).slice(2);

                return `${ this.name }-${ timePart }-${ randPart }`;
            },
        },
    };
</script>
