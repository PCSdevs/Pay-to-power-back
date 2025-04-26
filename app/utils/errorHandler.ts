/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { RequestExtended } from "../interfaces/global";
import { logger } from "./logger";
import { ErrorCodes } from "./response";
import { invalidText } from "./utils";

// Custom Error Object
export const customError = (
  error: any,
  req: RequestExtended,
  res: Response,
  next: NextFunction,
) => {
  if (req.error) {
    req.error(`error handler: :${JSON.stringify(error)}, obj: ${error}`);
  } else {
    logger.error(
      `${new Date().toISOString()} ${
        req.logId
      } error handler: :${JSON.stringify(error)}, obj: ${error}`,
    );
  }
  if (error && 404 !== error.status) {
    console.error(new Date().toISOString(), req.logId, error);
  }
  if (res.headersSent) {
    return;
  }
  if (error.message && error.message.includes("invalid input syntax")) {
    error = {
      ...ErrorCodes.BAD_REQUEST,
      errorDescription: error.message,
    };
  }
  res.status(error.status || 500);
  if (error.errorDescription) {
    error.errorDescription = error.errorDescription.trim();
    if (error.message == "Bad request.") {
      error.message = error.errorDescription.split(",")[0];
    }
  }
  if (error.message === "invalid token") {
    error.status = 401;
    error.message = "Invalid token format. Please provide a valid JWT.";
  }
  if (error.message === "jwt malformed") {
    error.status = 401;
    error.message = "Invalid token format. Please provide a valid JWT.";
  }
  if (error.name === "JsonWebTokenError") {
    error.status = 401;
    error.message = "Invalid token format. Please provide a valid JWT";
  }
  if (error.name === "TokenExpiredError") {
    error.status = 401;
    error.message = "This token has been expired.";
    // error.message = 'Your session has been timed out, please login again.';
  }
  // const err = new CustomError(
  // 	error.status,
  // 	error.message,
  // 	error.additionalInfo
  // );
  if (invalidText(error.status)) {
    error.status = 500;
  }
  logger.error(
    `Error while solving Request Method: ${req.method} Url: ${
      req.originalUrl
    } of UserId: ${req?.user?.id} failed with status code: ${
      error.status
    } message: ${JSON.stringify(error.message)} Error: ${error}`,
    error,
  );
  return res.status(error.status).json({
    error: error.status == 500 ? { description: error.message } : error,
    message: error.status == 500 ? "Something went wrong" : error.message,
    responseStatus: error.status,
  });
};

// 404 Not Found Error
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error("Path not found.");
  error.status = 404;
  error.message = "Path not found";
  // const error = new CustomError(404, `Path not found`);
  next(error);
};

class ApiException extends Error {
  status?: number;
  code?: number;
  errorDescription?: string;

  constructor({
    status,
    code,
    message,
    errorDescription,
    error,
  }: {
    status?: number;
    code?: number;
    message?: string;
    errorDescription?: string;
    error?: any;
  } = {}) {
    super(message);
    if (
      null == status &&
      null == code &&
      null == message &&
      null == errorDescription &&
      null == error
    ) {
      throw new Error("ApiException must have at least one parameter");
    }
    if (error) {
      console.error(error.toJSON ? error.toJSON() : error);
    }
    this.code = code;
    this.status = status;
    this.errorDescription = errorDescription ? errorDescription : message;
  }
}

export default ApiException;
