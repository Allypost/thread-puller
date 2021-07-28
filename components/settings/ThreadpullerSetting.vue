<template>
  <div class="setting-container">
    <h3>
      <span>{{ setting.title }}</span>
      <span
        v-if="wasChanged && dirty"
        class="changed-notice"
      > - changed</span>
    </h3>
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
  import {
    constant,
  } from 'lodash/fp';
  import {
    mapState,
  } from 'vuex';
  import SettingCheckbox from './inputs/ThreadpullerCheckbox';
  import SettingSlider from './inputs/ThreadpullerSlider';

  export default {
    name: 'ThreadpullerSetting',

    components: { SettingCheckbox, SettingSlider },

    props: {
      name: {
        type: String,
        required: true,
      },
      dirty: {
        type: Boolean,
        default: constant(false),
      },
    },

    data() {
      return {
        value: undefined,
        wasChanged: false,
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

    watch: {
      value(newValue, oldValue) {
        if (oldValue === undefined) {
          return;
        }

        const { value } = this.setting;

        this.wasChanged = value !== newValue;
      },
    },

    created() {
      this.reset();
      this.$store.subscribe(({ type, payload }) => {
        if (!payload) {
          return;
        }

        const { setting } = payload || {};

        if (
          'settings/change' !== type
          || setting !== this.name
        ) {
          return;
        }

        this.$nextTick(() => this.reset(true));
      });
    },

    methods: {
      reset(fromOtherWindow = false) {
        if (fromOtherWindow && this.wasChanged) {
          return;
        }

        const { value } = this.setting;

        this.value = value;
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  .setting-container {
    @extend %card-shadow;

    margin: .5em 0;
    padding: 1em;
    color: $background-color;
    border-radius: 5px;
    background: $settings-background-color;

    & > * {
      display: block;
      margin: .2em auto;
    }

    .changed-notice {
      font-size: .8em;
      opacity: .7;

      @include no-select();
    }
  }
</style>
