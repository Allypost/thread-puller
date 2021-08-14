export const actions = {
  async searchThreads(
    _,
    {
      board,
      query,
      nsfw,
    },
  ) {
    return (
      await this
        .$api
        .$post(
          '/v2/4chan/info/search/threads',
          {
            board,
            query,
            nsfw,
          },
        )
        .then(({ data }) => data)
        .catch(() => [])
    );
  },
};
