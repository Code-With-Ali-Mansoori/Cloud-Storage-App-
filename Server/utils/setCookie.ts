import { Response } from "express";

export const setCookie = (res: Response, sessionID: string, sessionExpiry: number): void => {
  res.cookie("token", sessionID, {
    httpOnly: true,
    signed: true,
    maxAge: sessionExpiry,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" ? true : false,
  });
};
