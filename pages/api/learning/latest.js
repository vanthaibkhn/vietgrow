// pages/api/learning/latest.js
import { db } from "@/lib/firebase.js";
import fs from "fs/promises";
import path from "path";

const SUMMARY_FILE = path.join(process.cwd(), "data/learning_summaries.json");

export default async function handler(req, res) {
  try {
    let summary = null;
    if (db) {
      const snap = await db
        .collection("learning_summaries")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      summary = snap.docs[0]?.data()?.summary || null;
    }

    if (!summary) {
      const lines = (await fs.readFile(SUMMARY_FILE, "utf-8").catch(() => ""))
        .trim()
        .split("\n");
      const last = lines.pop();
      summary = last ? JSON.parse(last).summary : null;
    }

    res.status(200).json({ summary });
  } catch (err) {
    console.error("[learning/latest] 💥", err.message);
    res.status(500).json({ error: "Không thể tải bản tóm tắt tuần." });
  }
}

