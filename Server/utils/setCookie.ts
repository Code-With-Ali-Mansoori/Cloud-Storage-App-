import { Response } from "express";

export const setCookie = (res: Response, sessionID: string, sessionExpiry: number): void => {
  const hasCookieSecret = Boolean(process.env.COOKIE_SECRET);

  res.cookie("token", sessionID, {
    httpOnly: true,
    signed: hasCookieSecret,
    maxAge: sessionExpiry,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" ? true : false,
  });
};
