import mongoose, { Model, Schema, Types } from "mongoose";

export interface HomepageLayoutDocument {
  key: "primary";
  leftTopPostId: Types.ObjectId | null;
  leftBottomPostId: Types.ObjectId | null;
  editorsPickPostId: Types.ObjectId | null;
  rightTopPostId: Types.ObjectId | null;
  rightBottomPostId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const homepageLayoutSchema = new Schema<HomepageLayoutDocument>(
  {
    key: {
      type: String,
      enum: ["primary"],
      default: "primary",
      required: true,
      unique: true,
    },
    leftTopPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    leftBottomPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    editorsPickPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    rightTopPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    rightBottomPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

const HomepageLayout =
  (mongoose.models.HomepageLayout as
    | Model<HomepageLayoutDocument>
    | undefined) ??
  mongoose.model<HomepageLayoutDocument>(
    "HomepageLayout",
    homepageLayoutSchema,
  );

export default HomepageLayout;
