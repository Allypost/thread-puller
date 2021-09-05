<template>
  <label
    :class="$style.container"
  >
    <input
      v-model="valueProp"
      type="checkbox"
      @input="$emit('input', $event.target.checked)"
    >
    <span
      :class="$style.block"
      v-text="'check'"
    />
  </label>
</template>

<script>
  export default {
    name: 'ThreadpullerCheckbox',

    props: {
      value: {
        type: Boolean,
        default: false,
      },
    },

    data() {
      return {
        valueProp: this.value,
      };
    },

    watch: {
      valueProp(newValue) {
        this.$emit('input', Boolean(newValue));
      },

      value(newValue) {
        if (newValue !== this.valueProp) {
          this.valueProp = newValue;
        }
      },
    },
  };
</script>

<style lang="scss" module>
  @import "../../../assets/style/modules/include";

  .container {
    $left-padding: .2em;

    position: relative;
    display: inline-block;
    padding: #{$left-padding} 1em;
    cursor: pointer;
    border-radius: 8px;
    background: #36484f;

    &::before,
    &::after {
      font-size: .8em;
      line-height: 1.1em;
      position: absolute;
      top: .48em;
    }

    &::before {
      left: .4em;
      content: "On";
      color: $success-color;
    }

    &::after {
      right: .4em;
      content: "Off";
      color: $settings-background-color;
    }

    .block {
      @include no-select;

      position: relative;
      z-index: 1;
      top: 0;
      left: calc(-1em + #{$left-padding});
      display: block;
      overflow: hidden;
      width: 1.4em;
      height: 1.2em;
      cursor: pointer !important;
      transition: all .5s #{$transition-smooth};
      color: transparent;
      border-radius: 6px;
      background: $settings-background-color;

      &:hover {
        background: #fafafa;
      }
    }

    input[type="checkbox"]:checked + .block {
      left: calc(1em - #{$left-padding});
      background: $success-color;
    }

    input[type="checkbox"] {
      display: none;
    }
  }
</style>
