import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import mongoose, { Model, Schema } from "mongoose";

const PASSWORD_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });
}

export type UserRole = "admin" | "editor";

export interface UserDocument {
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

interface UserModel extends Model<UserDocument> {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, UserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "editor"],
      required: true,
      default: "editor",
    },
  },
  { timestamps: true },
);

userSchema.statics.hashPassword = async function (
  password: string,
): Promise<string> {
  if (!password) {
    throw new Error("Password cannot be empty.");
  }

  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);

  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
};

userSchema.statics.verifyPassword = async function (
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const [algorithm, saltValue, keyValue, extraValue] = passwordHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !saltValue ||
    !keyValue ||
    extraValue !== undefined ||
    !/^[A-Za-z0-9_-]+$/.test(saltValue) ||
    !/^[A-Za-z0-9_-]+$/.test(keyValue)
  ) {
    return false;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const expectedKey = Buffer.from(keyValue, "base64url");
  if (salt.length !== SALT_LENGTH || expectedKey.length !== PASSWORD_KEY_LENGTH) {
    return false;
  }

  const actualKey = await deriveKey(password, salt);

  return timingSafeEqual(actualKey, expectedKey);
};

const User =
  (mongoose.models.User as UserModel | undefined) ??
  mongoose.model<UserDocument, UserModel>("User", userSchema);

export default User;
