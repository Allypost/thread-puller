import shareMutations from 'vuex-shared-mutations';

export default ({ store }) => {
    window.onNuxtReady(() => {
        shareMutations({
            predicate: ({ type }) => type.startsWith('settings/'),
        })(store);
    });
};
