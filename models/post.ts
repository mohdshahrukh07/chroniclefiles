import mongoose, { Model, Schema, Types } from "mongoose";

export type PostStatus = "draft" | "published";

export interface TiptapDocument {
  type: "doc";
  content: Record<string, unknown>[];
}

export interface PostSeo {
  metaTitle?: string;
  metaDescription?: string;
}

export type PostVideoType = "cloudinary" | "youtube";

export interface PostVideo {
  type: PostVideoType;
  url?: string;
  videoId?: string;
  title?: string;
}

export interface PostDocument {
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  content?: TiptapDocument;
  category?: Types.ObjectId;
  tags: string[];
  videos?: PostVideo[];
  status: PostStatus;
  seo?: PostSeo;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const postVideoSchema = new Schema<PostVideo>(
  {
    type: {
      type: String,
      enum: ["cloudinary", "youtube"],
      required: true,
    },
    url: {
      type: String,
      required: function (this: PostVideo) {
        return this.type === "cloudinary";
      },
    },
    videoId: {
      type: String,
      required: function (this: PostVideo) {
        return this.type === "youtube";
      },
    },
    title: {
      type: String,
    },
  },
  {
    _id: false,
  },
);

const postSchema = new Schema<PostDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: function (this: PostDocument) {
        return this.status === "published";
      },
      trim: true,
    },
    thumbnail: {
      type: String,
    },
    content: {
      type: Schema.Types.Mixed,
      required: function (this: PostDocument) {
        return this.status === "published";
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: function (this: PostDocument) {
        return this.status === "published";
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    videos: {
      type: [postVideoSchema],
      default: undefined,
      validate: {
        validator: (videos?: PostVideo[]) =>
          videos === undefined || videos.length <= 2,
        message: "A post can have no more than 2 videos.",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
    seo: {
      metaTitle: {
        type: String,
      },
      metaDescription: {
        type: String,
      },
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Post =
  (mongoose.models.Post as Model<PostDocument> | undefined) ??
  mongoose.model<PostDocument>("Post", postSchema);

export default Post;
