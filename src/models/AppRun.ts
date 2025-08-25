import mongoose, { Schema, Document } from "mongoose";

export interface IAppRun extends Document {
  appId: mongoose.Types.ObjectId;
  question?: string;
  answer: string;
  sourceDocuments: any[];
  createdAt: Date;
}

const AppRunSchema = new Schema<IAppRun>(
  {
    appId: {
      type: Schema.Types.ObjectId,
      ref: "App",
      required: true,
    },
    question: {
      type: String,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    sourceDocuments: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Hot-reload guard
export const AppRun = mongoose.models.AppRun || mongoose.model<IAppRun>("AppRun", AppRunSchema);
