export default function({ $axios, isDev }, inject) {
  const api = $axios.create({});

  const baseUrl =
    process.server
      ? `http://localhost:${ isDev ? '3000' : process.env.PORT }`
      : ''
  ;

  api.setBaseURL(`${ baseUrl }/api/v2/`);
  api.setHeader('Content-Type', 'application/json');

  api.interceptors.response.use(
    (response) => response,
    ({ response }) => response,
  );

  inject('api', api);
}
