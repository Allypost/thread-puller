<style lang="scss" scoped>
    @import "../../assets/style/modules/include";

    .container {
        @extend %container-base;
        align-items: baseline;
    }
</style>

<template>
    <div class="container">
        <thread-post
            v-for="post in mediaPosts"
            :key="post.id"
            :post="post"
        />
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import ThreadPost from './Post';

    export default {
        name: 'PostsContainer',

        components: { ThreadPost },

        computed: {
            mediaPosts() {
                return this.posts.filter(({ file }) => Boolean(file));
            },

            ...mapGetters({
                posts: 'posts/get',
            }),
        },
    };
</script>

