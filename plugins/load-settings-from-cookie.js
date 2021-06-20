export default async function ({ store }) {
  // Called when the store is initialized
  await store.dispatch('settings/HYDRATE_FROM_COOKIE');
}
