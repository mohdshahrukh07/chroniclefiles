import mongoose, { Model, Schema, Types } from "mongoose";

export interface MediaDocument {
  filename: string;
  url: string;
  alt?: string;
  mimeType: string;
  size: number;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<MediaDocument>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Media =
  (mongoose.models.Media as Model<MediaDocument> | undefined) ??
  mongoose.model<MediaDocument>("Media", mediaSchema);

export default Media;
