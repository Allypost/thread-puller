import {
  join as joinPath,
} from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import {
  ApiError,
  apiRoute,
  registerRoutesInFolder,
} from '../helpers/route';

const app = express();
const routes = registerRoutesInFolder(joinPath(__dirname, 'routes'));

app.set('x-powered-by', false);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(routes);

// Fallback route (404)
app.use('*', apiRoute(() => {
  throw new ApiError('not-found', 404);
}));

export default app;
