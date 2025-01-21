import mongoose, { Schema } from "mongoose";

interface UserDoc {
  email: string;
  name: string;
  role: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    password: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("user", UserSchema);
