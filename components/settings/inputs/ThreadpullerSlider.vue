<template>
  <div :class="$style.container">
    <input
      v-model.number="number"
      type="range"
    >
    <div>
      <label>
        <span>Current value: </span>
        <input
          v-model.number="number"
          max="100"
          min="0"
          type="number"
        >
      </label>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ThreadpullerSlider',

    props: {
      value: {
        type: Number,
        required: true,
      },
    },

    data() {
      return {
        number: this.value,
      };
    },

    watch: {
      number(newValue) {
        this.$emit('input', Number(newValue));
      },

      value(newValue) {
        if (newValue !== this.number) {
          this.number = newValue;
        }
      },
    },
  };
</script>

<style lang="scss" module>
  @import "../../../assets/style/modules/include";

  $thumb-list: -webkit-slider-thumb -moz-range-thumb -ms-thumb;
  $thumb-color: lighten($background-color, 30%);

  $rail-height: 24px;
  $rail-colour: #36484f;

  .container {

    input[type="range"] {
      width: 80%;
      height: $rail-height;
      margin: 1em auto;
      cursor: pointer;
      transition-timing-function: #{$transition-smooth};
      transition-duration: .2s;
      transition-property: opacity, box-shadow;
      border-radius: 3px;
      background: $rail-colour;
      appearance: none;

      &:focus {
        box-shadow: 2px 2px 5px 0 rgba(33, 33, 33, .7);
      }

      @each $thumb in $thumb-list {
        &::#{$thumb} {
          appearance: none;
          width: #{1.5 * $rail-height};
          height: #{1.5 * $rail-height};
          border-radius: 5px;
          background-color: lighten($thumb-color, 5%);
          box-shadow: 1px 1px 4px rgba(0, 0, 0, .69);
          cursor: pointer;
          transition: background-color .35s #{$transition-smooth}, opacity .35s #{$transition-smooth};
        }

        &::#{$thumb}:hover {
          background-color: $thumb-color;
          box-shadow: 1px 1px 5px rgba(0, 0, 0, .8), 0 0 3px rgba(0, 0, 0, .5);
        }

      }
    }

    input[type="number"] {
      font-size: .9em;
      font-weight: bold;
      display: inline-block;
      width: 3.1415359em;
      padding: .1em .3em;
      color: $settings-background-color;
      border: none;
      border-radius: 3px;
      background: $rail-colour;

      &:focus {
        color: $text-color;
      }
    }

    label {
      cursor: pointer;
    }
  }
</style>
