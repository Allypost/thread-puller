<style lang="scss" scoped>
    @import "../../assets/style/modules/include";

    .setting-container {
        @extend %card-shadow;

        background: $settings-background-color;
        color: $background-color;
        padding: 1em;
        margin: .5em 0;
        border-radius: 5px;

        & > * {
            display: block;
            margin: .2em auto;
        }
    }
</style>

<template>
    <div class="setting-container">
        <h3>{{ setting.title }}</h3>
        <span>{{ setting.text }}</span>
        <div class="setting">
            <component
                :is="inputType"

                v-model="value"
                :name="name"
                @input="$emit('input', $event)"
            />
        </div>
    </div>
</template>

<script>
    import { mapState } from 'vuex';
    import SettingCheckbox from './inputs/Checkbox';
    import SettingSlider from './inputs/Slider';

    export default {
        name: 'ThreadpullerSetting',

        components: { SettingCheckbox, SettingSlider },

        props: {
            name: {
                type: String,
                required: true,
            },
        },

        data() {
            return {
                value: undefined,
            };
        },

        computed: {
            inputType() {
                /* eslint-disable vue/script-indent */
                switch (typeof this.value) {
                    case 'boolean':
                        return 'setting-checkbox';
                    case 'number':
                        return 'setting-slider';
                    default:
                        return 'unknown';
                }
                /* eslint-enable vue/script-indent */
            },

            ...mapState('settings', {
                setting(state) {
                    return state[ this.name ];
                },
            }),
        },

        created() {
            this.reset();
            this.$store.subscribe(({ type, payload: { setting } }) => {
                if (
                    'settings/change' !== type
                    || setting !== this.name
                ) {
                    return;
                }

                this.$nextTick(() => this.reset());
            });
        },

        methods: {
            reset() {
                const { value } = this.setting;

                this.value = value;
            },
        },
    };
</script>
