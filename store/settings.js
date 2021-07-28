export const SETTINGS_COOKIE_NAME = 'threadpuller-settings';

export const state = () => (
  {
    volume: {
      title: 'Video volume',
      text: 'This is the volume that the video will be set to by default. You can change it in-video during playback as usual.',
      value: 50,
    },

    /*
     // Disable for now

     autoplay: {
     title: 'Play on load',
     text: 'Whether to automatically play videos when you load a page.',
     value: false,
     },
     */

    loop: {
      title: 'Loop video',
      text: 'Whether to loop videos after they\'ve finished.',
      value: false,
    },
  }
);

export const getters = {
  // eslint-disable-next-line lodash-fp/prefer-identity
  get(settings) {
    return settings;
  },

  keys(settings) {
    return Object.keys(settings);
  },

  values(settings) {
    return (
      Object
        .entries(settings)
        .map(([ name, { value } ]) => [ name, value ])
        .reduce((acc, [ k, v ]) => Object.assign(acc, { [ k ]: v }), {})
    );
  },

  getOne(settings) {
    return (settingName) => settings[ settingName ];
  },

  has(settings) {
    return (settingName) => 'undefined' !== typeof settings[ settingName ];
  },
};

export const mutations = {
  set(settings, newSettings) {
    Object.assign(settings, newSettings);

    return settings;
  },

  change(settings, { setting, value }) {
    settings[ setting ].value = value;

    return settings;
  },
};

export const actions = {
  UPDATE({ dispatch }, settings, localOnly = false) {
    const updateSettings =
      Object
        .entries(settings)
        .map(([ setting, value ]) => ({ setting, value }))
        .map((setting) => dispatch('CHANGE', setting, localOnly));

    return Promise.all(updateSettings);
  },

  /**
   * @return {boolean} Success
   */
  CHANGE({ commit, getters }, { setting, value }, localOnly = false) {
    if (!getters.has(setting)) {
      return false;
    }

    commit('change', { setting, value });

    if (localOnly) {
      return true;
    }

    this.$cookies.set(SETTINGS_COOKIE_NAME, getters.values, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    return true;
  },

  /**
   * @return {Object|null}
   */
  READ_FROM_COOKIE() {
    const settings = this.$cookies.get(SETTINGS_COOKIE_NAME);

    try {
      return JSON.parse(settings);
    } catch (e) {
      return null;
    }
  },

  async HYDRATE_FROM_COOKIE({ getters, dispatch }) {
    const cookieData = await dispatch('READ_FROM_COOKIE');

    if (cookieData) {
      await dispatch('UPDATE', cookieData);
    } else {
      await dispatch('UPDATE', getters.values);
    }

    return getters.get;
  },
};
