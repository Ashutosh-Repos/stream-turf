import mongoose, { Schema } from "mongoose";

interface Ilike {
  owner: Schema.Types.ObjectId;
  video?: Schema.Types.ObjectId;
  post?: Schema.Types.ObjectId;
  comment?: Schema.Types.ObjectId;
}
const likeSchema: Schema<Ilike> = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    required: [true, "owner required"],
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "video",
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "post",
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "comment",
  },
});

export const Like =
  (mongoose.models?.likes as mongoose.Model<Ilike>) ||
  mongoose.model<Ilike>("likes", likeSchema);
