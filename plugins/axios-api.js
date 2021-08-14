/* eslint-disable @typescript-eslint/consistent-type-definitions */

// import type {
//   Plugin,
// } from '@nuxt/types';
// import type {
//   NuxtAxiosInstance,
// } from '@nuxtjs/axios';
//
// declare module 'vue/types/vue' {
//   // this.$api inside Vue components
//   interface Vue {
//     $api: NuxtAxiosInstance;
//   }
// }
//
// declare module '@nuxt/types' {
//   // nuxtContext.app.$api inside asyncData, fetch, plugins, middleware, nuxtServerInit
//   interface NuxtAppOptions {
//     $api: NuxtAxiosInstance;
//   }
//
//   // nuxtContext.$api
//   interface Context {
//     $api: NuxtAxiosInstance;
//   }
// }
//
// declare module 'vuex/types/index' {
//   // this.$api inside Vuex stores
//   interface Store<S> {
//     $api: NuxtAxiosInstance;
//   }
// }

const plugin =
  (
    context,
    inject,
  ) => {
    const api = context.$axios.create({});

    const baseUrl =
      process.server
        ? `http://localhost:${ process.env.PORT }/api`
        : (process.env.THREADPULLER_DOMAIN_API || '')
    ;

    api.setBaseURL(baseUrl);
    api.setHeader('Content-Type', 'application/json');

    api.interceptors.response.use(
      (response) => response,
      (
        { response },
      ) => {
        return response;
      },
    );

    inject('api', api);
  }
;

export default plugin;
