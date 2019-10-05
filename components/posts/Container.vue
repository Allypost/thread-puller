<style lang="scss" scoped>
    @import "../../assets/style/modules/include";

    .container {
        @extend %container-base;
        align-items: baseline;
    }

    #focused-post-modal {
        background-color: rgba(0, 0, 0, .5);

        .thread-image {
            @include no-select();

            display: grid;

            margin: 0 auto;
            height: calc(98vh - 130px);

            text-align: center;
        }
    }
</style>
<style lang="scss">
    @import "../../assets/style/modules/include";

    #focused-post-modal {

        .sweet-modal {
            max-width: 98vw;
            max-height: 98vh;
            background: $background-color;

            .thread-image {

                > img {
                    @extend %card-shadow;

                    width: auto;
                    max-width: 100%;
                    min-height: 100%;
                    margin: 0 auto;
                }

            }

        }

    }
</style>

<template>
    <div
        class="top-container"
        :class="{ hasImageFocused: Boolean(focusedImage) }"
    >
        <div class="container">
            <thread-post
                v-for="post in mediaPosts"
                :key="post.id"
                :post="post"
            />
        </div>


        <no-ssr>
            <sweet-modal
                id="focused-post-modal"
                ref="modal"
                overlay-theme="dark"
                modal-theme="dark"
                @close="unfocusImage"
            >
                <thread-image
                    v-if="focusedImage"
                    :alt="focusedImage.name"
                    :src-set="focusedImageSrcset"
                    class="thread-image"
                />
            </sweet-modal>
        </no-ssr>
    </div>
</template>

<script>
    import { mapGetters, mapMutations } from 'vuex';
    import { SweetModal } from 'sweet-modal-vue';
    import ThreadPost from './Post';
    import ThreadImage from '../threads/thread/media/components/Image';

    export default {
        name: 'PostsContainer',

        components: { ThreadPost, ThreadImage, SweetModal },

        computed: {
            mediaPosts() {
                return this.posts.filter(({ file }) => Boolean(file));
            },

            focusedImage() {
                const focused = this.focusedPost;

                if (!focused) {
                    return null;
                }

                return focused.file;
            },

            focusedImageSrcset() {
                const focused = this.focusedImage;

                if (!focused) {
                    return {};
                }

                const { local, remote } = focused.src;

                return {
                    local: local.full,
                    remote: remote.full,
                };
            },

            ...mapGetters({
                posts: 'posts/get',
                focusedPost: 'posts/getFocused',
            }),
        },

        watch: {
            focusedPost(changed) {
                if (null !== changed) {
                    this.$refs.modal.open();
                }
            },
        },

        methods: {
            ...mapMutations({
                'unfocusImage': 'posts/setUnfocused',
            }),
        },
    };
</script>

