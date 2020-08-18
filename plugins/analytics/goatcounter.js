export default ({ app }) => {
  const count = ({ page }) => {
    window.goatcounter
    && window.goatcounter.count
    && window.goatcounter.count({
      page,
    });
  };

  app.router.afterEach((to) => {
    setTimeout(() => count({ page: to.fullPath }), 100);
  });
};
