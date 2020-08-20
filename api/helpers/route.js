import {
  readdirSync,
} from 'fs';
import {
  join as joinPath,
} from 'path';
import express from 'express';
import {
  HttpStatus,
} from '../../lib/Helpers/Http';

const ExpressRouter = express.Router;

/**
 * @typedef {Object} SuccessResponse
 * @property {boolean} error - Whether an error occurred
 * @property {StatusCode} status - The response status code (200 - OK, everything else - error)
 * @property {*} data - Any response data
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {boolean} error - Whether an error occurred
 * @property {StatusCode} status - The response status code (200 - OK, everything else - error)
 * @property {string} reason - The reason for the error (eg. error text)
 * @property {*} errorData - Any response data
 */

/**
 * @param {boolean} error - Whether the response is an error
 * @param {StatusCode} status - The status for the operation (200 for success)
 * @param {*} data - The data for the response
 */
export const response =
  ({
    error,
    status,
    data,
  }) =>
    ({
      error,
      data,
      status,
    })
;

/**
 * @param {*} data
 * @returns {SuccessResponse}
 */
export const success =
  (data) =>
    response({
      error: false,
      status: HttpStatus.Success.Ok,
      data,
    })
;

/**
 * @param {number} status
 * @param {string} reason
 * @param {*} data
 * @returns {ErrorResponse}
 */
export const error =
  ({ reason, status = HttpStatus.Error.Client.Forbidden, data = null }) =>
    ({
      ...response({
        error: true,
        status,
        data: null,
      }),
      statusInfo: HttpStatus.codeToInfo(status),
      reason,
      errorData: data,
    })
;

export class ApiError extends Error {
  statusCode = HttpStatus.Error.Client.ImATeapot;

  data = null;

  constructor(message, statusCode = HttpStatus.Error.Client.ImATeapot, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}


export const asyncWrapper = (fn) => (...args) => {
  return (
    Promise
      .resolve(fn(...args))
      .catch(args.pop())
  );
};


export const apiRoute = (fn) => asyncWrapper(async (req, res, next) => {
  try {
    const result = await fn(req, res, next);

    return res.json(success(result));
  } catch (e) {
    if (e.statusCode) {
      res.status(e.statusCode);
    } else {
      res.status(HttpStatus.Error.Client.Forbidden);
    }

    const status = res.statusCode;

    const errorData = error({
      status,
      reason: e.message,
      data: e.data,
    });

    if ('development' === process.env.NODE_ENV && !(e instanceof ApiError)) {
      errorData._errorObject = e;
    }

    return res.json(errorData);
  }
});

export const registerRoutesInFolder = (folder) => {
  const router = new ExpressRouter();

  // Register all .js files in routes directory as express routes
  readdirSync(folder)
    // Only consider JS files
    .filter((filename) => filename.endsWith('.js'))
    // Require files and register with express
    .forEach((fileName) => {
      // Add full path to filename
      const filePath = joinPath(folder, fileName);

      // Remove .js from file name to get route name
      const routeName =
        fileName
          .split('.')
          .slice(0, -1)
          .join('.')
      ;

      const routePath = `/${ routeName }`;
      const getHandler = () => {
        const router = require(filePath).default;

        if (router instanceof Router) {
          return router.expose();
        }

        return router;
      };

      router.use(routePath, getHandler());
    })
  ;

  return router;
};

export const registerRoutesInFolderJs =
  (jsFilePath) =>
    registerRoutesInFolder(
      jsFilePath.replace(/.js$/i, ''),
    )
;

export const registerFolderAsRoute = (baseDir, folderName) => {
  const router = new ExpressRouter();

  router.use(folderName, registerRoutesInFolder(joinPath(baseDir, folderName)));

  return router;
};

export class Router {
  /**
   * @type {express.Router}
   */
  #router = null;

  constructor() {
    this.#router = new ExpressRouter();
  }

  /////////// REQUEST METHODS START ///////////
  all(path, ...handlers) {
    return this.addRoute('all', path, handlers);
  }

  get(path, ...handlers) {
    return this.addRoute('get', path, handlers);
  }

  post(path, ...handlers) {
    return this.addRoute('post', path, handlers);
  }

  put(path, ...handlers) {
    return this.addRoute('put', path, handlers);
  }

  delete(path, ...handlers) {
    return this.addRoute('delete', path, handlers);
  }

  patch(path, ...handlers) {
    return this.addRoute('patch', path, handlers);
  }

  options(path, ...handlers) {
    return this.addRoute('options', path, handlers);
  }

  head(path, ...handlers) {
    return this.addRoute('head', path, handlers);
  }

  /////////// REQUEST METHODS END ///////////

  use(...handlers) {
    this.#router.use(...handlers);

    return this;
  }

  /**
   * @param {String} requestMethod
   * @param {String} path
   * @param {Array} handlersList
   *
   * @returns {Router}
   */
  addRoute(requestMethod, path, handlersList) {
    const handler = handlersList.pop();

    this.#router[ requestMethod ](path, ...[ ...handlersList, apiRoute(handler) ]);

    return this;
  }

  /**
   * @return {express.Router}
   */
  expose() {
    return this.#router;
  }
}
