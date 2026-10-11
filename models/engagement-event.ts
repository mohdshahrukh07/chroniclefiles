import mongoose, { Model, Schema, Types } from "mongoose";

export interface EngagementEventDocument {
  eventId: string;
  pageViewId: string;
  dayKey: string;
  path: string;
  postId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  activeSeconds: number;
  sessionSeconds: number;
  clickNames: string[];
  isFinal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const engagementEventSchema = new Schema<EngagementEventDocument>(
  {
    eventId: { type: String, required: true, unique: true },
    pageViewId: { type: String, required: true },
    dayKey: { type: String, required: true },
    path: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    activeSeconds: { type: Number, required: true, min: 0, max: 3600 },
    sessionSeconds: { type: Number, required: true, min: 0, max: 3600 },
    clickNames: { type: [String], default: [] },
    isFinal: { type: Boolean, required: true },
  },
  { timestamps: true, versionKey: false },
);

engagementEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 34_560_000 },
);
engagementEventSchema.index({ dayKey: 1, postId: 1 });

const EngagementEvent =
  (mongoose.models.EngagementEvent as Model<EngagementEventDocument> | undefined) ??
  mongoose.model<EngagementEventDocument>(
    "EngagementEvent",
    engagementEventSchema,
  );

export default EngagementEvent;
