import mongoose, { Model, Schema } from "mongoose";

export interface AnalyticsVisitorDocument {
  dayKey: string;
  visitorHash: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsVisitorSchema = new Schema<AnalyticsVisitorDocument>(
  {
    dayKey: { type: String, required: true },
    visitorHash: { type: String, required: true },
    country: { type: String },
  },
  { timestamps: true, versionKey: false },
);

analyticsVisitorSchema.index({ dayKey: 1, visitorHash: 1 }, { unique: true });
analyticsVisitorSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 34_560_000 },
);
analyticsVisitorSchema.index({ dayKey: 1, country: 1 });

const AnalyticsVisitor =
  (mongoose.models.AnalyticsVisitor as
    | Model<AnalyticsVisitorDocument>
    | undefined) ??
  mongoose.model<AnalyticsVisitorDocument>(
    "AnalyticsVisitor",
    analyticsVisitorSchema,
  );

export default AnalyticsVisitor;
