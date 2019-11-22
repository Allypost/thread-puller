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
    const routeChildren = [];

    async function getRouteName(route) {
        const { component, children = [], name: oldName } = route;
        const { name } = await component();

        if (children) {
            routeChildren.push(...children);
        }

        return name || oldName;
    }

    for (const route of defaultRoutes) {
        route.name = await getRouteName(route);
    }

    for (const route of routeChildren) {
        route.name = await getRouteName(route);
    }

    // Default routes that come from `pages/`
    return defaultRoutes;
}
