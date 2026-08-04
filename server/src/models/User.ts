// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "viewer" | "admin";
export type InstructorLevel = "BSS" | "CTS";

export interface IUser extends Document {
  email: string;
  username?: string;
  role?: UserRole;
  instructorLevel?: InstructorLevel;
  acceptTerms: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, trim: true },
    role: { type: String, enum: ["viewer", "admin"] },
    instructorLevel: { type: String, enum: ["BSS", "CTS"] },
    acceptTerms: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, collection: "k9_users" }
);

// Chiave di identità dell'utente: email+username insieme (entrambi presenti
// nel JWT emesso dal sito esterno).
UserSchema.index({ email: 1, username: 1 }, { unique: true });

export default mongoose.model<IUser>("User", UserSchema);
