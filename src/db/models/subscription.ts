import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
interface Isubscription {
  subscriber: Schema.Types.ObjectId;
  channel: Schema.Types.ObjectId;
}
const subscriptionSchema: Schema<Isubscription> = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    required: [true, "subcriber required"],
  },
  channel: {
    type: Schema.Types.ObjectId,
    required: [true, "channel required"],
  },
});
subscriptionSchema.plugin(mongooseAggregatePaginate);
export const Playlist =
  (mongoose.models?.subscriptions as mongoose.Model<Isubscription>) ||
  mongoose.model<Isubscription>("subscriptions", subscriptionSchema);
