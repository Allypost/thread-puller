export default ({ app }) => {
    window.goatcounter = window.goatcounter || {};
    // eslint-disable-next-line camelcase
    window.goatcounter.vars = { no_onload: true };

    window.counter = process.env.THREADPULLER_GOATCOUNTER_URL;

    const count = ({ page }) => {
        window.goatcounter.count({
            page,
        });
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = '//gc.zgo.at/count.js';
    script.addEventListener('load', () => {
        count({ page: app.router.currentRoute.fullPath });

        app.router.afterEach((to) => {
            count({ page: to.fullPath });
        });
    });

    const [ ins ] = document.getElementsByTagName('script');
    ins.parentNode.insertBefore(script, ins);
};
