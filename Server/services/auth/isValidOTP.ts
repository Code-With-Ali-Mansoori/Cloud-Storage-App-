import { StatusCodes } from "http-status-codes";
import OTP from "../../models/otpModel";
import CustomError from "../../utils/ErrorResponse";

export const isValidOTP = async (email: string, otp: number | string): Promise<void> => {
  const isValid = await OTP.findOne({ email, otp }).lean();
  if (!isValid) {
    throw new CustomError("Invalid or Expired OTP.", StatusCodes.BAD_REQUEST);
  }
  await OTP.deleteOne({ email });
};
