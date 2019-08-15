import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export async function createRouter(ssrContext, createDefaultRouter) {
    const defaultRouter = createDefaultRouter(ssrContext);
    return new Router({
        ...defaultRouter.options,
        routes: await fixRoutes(defaultRouter.options.routes),
    });
}

async function fixRoutes(defaultRoutes) {
    for (const route of defaultRoutes) {
        const { component } = route;
        const { name } = await component();

        route.name = name || route.name;
    }

    // Default routes that come from `pages/`
    return defaultRoutes;
}
