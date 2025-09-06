import 'dotenv/config'

export default class CustomError extends Error {
  constructor(statusCode, message, data=null) {
    super(message);
    this.message = message;
    this.status =
      statusCode >= 400 && statusCode < 500 ? "Client Error" : "Server Error";
    this.statusCode = statusCode;
    this.isOperational = false;
    this.data = data;
    this.stack;
    Error.captureStackTrace(this, this.constructor);
  }
}


