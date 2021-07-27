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
import type {
  LastArrayElement,
} from 'type-fest';
import {
  HttpStatus,
} from '../../lib/Helpers/Http';
import type {
  StatusCodeInfo,
  StatusCode,
} from '../../lib/Helpers/Http';

type ApiResponse = {
  error: boolean;
  status: StatusCode;
  ts: number;
};

type SuccessResponse = {
  data: unknown;
} & ApiResponse;

type ErrorResponse = {
  reason: string;
  errorData: unknown;
  statusInfo: StatusCodeInfo;
  _errorObject?: unknown;
} & ApiResponse;

export const response =
  (
    {
      error,
      status,
    }: {
      error: boolean;
      status: StatusCode;
    },
  ): ApiResponse =>
    ({
      error,
      status,
      ts: Date.now(),
    })
;

export const success =
  (data: unknown): SuccessResponse =>
    ({
      ...response({
        error: false,
        status: HttpStatus.Success.Ok,
      }),
      data,
    })
;

export const error =
  (
    {
      reason,
      status = HttpStatus.Error.Client.Forbidden,
      data = null,
    }: {
      reason: string;
      status: StatusCode;
      data: unknown;
    },
  ): ErrorResponse =>
    ({
      ...response({
        error: true,
        status,
      }),
      statusInfo: HttpStatus.codeToInfo(status),
      reason,
      errorData: data,
    })
;

export class ApiError extends Error {
  public readonly statusCode: StatusCode = HttpStatus.Error.Client.ImATeapot;

  public readonly data: unknown = null;

  constructor(message: string, statusCode: StatusCode = HttpStatus.Error.Client.ImATeapot, data: unknown = null) {
    super(message);
    this.statusCode = statusCode || HttpStatus.Error.Client.ImATeapot;
    this.data = data;
  }
}

type RequestHandlerFn =
  ((req: express.Request, res: express.Response, next: express.NextFunction) => unknown)
  ;

export const asyncWrapper =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Fn extends ((...args: any[]) => Promise<any>)>(fn: Fn) =>
    (...args: Parameters<Fn>): Promise<ReturnType<Fn>> =>
      Promise
        .resolve(fn(...args) as ReturnType<Fn>)
        .catch(args.pop())
;

export const rawRoute =
  (fn: RequestHandlerFn) =>
    asyncWrapper(
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
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
      }
      ,
    )
;

export const apiRoute =
  (fn: RequestHandlerFn) =>
    asyncWrapper(
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
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
      }
      ,
    )
;

export const registerRoutesInFolder = (folder: string) => {
  const router = express.Router();

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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
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

export const registerRoutesInFolderRecursive = (...folderParts: string[]) => {
  const folder = joinPath(...folderParts);

  const isDirectory = (path: string) => statSync(path).isDirectory();
  const isIndexFile = (path: string) => /(^|\/)index\.(js|ts)$/.test(path);
  const pathToRoute = (path: string) => initial(path.split('/').pop()?.split('.')).join('.').replace(/^index$/, '');
  const routeBasePath = (filePath: string) => dirname(filePath).substr(folder.length) || '/';
  const absoluteRoute = (path: string) => joinPath(routeBasePath(path), pathToRoute(path));
  const shouldSkip = (path: string) => !basename(path).startsWith('_');

  const getListOfRoutesInFolder = (folder: string): string[] => {
    const withPath = (file: string) => joinPath(folder, file);

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
      ...flattenDeep<string>(folders.map(getListOfRoutesInFolder)),
    ];
  };

  const getHandler = (filePath: string): express.Router => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const router = require(filePath).default;

    if (router instanceof Router) {
      return router.expose();
    }

    return router;
  };

  const assignPathToRouter =
    (
      router: express.Router,
      [
        path,
        files,
      ]: [
        string,
        string[]
      ],
    ): express.Router => {
      if (1 < files.length) {
        throw new Error(`Duplicate routes: ${ files.join(' <~> ') }`);
      }

      const [ filePath ] = files;

      const handler = getHandler(filePath);

      router.use(path, handler);

      return router;
    };

  const createRouterFor: (folder: string) => express.Router =
    flow(
      getListOfRoutesInFolder,
      groupBy(absoluteRoute),
      toPairs,
      sortBy<string>('0'),
      reduce(assignPathToRouter)(express.Router()),
    )
  ;

  return createRouterFor(folder);
};

export const registerRoutesInFolderJs =
  (jsFilePath: string): express.Router =>
    registerRoutesInFolder(
      jsFilePath
        .replace(/\.(js|ts)$/i, '')
      ,
    )
;

export const registerFolderAsRoute = (baseDir: string, folderName: string): express.Router => {
  const router = express.Router();

  router.use(folderName, registerRoutesInFolder(joinPath(baseDir, folderName)));

  return router;
};

type RequestMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
type HandlersList = RequestHandlerFn[];

export class Router {
  private readonly router: express.Router;

  constructor() {
    this.router = express.Router();
  }

  /////////// REQUEST METHODS START ///////////
  all(path: string, ...handlers: HandlersList) {
    return this.addRoute('all', path, handlers);
  }

  get(path: string, ...handlers: HandlersList) {
    return this.addRoute('get', path, handlers);
  }

  getRaw(path: string, ...handlers: HandlersList) {
    return this.addRawRoute('get', path, handlers);
  }

  post(path: string, ...handlers: HandlersList) {
    return this.addRoute('post', path, handlers);
  }

  postRaw(path: string, ...handlers: HandlersList) {
    return this.addRawRoute('post', path, handlers);
  }

  put(path: string, ...handlers: HandlersList) {
    return this.addRoute('put', path, handlers);
  }

  delete(path: string, ...handlers: HandlersList) {
    return this.addRoute('delete', path, handlers);
  }

  patch(path: string, ...handlers: HandlersList) {
    return this.addRoute('patch', path, handlers);
  }

  options(path: string, ...handlers: HandlersList) {
    return this.addRoute('options', path, handlers);
  }

  head(path: string, ...handlers: HandlersList) {
    return this.addRoute('head', path, handlers);
  }

  /////////// REQUEST METHODS END ///////////

  use(...handlers: (LastArrayElement<HandlersList> | Router)[]) {
    const exposedHandlers =
      handlers
        .map((handler) => {
          if (handler instanceof Router) {
            handler = handler.expose() as LastArrayElement<HandlersList>;
          }

          return handler as LastArrayElement<HandlersList>;
        })
    ;

    this.router.use(...exposedHandlers);

    return this;
  }

  addRoute(requestMethod: RequestMethod, path: string, handlersList: HandlersList): this {
    return this.addWrappedRoute(requestMethod, path, handlersList, apiRoute);
  }

  addRawRoute(requestMethod: RequestMethod, path: string, handlersList: HandlersList): this {
    return this.addWrappedRoute(requestMethod, path, handlersList, rawRoute);
  }

  addWrappedRoute(
    requestMethod: RequestMethod,
    path: string,
    handlersList: HandlersList,
    wrapper: ((fn: RequestHandlerFn) => RequestHandlerFn),
  ): this {
    const handler = handlersList.pop() as LastArrayElement<HandlersList>;

    this.router[ requestMethod ](path, ...[ ...handlersList, wrapper(handler) ]);

    return this;
  }

  expose(): express.Router {
    return this.router;
  }
}
