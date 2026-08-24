import { StatusCodes } from "http-status-codes";
import { ZodSchema } from "zod";
import CustomError from "./ErrorResponse";

export const validateInputs = <T = any>(
  schema: any,
  data: unknown,
  errMessage = "Invalid data, Please enter valid details."
): T => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new CustomError(errMessage, StatusCodes.BAD_REQUEST, {
      details: parsed.error
    });
  }

  return parsed.data;
};
