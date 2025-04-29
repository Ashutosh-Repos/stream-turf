import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
interface Ipost {
  picture?: string;
  content: string;
  owner: Schema.Types.ObjectId;
}

const postSchema: Schema<Ipost> = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    required: [true, "userId required"],
  },
  content: {
    type: String,
    required: [true, "content required"],
  },
  picture: {
    type: String,
  },
});
postSchema.plugin(mongooseAggregatePaginate);
export const Post =
  (mongoose.models?.posts as mongoose.Model<Ipost>) ||
  mongoose.model("posts", postSchema);
