import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "viewer" | "admin";
export type UserState = "TO_APPROVE" | "APPROVED";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  state: UserState;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["viewer", "admin"], default: "viewer" },
    state: { type: String, enum: ["TO_APPROVE", "APPROVED"], default: "TO_APPROVE" },
  },
  { timestamps: true, versionKey: false, collection: "k9_users" }
);

export default mongoose.model<IUser>("User", UserSchema);
