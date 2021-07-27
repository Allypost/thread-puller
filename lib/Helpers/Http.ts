import type {
  ValueOf,
} from 'type-fest';

export type StatusName = string;

export type StatusCode = number;

export type StatusDescription = string;

export type StatusCodeInfo = {
  name: StatusName;
  description: StatusDescription;
};

enum CodesInfo {
  Continue = 100,
  SwitchingProtocols = 101,
  Checkpoint = 103,
}

enum CodesSuccess {
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
}

enum CodesRedirect {
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  SwitchProxy = 306,
  TemporaryRedirect = 307,
  ResumeIncomplete = 308,
}

enum CodesClientError {
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  RequestEntityTooLarge = 413,
  RequestUriTooLong = 414,
  UnsupportedMediaType = 415,
  RequestedRangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  MisdirectedRequest = 421,
  UnprocessableEntity = 422,
  Locked = 423,
  FailedDependency = 424,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
}

enum CodesServerError {
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HttpVersionNotSupported = 505,
  NetworkAuthenticationRequired = 511,
}

const codesError = Object.freeze({
  Client: CodesClientError,
  Server: CodesServerError,
});

const nameToCode = Object.freeze({
  ...CodesInfo,
  ...CodesSuccess,
  ...CodesRedirect,
  ...CodesClientError,
  ...CodesServerError,
});

type NameToCode = typeof nameToCode;
type CodeToName = Record<ValueOf<NameToCode>, keyof NameToCode>;

const codeToName = Object.freeze(Object.fromEntries(
  Object
    .entries(nameToCode)
    .map(([ k, v ]) => [ v, k ])
  ,
)) as CodeToName;

