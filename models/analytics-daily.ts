import mongoose, { Model, Schema, Types } from "mongoose";
import type { AnalyticsDevice } from "@/models/page-view";

export type AnalyticsDailyScope = "site" | "page";

export interface AnalyticsDailyDocument {
  dayKey: string;
  scope: AnalyticsDailyScope;
  path: string;
  postId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  pageViews: number;
  uniqueVisitors: number;
  clicks: number;
  engagedSeconds: number;
  completedReadTimeSeconds: number;
  completedReadSessions: number;
  engagedSessions: number;
  devices: Record<AnalyticsDevice, number>;
  clickEvents: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsDailySchema = new Schema<AnalyticsDailyDocument>(
  {
    dayKey: { type: String, required: true },
    scope: { type: String, enum: ["site", "page"], required: true },
    path: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    pageViews: { type: Number, default: 0, min: 0 },
    uniqueVisitors: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    engagedSeconds: { type: Number, default: 0, min: 0 },
    completedReadTimeSeconds: { type: Number, default: 0, min: 0 },
    completedReadSessions: { type: Number, default: 0, min: 0 },
    engagedSessions: { type: Number, default: 0, min: 0 },
    devices: { type: Schema.Types.Mixed },
    clickEvents: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false },
);

analyticsDailySchema.index(
  { dayKey: 1, scope: 1, path: 1 },
  { unique: true },
);
analyticsDailySchema.index({ dayKey: 1, scope: 1, categoryId: 1 });
analyticsDailySchema.index({ dayKey: 1, scope: 1, postId: 1 });
analyticsDailySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 34_560_000 },
);

const AnalyticsDaily =
  (mongoose.models.AnalyticsDaily as
    | Model<AnalyticsDailyDocument>
    | undefined) ??
  mongoose.model<AnalyticsDailyDocument>(
    "AnalyticsDaily",
    analyticsDailySchema,
  );

export default AnalyticsDaily;
