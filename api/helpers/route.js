import {
  readdirSync,
  statSync,
} from 'fs';
import {
  join as joinPath,
  dirname,
  basename,
} from 'path';
import express from 'express';
import flattenDeep from 'lodash/fp/flattenDeep';
import flow from 'lodash/fp/flow';
import groupBy from 'lodash/fp/groupBy';
import initial from 'lodash/fp/initial';
import map from 'lodash/fp/map';
import reduce from 'lodash/fp/reduce';
import sortBy from 'lodash/fp/sortBy';
import toPairs from 'lodash/fp/toPairs';
import {
  HttpStatus,
} from '../../lib/Helpers/Http';

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
      ts: Date.now(),
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
 * @typedef {Object} ErrorParams
 * @property {number} status - Whether an error occurred
 * @property {string} reason - The response status code (200 - OK, everything else - error)
 * @property {*} [data] - Any response data
 */

/**
 * @param {ErrorParams} params
 * @returns {ErrorResponse}
 */
export const error =
  ({
    reason,
    status = HttpStatus.Error.Client.Forbidden,
    data = null,
  }) =>
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
    this.statusCode = statusCode || HttpStatus.Error.Client.ImATeapot;
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

export const rawRoute = (fn) => asyncWrapper(async (req, res, next) => {
  try {
    const result = await fn(req, res, next);

    if (result instanceof Buffer || 'string' === typeof result) {
      return res.end(result);
    } else {
      return res.end();
    }
  } catch (e) {
    if (e.statusCode) {
      res.status(e.statusCode);
    } else {
      res.status(HttpStatus.Error.Client.Forbidden);
    }

    if (e instanceof ApiError) {
      res.set('X-Api-Error', e.message);
    } else if ('development' === process.env.NODE_ENV) {
      console.log('|> ERROR', '\n', e);
    }

    return res.end();
  }
});

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
  const router = new express.Router();

  // Register all .js files in routes directory as express routes
  readdirSync(folder)
    // Only consider JS files
    .filter((filename) => filename.endsWith('.js') || filename.endsWith('.ts'))
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

export const registerRoutesInFolderRecursive = (...folderParts) => {
  const folder = joinPath(...folderParts);

  const isDirectory = (path) => statSync(path).isDirectory();
  const isIndexFile = (path) => /(^|\/)index\.(js|ts)$/.test(path);
  const pathToRoute = (path) => initial(path.split('/').pop().split('.')).join('.').replace(/^index$/, '');
  const routeBasePath = (filePath) => dirname(filePath).substr(folder.length) || '/';
  const absoluteRoute = (path) => joinPath(routeBasePath(path), pathToRoute(path));
  const shouldSkip = (path) => !basename(path).startsWith('_');

  const getListOfRoutesInFolder = (folder) => {
    const withPath = (file) => joinPath(folder, file);

    const folderEntries = map(withPath, readdirSync(folder));
    const {
      true: folders = [],
      false: filesAll = [],
    } = groupBy(isDirectory, folderEntries);
    const {
      true: index = [],
      false: files = [],
    } = groupBy(isIndexFile, filesAll);

    const routeFiles = [
      ...index,
      ...files.filter(shouldSkip).sort(),
    ];

    return [
      ...routeFiles,
      folders.map(getListOfRoutesInFolder),
    ];
  };

  const getHandler = (filePath) => {
    const router = require(filePath).default;

    if (router instanceof Router) {
      return router.expose();
    }

    return router;
  };

  const assignPathToRouter =
    (
      router,
      [
        path,
        files,
      ],
    ) => {
      if (1 < files.length) {
        throw new Error(`Duplicate routes: ${ files.join(' <~> ') }`);
      }

      const [ filePath ] = files;

      const handler = getHandler(filePath);

      router.use(path, handler);

      return router;
    };

  const createRouterFor = flow(
    getListOfRoutesInFolder,
    flattenDeep,
    groupBy(absoluteRoute),
    toPairs,
    sortBy('0'),
    reduce(assignPathToRouter)(new express.Router()),
  );

  return createRouterFor(folder);
};

export const registerRoutesInFolderJs =
  (jsFilePath) =>
    registerRoutesInFolder(
      jsFilePath
        .replace(/\.(js|ts)$/i, '')
      ,
    )
;

export const registerFolderAsRoute = (baseDir, folderName) => {
  const router = express.Router();

  router.use(folderName, registerRoutesInFolder(joinPath(baseDir, folderName)));

  return router;
};

export class Router {
  /**
   * @type {express.Router}
   */
  #router = null;

  constructor() {
    this.#router = express.Router();
  }

  /////////// REQUEST METHODS START ///////////
  all(path, ...handlers) {
    return this.addRoute('all', path, handlers);
  }

  get(path, ...handlers) {
    return this.addRoute('get', path, handlers);
  }

  getRaw(path, ...handlers) {
    return this.addRawRoute('get', path, handlers);
  }

  post(path, ...handlers) {
    return this.addRoute('post', path, handlers);
  }

  postRaw(path, ...handlers) {
    return this.addRawRoute('post', path, handlers);
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
    const exposedHandlers =
      handlers
        .map((handler) => {
          if (handler instanceof Router) {
            handler = handler.expose();
          }

          return handler;
        })
    ;

    this.#router.use(...exposedHandlers);

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
    return this.addWrappedRoute(requestMethod, path, handlersList, apiRoute);
  }

  /**
   * @param {String} requestMethod
   * @param {String} path
   * @param {Array} handlersList
   *
   * @returns {Router}
   */
  addRawRoute(requestMethod, path, handlersList) {
    return this.addWrappedRoute(requestMethod, path, handlersList, rawRoute);
  }

  /**
   * @param {String} requestMethod
   * @param {String} path
   * @param {Array} handlersList
   * @param {Function} wrapper
   *
   * @returns {Router}
   */
  addWrappedRoute(requestMethod, path, handlersList, wrapper) {
    const handler = handlersList.pop();

    this.#router[ requestMethod ](path, ...[ ...handlersList, wrapper(handler) ]);

    return this;
  }

  /**
   * @return {express.Router}
   */
  expose() {
    return this.#router;
  }
}
