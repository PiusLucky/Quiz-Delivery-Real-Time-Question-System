import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClientAck extends Document {
  clientId: string;
  ackedSeqs: number[];
  lastSeq: number;
  updatedAt: Date;
}

const ClientAckSchema = new Schema<IClientAck>(
  {
    clientId: { type: String, required: true, unique: true },
    ackedSeqs: [{ type: Number }],
    lastSeq: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ClientAck: Model<IClientAck> =
  mongoose.models.ClientAck || mongoose.model<IClientAck>("ClientAck", ClientAckSchema);
