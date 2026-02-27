import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  seq: number;
  text: string;
  options?: string[];
  correctAnswer?: string;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    seq: { type: Number, required: true, unique: true },
    text: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
