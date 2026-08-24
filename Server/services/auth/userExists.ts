import { StatusCodes } from "http-status-codes";
import User from "../../models/userModel";
import CustomError from "../../utils/ErrorResponse";

export const userExists = async (email: string): Promise<void> => {
  const userFound = await User.findOne({ email }).lean();
  if (userFound) {
    throw new CustomError("User already eixst", StatusCodes.CONFLICT);
  }
};
