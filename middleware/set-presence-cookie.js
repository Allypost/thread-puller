import {
  v1 as uuidV1,
} from 'uuid';

export default ({ app, store }) => {
  const presence = {
    name: 'presence-id',
    id: '',
  };

  const currentID = app.$cookies.get(presence.name);

  if (currentID) {
    presence.id = currentID;
  } else {
    presence.id = uuidV1();

    app.$cookies.set(presence.name, presence.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  store.commit('presence/SET_PRESENCE', presence);
};
