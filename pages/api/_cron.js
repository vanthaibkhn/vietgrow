// pages/api/_cron.js
// ✅ Cloudflare Cron trigger để tạo topics hằng tuần

import { topicService } from "@/services/topicService.js";

export default async function handler(req, res) {
  try {
    const topics = await topicService.buildWeeklyTopics();
    return res.status(200).json({
      message: "Cron executed successfully",
      created: topics.length,
    });
  } catch (err) {
    console.error("[_cron] 💥 Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

