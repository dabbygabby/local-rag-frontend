import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { AppRun } from "@/models/AppRun";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid app ID" });
  }

  if (req.method === "GET") {
    try {
      const { page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [runs, total] = await Promise.all([
        AppRun.find({ appId: id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        AppRun.countDocuments({ appId: id }),
      ]);

      res.status(200).json({
        runs: runs.map(run => ({
          ...run,
          _id: run._id.toString(),
        })),
        total,
      });
    } catch (error) {
      console.error("Error fetching app runs:", error);
      res.status(500).json({ error: "Failed to fetch app runs" });
    }
  } else if (req.method === "POST") {
    try {
      // Optional endpoint to manually record a run
      const { question, answer, sourceDocuments } = req.body;

      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      const appRun = new AppRun({
        appId: id,
        question,
        answer,
        sourceDocuments: sourceDocuments || [],
      });

      const savedAppRun = await appRun.save();

      res.status(201).json({
        ...savedAppRun.toObject(),
        _id: savedAppRun._id.toString(),
        appId: savedAppRun.appId.toString(),
      });
    } catch (error) {
      console.error("Error creating app run:", error);
      res.status(500).json({ error: "Failed to create app run" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
