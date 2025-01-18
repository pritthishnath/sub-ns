import mongoose, { Schema } from "mongoose";

export interface UserDoc {
  email: string;
  subdomains: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true },
    subdomains: [{ type: String, index: true }],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("user", UserSchema);
