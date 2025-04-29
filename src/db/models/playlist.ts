import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface Iplaylist {
  title: string;
  owner: Schema.Types.ObjectId;
  description: string;
  videos?: Schema.Types.ObjectId[];
  public: boolean;
}
const playlistSchema: Schema<Iplaylist> = new Schema(
  {
    title: {
      type: String,
      required: [true, "playlist title is required"],
    },
    description: {
      type: String,
      required: [true, "playlist description is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: [true, "playlist must have a owner"],
    },
    public: {
      type: Boolean,
      default: false,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "video",
      },
    ],
  },
  { timestamps: true }
);
playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist =
  (mongoose.models?.playlists as mongoose.Model<Iplaylist>) ||
  mongoose.model<Iplaylist>("playlists", playlistSchema);
