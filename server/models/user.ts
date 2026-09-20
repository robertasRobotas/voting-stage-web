import mongoose, { type Document, type Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, index: true },
    displayName: String,
    photoUrl: String,
  },
  { timestamps: true },
);

// `mongoose.models.X ??` — dev hot reload re-evaluates this module, and
// registering the same model twice throws OverwriteModelError.
export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);