const StatusCodeToInfo: Record<StatusCode, StatusCodeInfo> = {
  100: {
    name: 'Continue',
    description: 'The server has received the request headers, and the client should proceed to send the request body',
  },
  101: {
    name: 'Switching Protocols',
    description: 'The requester has asked the server to switch protocols',
  },
  103: {
    name: 'Checkpoint',
    description: 'Used in the resumable requests proposal to resume aborted PUT or POST requests',
  },
  200: {
    name: 'OK',
    description: 'The request is OK (this is the standard response for successful HTTP requests)',
  },
  201: {
    name: 'Created',
    description: 'The request has been fulfilled, and a new resource is created',
  },
  202: {
    name: 'Accepted',
    description: 'The request has been accepted for processing, but the processing has not been completed',
  },
  203: {
    name: 'Non-Authoritative Information',
    description: 'The request has been successfully processed, but is returning information that may be from another source',
  },
  204: {
    name: 'No Content',
    description: 'The request has been successfully processed, but is not returning any content',
  },
  205: {
    name: 'Reset Content',
    description: 'The request has been successfully processed, but is not returning any content, and requires that the requester reset the document view',
  },
  206: {
    name: 'Partial Content',
    description: 'The server is delivering only part of the resource due to a range header sent by the client',
  },
  300: {
    name: 'Multiple Choices',
    description: 'A link list. The user can select a link and go to that location. Maximum five addresses',
  },
  301: {
    name: 'Moved Permanently',
    description: 'The requested page has moved to a new URL',
  },
  302: {
    name: 'Found',
    description: 'The requested page has moved temporarily to a new URL',
  },
  303: {
    name: 'See Other',
    description: 'The requested page can be found under a different URL',
  },
  304: {
    name: 'Not Modified',
    description: 'Indicates the requested page has not been modified since last requested',
  },
  306: {
    name: 'Switch Proxy',
    description: '-- No longer used --',
  },
  307: {
    name: 'Temporary Redirect',
    description: 'The requested page has moved temporarily to a new URL',
  },
  308: {
    name: 'Resume Incomplete',
    description: 'Used in the resumable requests proposal to resume aborted PUT or POST requests',
  },
  400: {
    name: 'Bad Request',
    description: 'The request cannot be fulfilled due to bad syntax',
  },
  401: {
    name: 'Unauthorized',
    description: 'The request was a legal request, but the server is refusing to respond to it. For use when authentication is possible but has failed or not yet been provided',
  },
  402: {
    name: 'Payment Required',
    description: '-- Reserved for future use --',
  },
  403: {
    name: 'Forbidden',
    description: 'The request was a legal request, but the server is refusing to respond to it',
  },
  404: {
    name: 'Not Found',
    description: 'The requested page could not be found but may be available again in the future',
  },
  405: {
    name: 'Method Not Allowed',
    description: 'A request was made of a page using a request method not supported by that page',
  },
  406: {
    name: 'Not Acceptable',
    description: 'The server can only generate a response that is not accepted by the client',
  },
  407: {
    name: 'Proxy Authentication Required',
    description: 'The client must first authenticate itself with the proxy',
  },
  408: {
    name: 'Request Timeout',
    description: 'The server timed out waiting for the request',
  },
  409: {
    name: 'Conflict',
    description: 'The request could not be completed because of a conflict in the request',
  },
  410: {
    name: 'Gone',
    description: 'The requested page is no longer available',
  },
  411: {
    name: 'Length Required',
    description: 'The "Content-Length" is not defined. The server will not accept the request without it',
  },
  412: {
    name: 'Precondition Failed',
    description: 'The precondition given in the request evaluated to false by the server',
  },
  413: {
    name: 'Request Entity Too Large',
    description: 'The server will not accept the request, because the request entity is too large',
  },
  414: {
    name: 'Request-URI Too Long',
    description: 'The server will not accept the request, because the URL is too long. Occurs when you convert a POST request to a GET request with a long query information',
  },
  415: {
    name: 'Unsupported Media Type',
    description: 'The server will not accept the request, because the media type is not supported',
  },
  416: {
    name: 'Requested Range Not Satisfiable',
    description: 'The client has asked for a portion of the file, but the server cannot supply that portion',
  },
  417: {
    name: 'Expectation Failed',
    description: 'The server cannot meet the requirements of the Expect request-header field',
  },
  418: {
    name: 'I\'m a teapot',
    description: 'Any attempt to brew coffee with a teapot should result in the error code "418 I\'m a teapot". The resulting entity body MAY be short and stout',
  },
  421: {
    name: 'Misdirected Request',
    description: 'The request was directed at a server that is not able to produce a response (for example because a connection reuse)',
  },
  422: {
    name: 'Unprocessable Entity',
    description: 'The request was well-formed but was unable to be followed due to semantic errors',
  },
  423: {
    name: 'Locked',
    description: 'The resource that is being accessed is locked',
  },
  424: {
    name: 'Failed Dependency',
    description: 'The request failed due to failure of a previous request (e.g., a PROPPATCH)',
  },
  426: {
    name: 'Upgrade Required',
    description: 'The client should switch to a different protocol such as TLS/1.0, given in the Upgrade header field',
  },
  428: {
    name: 'Precondition Required',
    description: 'The origin server requires the request to be conditional',
  },
  429: {
    name: 'Too Many Requests',
    description: 'The user has sent too many requests in a given amount of time. Intended for use with rate limiting schemes',
  },
  431: {
    name: 'Request Header Fields Too Large',
    description: 'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large',
  },
  451: {
    name: 'Unavailable For Legal Reasons',
    description: 'A server operator has received a legal demand to deny access to a resource or to a set of resources that includes the requested resource',
  },
  500: {
    name: 'Internal Server Error',
    description: 'An error has occured in a server side script, a no more specific message is suitable',
  },
  501: {
    name: 'Not Implemented',
    description: 'The server either does not recognize the request method, or it lacks the ability to fulfill the request',
  },
  502: {
    name: 'Bad Gateway',
    description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server',
  },
  503: {
    name: 'Service Unavailable',
    description: 'The server is currently unavailable (overloaded or down)',
  },
  504: {
    name: 'Gateway Timeout',
    description: 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server',
  },
  505: {
    name: 'HTTP Version Not Supported',
    description: 'The server does not support the HTTP protocol version used in the request',
  },
  511: {
    name: 'Network Authentication Required',
    description: 'The client needs to authenticate to gain network access',
  },
};

export class HttpStatus {
  static get Info(): typeof CodesInfo {
    return CodesInfo;
  }

  static get Success(): typeof CodesSuccess {
    return CodesSuccess;
  }

  static get Redirect(): typeof CodesRedirect {
    return CodesRedirect;
  }

  static get Error(): Readonly<{ Server: typeof CodesServerError; Client: typeof CodesClientError }> {
    return codesError;
  }

  static codeToName(code: StatusCode): ValueOf<CodeToName> {
    return codeToName[ code ];
  }

  static codeToInfo(code: StatusCode): StatusCodeInfo {
    return StatusCodeToInfo[ code ];
  }
}
