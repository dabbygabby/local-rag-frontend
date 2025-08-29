import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { App } from "@/models/App";
import { UpdateAppRequest } from "@/types/app";

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
      const app = await App.findById(id).lean();

      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }

              res.status(200).json({
          ...app,
          //@ts-expect-error - app is a type
          _id: app._id.toString(),
        });
    } catch (error) {
      console.error("Error fetching app:", error);
      res.status(500).json({ error: "Failed to fetch app" });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData: UpdateAppRequest = req.body;

      const updatedApp = await App.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedApp) {
        return res.status(404).json({ error: "App not found" });
      }

              res.status(200).json({
          ...updatedApp,
          //@ts-expect-error - updatedApp is a type
          _id: updatedApp._id.toString(),
        });
    } catch (error) {
      console.error("Error updating app:", error);
      res.status(500).json({ error: "Failed to update app" });
    }
  } else if (req.method === "DELETE") {
    try {
      const deletedApp = await App.findByIdAndDelete(id);

      if (!deletedApp) {
        return res.status(404).json({ error: "App not found" });
      }

      res.status(200).json({ message: "App deleted successfully" });
    } catch (error) {
      console.error("Error deleting app:", error);
      res.status(500).json({ error: "Failed to delete app" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
