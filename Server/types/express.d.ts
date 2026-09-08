import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;
      isDeleted?: boolean;
      [key: string]: unknown;
    }

    interface Request {
      user?: User | null;
      rawBody?: Buffer;
    }

    namespace Multer {
      interface File {
        ext?: string;
        storedName?: string;
      }
    }
  }
}

export {};