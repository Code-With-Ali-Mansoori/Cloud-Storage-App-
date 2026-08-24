
export default class CustomSuccess {
  success: true;
  message: string;
  statusCode: number;
  timestamp: string;
  data?: unknown;

  constructor(message: string, statusCode = 200, data: unknown = null) {
    this.success = true;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    if (data) this.data = data;
  }

  static send(res: { status: (statusCode: number) => { json: (body: CustomSuccess) => unknown } }, message: string, statusCode = 200, data: unknown = null) {
    const response = new CustomSuccess(message, statusCode, data);
    return res.status(statusCode).json(response);
  }
}
