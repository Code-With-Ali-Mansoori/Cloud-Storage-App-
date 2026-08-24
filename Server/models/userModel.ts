import { compare, hash } from "bcrypt";
import { model, Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  password?: string;
  email: string;
  rootDirId: Types.ObjectId;
  picture: string;
  role: "SuperAdmin" | "Admin" | "Manager" | "User";
  isDeleted: boolean;
  createdWith: "email" | "google" | "github";
  canLoginWithPassword: boolean;
  maxStorageLimit: number;
  subscriptionId?: Types.ObjectId | null;
  maxFileSize: number;
  maxDevices: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      minLength: 3,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      minLength: 3,
    },
    email: {
      type: String,
      match: /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
      required: true,
      trim: true,
    },
    rootDirId: {
      type: Schema.Types.ObjectId,
      ref: "Directory",
      required: true,
    },
    picture: {
      type: String,
      required: true,
      default: function (this: any) {
        const encodedName = encodeURIComponent(this.name || "User");
        return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}`;
      },
    },
    role: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Manager", "User"],
      default: "User",
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdWith: {
      type: String,
      enum: ["email", "google", "github"],
      required: true,
    },
    canLoginWithPassword: {
      type: Boolean,
      required: true,
    },
    maxStorageLimit: {
      type: Number,
      default: 524288000, // 500 MB
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    maxFileSize: {
      type: Number,
      default: 104857600, // 100 MB
    },
    maxDevices: {
      type: Number,
      default: 1,
    }
  },
  {
    strict: "throw",
    methods: {
      comparePassword(candidatePassword: string): Promise<boolean> {
        return compare(candidatePassword, this.password || "");
      },
    },
  }
);

userSchema.pre("save", async function (this: any, next) {
  if (!this.isModified("password")) return next();
  this.password = await hash(this.password, 10);
  next();
});

const User = model<IUser>("User", userSchema);
export default User;
