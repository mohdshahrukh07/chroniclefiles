import mongoose, { Model, Schema, Types } from "mongoose";

export type AnalyticsDevice = "desktop" | "mobile" | "tablet" | "unknown";

export interface PageViewDocument {
  eventId: string;
  dayKey: string;
  path: string;
  postId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  engaged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pageViewSchema = new Schema<PageViewDocument>(
  {
    eventId: { type: String, required: true, unique: true },
    dayKey: { type: String, required: true },
    path: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    engaged: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, versionKey: false },
);

pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 34_560_000 });
pageViewSchema.index({ dayKey: 1, postId: 1, categoryId: 1 });
pageViewSchema.index({ createdAt: -1 });

const PageView =
  (mongoose.models.PageView as Model<PageViewDocument> | undefined) ??
  mongoose.model<PageViewDocument>("PageView", pageViewSchema);

export default PageView;
