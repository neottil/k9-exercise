import mongoose, { Schema } from "mongoose";

const ExerciseChangeSchema = new Schema(
  {
    exerciseId: { type: String, required: true, index: true },
    fields: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("ExerciseChange", ExerciseChangeSchema);
