// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "viewer" | "admin";
export type UserState = "TO_APPROVE" | "APPROVED" | "TOKEN_ACCESS";

export interface IUser extends Document {
  email: string;
  username?: string;
  passwordHash?: string;
  role: UserRole;
  state: UserState;
  firstName?: string;
  lastName?: string;
  lastNotifiedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["viewer", "admin"], default: "viewer" },
    state: { type: String, enum: ["TO_APPROVE", "APPROVED", "TOKEN_ACCESS"], default: "TO_APPROVE" },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true, versionKey: false, collection: "k9_users" }
);

// Chiave di identità per gli utenti in modalità token: email+username insieme.
// Gli utenti form (senza username) restano protetti dall'indice unique su email.
UserSchema.index({ email: 1, username: 1 }, { unique: true });

export default mongoose.model<IUser>("User", UserSchema);
