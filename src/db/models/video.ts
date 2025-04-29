import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface Ivideo extends Document {
  _id: Schema.Types.ObjectId;
  owner: Schema.Types.ObjectId;
  video: string;
  thumbnail: string;
  title: string;
  description: string;
  public?: boolean;
  createdAt?: Date;
  views?: number;
  likes?: number;
  live?: boolean;
  age_restriction?: boolean;
}

const VideoSchema: Schema<Ivideo> = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    age_restriction: {
      type: Boolean,
      default: false,
    },
    public: {
      type: Boolean,
      default: false,
    },
    live: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
VideoSchema.plugin(mongooseAggregatePaginate);

export const Video =
  (mongoose.models?.videos as mongoose.Model<Ivideo>) ||
  mongoose.model<Ivideo>("videos", VideoSchema);
