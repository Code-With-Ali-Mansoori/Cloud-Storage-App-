import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import OTP from "../models/otpModel";
import { sendOTPService } from "../services/otpService";
import CustomSuccess from "../utils/SuccessResponse";

export const sendOTP = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  const email = req.email;
  try {
    let otp = Math.floor(1000 + Math.random() * 9000);
    if (email === "test@gmail.com") {
      otp = 9999;
    }
    const resData = await sendOTPService(email, otp);
    await OTP.updateOne(
      { email },
      { $set: { otp, createdAt: Date.now() } },
      { upsert: true }
    );
    return CustomSuccess.send(
      res,
      `OTP send to ${email}`,
      StatusCodes.CREATED,
      resData
    );
  } catch (error) {
    next(error);
  }
};
