/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import ApiException from "./errorHandler";
import { BaseResponse, ErrorCodes } from "./response";

const asyncHandler =
  (
    callback: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  ) =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const errors = validationResult(req);
    console.log("Error: ", errors);

    try {
      if (!errors.isEmpty()) {
        throw new ApiException({
          ...ErrorCodes.BAD_REQUEST,
          errorDescription: errors
            .array()
            .map((e: any) => `${e.msg}`)
            // .map((e: any) => `'${e.path}' ${e.msg}`)
            // .map((e: any) => `'${e.value}' ${e.msg}`)
            .join(", "),
        });
      }
      const result = await callback(req, res, next);
      if (!res.headersSent) {
        res.send(BaseResponse(result));
      }
      return result;
    } catch (error) {
      next(error);
    }
  };

export default asyncHandler;
