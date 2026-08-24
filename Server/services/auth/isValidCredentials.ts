import { StatusCodes } from "http-status-codes";
import User from "../../models/userModel";
import CustomError from "../../utils/ErrorResponse";

export const isValidCredentials = async (email: string, password: string): Promise<any> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError(
      "Invalid email or password",
      StatusCodes.UNAUTHORIZED
    );
  }

  if (!(await user.comparePassword(password))) {
    throw new CustomError(
      "Invalid email or password",
      StatusCodes.UNAUTHORIZED
    );
  }

  return user;
};
