import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
interface Icomment {
  content: string;
  owner: Schema.Types.ObjectId;
  video?: Schema.Types.ObjectId;
  post?: Schema.Types.ObjectId;
}
const commentSchema: Schema<Icomment> = new Schema({
  content: {
    type: String,
    required: [true, "comment required"],
  },
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
});
commentSchema.plugin(mongooseAggregatePaginate);
export const Comment =
  (mongoose.models?.comments as mongoose.Model<Icomment>) ||
  mongoose.model<Icomment>("comments", commentSchema);
