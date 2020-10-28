<template>
  <div
    class="checkbox-container"
  >
    <input
      :id="id"
      v-model="value"
      :name="id"
      type="checkbox"
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

<style lang="scss" scoped>
  @import "../../../assets/style/modules/include";

  .checkbox-container {
    $left-padding: .2em;

    position: relative;
    display: inline-block;
    padding: #{$left-padding} 1em;
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

    label {
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

    input[type="checkbox"]:checked + label {
      left: calc(1em - #{$left-padding});
      background: $success-color;
    }

    input[type="checkbox"] {
      display: none;
    }
  }
</style>
