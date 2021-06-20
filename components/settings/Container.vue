<template>
  <div
    class="container"
  >
    <img
      :class="{ open }"
      :src="imgSrc"
      alt="Settings"
      @click="handleClickCog"
    >
    <client-only>
      <sweet-modal
        id="settings-modal"
        ref="modal"
        modal-theme="dark"
        overlay-theme="dark"
        @close="handleClose"
        @open="handleOpen"
      >
        <threadpuller-setting
          v-for="name in settings"
          :key="name"

          ref="settings"

          :name="name"
          @input="handleSettingChange(name, $event)"
        />

        <div
          slot="button"
          class="footer"
        >
          <button
            class="cancel-btn"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            class="save-btn"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </sweet-modal>
    </client-only>
  </div>
</template>

<script>
  import {
    SweetModal,
  } from 'sweet-modal-vue';
  import {
    mapGetters,
  } from 'vuex';
  import CogImg from '../../assets/images/cog.png';
  import ThreadpullerSetting from './Setting';

  export default {
    name: 'ThreadpullerSettings',

    components: { ThreadpullerSetting, SweetModal },

    data() {
      return {
        open: false,
        changedSettings: {},
      };
    },

    computed: {
      imgSrc() {
        return CogImg;
      },

      ...mapGetters({
        settings: 'settings/keys',
      }),
    },

    methods: {
      handleClickCog() {
        this.$refs.modal.open();
      },

      handleOpen() {
        this.open = true;
      },

      handleClose() {
        this.open = false;
      },

      handleCancel() {
        this.$refs.modal.close();
        this.$refs.settings.forEach((el) => el.reset());
      },

      async handleSave() {
        this.$refs.modal.close();

        await this.$store.dispatch('settings/UPDATE', this.changedSettings);

        this.$set(this, 'changedSettings', {});
      },

      handleSettingChange(setting, newValue) {
        this.$set(this.changedSettings, setting, newValue);
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import "../../assets/style/modules/include";

  $size: 3.14159265359em;

  .container {
    position: absolute;
    top: 1em;
    right: 1em;
    width: $size;
    height: $size;

    img {
      width: 100%;
      cursor: pointer;
      transition: transform .3s #{$transition-smooth}, opacity .3s #{$transition-smooth};
      opacity: .5;

      &:hover {
        opacity: .75;
      }

      &.open {
        transform: rotate(180deg);
        opacity: 1;
      }
    }
  }
</style>

<style lang="scss">
  @import "../../assets/style/modules/include";

  #settings-modal.is-visible {

    .sweet-modal.is-alert {
      font-size: 1.35em;
      max-width: 95vw;
      max-height: 95vh;
      background: $background-color;

      .sweet-content-content {
        font-size: 1.45em;
      }
    }

    .footer {

      button {
        @extend %card-shadow;

        font-size: 2em;
        margin: 0 .2em;
        padding: .1em .5em;
        cursor: pointer;
        transition: background-color .8s #{$transition-smooth}, box-shadow .8s #{$transition-smooth};
        color: $background-color;
        border: none;
        border-radius: 5px;
        background-color: $settings-background-color;
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .12), 0 1px 5px 0 rgba(0, 0, 0, .2);

        &:hover {
          box-shadow: 0 3px 3px 0 rgba(0, 0, 0, .14), 0 1px 7px 0 rgba(0, 0, 0, .12), 0 3px 1px -1px rgba(0, 0, 0, .2);
        }
      }

      .cancel-btn {
        $color: $background-color;
        $background: $warning-color;

        color: $color;
        background-color: $background;
        text-shadow: 1px 1px 3px transparentize(invert($color), .3);

        &:hover {
          background-color: lighten($background, 10%);
        }

        &:active {
          background-color: darken($background, 15%);
        }
      }

      .save-btn {
        $color: #ffffff;
        $background: $success-color;

        color: $color;
        background-color: $background;
        text-shadow: 1px 1px 3px transparentize(invert($color), .3);

        &:hover {
          background-color: lighten($background, 5%);
        }

        &:active {
          background-color: darken($background, 10%);
        }
      }
    }
  }
</style>
