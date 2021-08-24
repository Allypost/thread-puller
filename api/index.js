import path from 'path';
import dotenv from 'dotenv';
import express from 'express';

const DOTENV_PATH = path.resolve(__dirname, '../.env');
dotenv.config({
  path: DOTENV_PATH,
});

const app = express();

app.set('x-powered-by', false);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const v14chan = require('./v1/4chan');
app.use(v14chan.path, v14chan.handler);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const v14chanImages = require('./v1/4chan-images');
app.use(v14chanImages.path, v14chanImages.handler);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const v2Api = require('./v2').default;
app.use('/api/v2', v2Api);

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(
  PORT,
  HOST,
  () => {
    console.clear();
    console.log('Running on http://%s:%d', HOST, PORT);
  },
);
