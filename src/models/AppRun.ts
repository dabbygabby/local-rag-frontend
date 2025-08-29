/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document } from "mongoose";

export interface IAppRun extends Document {
  appId: string;
  question?: string;
  answer: string;
  sourceDocuments: any[];
  createdAt: Date;
}

const AppRunSchema = new Schema<IAppRun>(
  {
    appId: {
      type: String,
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
    //@ts-expect-error - sourceDocuments is a mixed type
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
