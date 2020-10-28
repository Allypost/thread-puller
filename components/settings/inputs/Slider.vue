<template>
  <div class="range-container">
    <input
      :id="id"
      v-model.number="number"
      :name="name"
      type="range"
    >
    <div>
      <label :for="`${id}-text`">
        <span>Current value: </span>
        <input
          :id="`${id}-text`"
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
      name: {
        type: String,
        required: true,
      },

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

    computed: {
      id() {
        const timePart = Number(new Date()).toString(36);
        const randPart = Math.random().toString(36).slice(2);

        return `${ this.name }-${ timePart }-${ randPart }`;
      },
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

<style lang="scss" scoped>
  @import "../../../assets/style/modules/include";

  $thumb-list: -webkit-slider-thumb -moz-range-thumb -ms-thumb;
  $thumb-color: lighten($background-color, 30%);

  $rail-colour: #36484f;

  input[type="range"] {
    width: 80%;
    height: 24px;
    margin: 1em auto;
    cursor: pointer;
    transition-timing-function: #{$transition-smooth};
    transition-duration: .2s;
    transition-property: opacity, box-shadow;

    border-radius: 3px;
    background: $rail-colour;
    appearance: none;

    &:focus {
      box-shadow: 2px 2px 5px 0 rgba(33, 33, 33, 0.7);
    }

    @each $thumb in $thumb-list {
      &::#{$thumb} {
        appearance: none;
        width: 2.8em;
        height: 2.8em;
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
    font-size: 0.9em;
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
</style>
