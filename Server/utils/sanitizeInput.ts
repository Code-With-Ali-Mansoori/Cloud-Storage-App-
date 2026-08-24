// Different Approach

import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import CustomError from "./ErrorResponse";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

// For Objects
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  if (!obj || typeof obj !== "object") {
    throw new CustomError("Invalid request. Required parameters are missing.");
  }
  const cleanInput = Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === "string" ? purify.sanitize(value) : value,
    ])
  );
  return cleanInput;
};

// For single value
export const sanitizeInput = (value: string): string => {
  return purify.sanitize(value);
};
