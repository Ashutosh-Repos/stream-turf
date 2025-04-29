import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt-edge";

// Constants for validation patterns
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// Interface for watchHistory
type WatchHistory = {
  video: Schema.Types.ObjectId;
  date: Date; // Changed from 'Date' to 'date' for naming consistency
};

// Interface for the User document
export interface Iuser extends Document {
  _id: Schema.Types.ObjectId;
  email: string;
  username?: string;
  fullname: string;
  password: string;
  gender: "M" | "F" | "O";
  age: number;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  cover?: string;
  watchHistory: WatchHistory[]; // Updated to use WatchHistory type
  verifyCode?: string;
  forgotCode?: string;
  verified: boolean;
}

// User schema definition
const UserSchema: Schema<Iuser> = new Schema(
  {
    fullname: {
      type: String,
      required: [true, "Fullname is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [EMAIL_REGEX, "Invalid email format"],
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        USERNAME_REGEX,
        "Invalid username (alphanumeric and underscores only)",
      ],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [13, "Age must be at least 13"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["M", "F", "O"],
        message: "Gender must be M, F, or O",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    verifyCode: {
      type: String,
    },
    forgotCode: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    cover: {
      type: String,
    },
    watchHistory: [
      {
        video: {
          type: Schema.Types.ObjectId,
          ref: "Video",
          required: true,
        },
        date: {
          type: Date,
          required: true,
          default: Date.now, // Optional: Set default to current date
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Define indexes for performance
// UserSchema.index({ email: 1 }, { unique: true });
// UserSchema.index({ username: 1 }, { unique: true, sparse: true });

// Password hashing function
async function hashPassword(password: string): Promise<string> {
  try {
    return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
  } catch (error) {
    throw new Error(`Password hashing failed: ${(error as Error).message}`);
  }
}

// Pre-save hook for password hashing
UserSchema.pre("save", async function (this: Iuser, next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Export the model
export const userModel: Model<Iuser> =
  mongoose.models?.users || mongoose.model<Iuser>("users", UserSchema);
