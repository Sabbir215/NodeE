import "dotenv/config";

export default class apiResponse {
  constructor(statusCode, message, data) {
    this.status = statusCode >= 200 && statusCode < 300 ? "OK" : "Client Error";
    this.statusCode = statusCode || 500;
    this.message = message || "Success";
    this.data = data || null;
    this.isOperational = false;
    this.stack;
    Error.captureStackTrace(this, this.constructor);
  }
  static sendSuccess(res, statusCode, message, data) {
    return res
      .status(statusCode)
      .json(new apiResponse(statusCode, message, process.env.NODE_ENV ? data : null));
  }
  static sendError(res, statusCode, message, data) {
    return res
      .status(statusCode)
      .json(new apiResponse(statusCode, message || "Something went wrong", process.env.NODE_ENV ? data : null));
  }
}
