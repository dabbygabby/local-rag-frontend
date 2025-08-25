import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { App } from "@/models/App";
import { CreateAppRequest } from "@/types/app";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { page = "1", limit = "10" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [apps, total] = await Promise.all([
        App.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        App.countDocuments({}),
      ]);

      res.status(200).json({
        apps: apps.map(app => ({
          ...app,
          _id: app._id.toString(),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error("Error fetching apps:", error);
      res.status(500).json({ error: "Failed to fetch apps" });
    }
  } else if (req.method === "POST") {
    try {
      const appData: CreateAppRequest = req.body;

      // Validate required fields
      if (!appData.name || !appData.knowledgeBaseId) {
        return res.status(400).json({
          error: "Name and knowledgeBaseId are required",
        });
      }

      const app = new App(appData);
      const savedApp = await app.save();

      res.status(201).json({
        ...savedApp.toObject(),
        _id: savedApp._id.toString(),
        knowledgeBaseId: savedApp.knowledgeBaseId.toString(),
      });
    } catch (error) {
      console.error("Error creating app:", error);
      res.status(500).json({ error: "Failed to create app" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
