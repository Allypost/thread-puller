import {
  post,
} from 'axios';

function baseUrl(isServer) {
  if (isServer) {
    return `http://localhost:${ process.env.PORT }`;
  } else {
    return '';
  }
}

export const actions = {
  async searchThreads(_, { board, query, nsfw, isServer }) {
    return (
      await post(
        `${ baseUrl(isServer) }/api/v2/4chan/info/search/threads`,
        {
          board,
          query,
          nsfw,
        },
        {
          responseType: 'json',
        },
      )
        .then(({ data }) => data)
        .then(({ data }) => data)
        .catch(() => [])
    );
  },
};
