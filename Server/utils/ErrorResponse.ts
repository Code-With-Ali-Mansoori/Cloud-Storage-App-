
export default class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;
  timestamp: string;
  code?: string;
  details?: unknown;
  log?: boolean;

  constructor(message: string, statusCode = 500, extra: { code?: string; details?: unknown; log?: boolean } = {}) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    if (extra.code) this.code = extra.code;
    if (extra.details) this.details = extra.details;
    if (extra.log) this.log = extra.log;
  }
}
