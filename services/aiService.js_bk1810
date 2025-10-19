// services/aiService.js
// ✅ Phiên bản chính thức: xử lý song song Q&A + embedding + lưu trữ song song
// Đã tích hợp tối ưu hóa hiệu năng và rate-limit service

import { rateLimitService } from "./rateLimitService.js";
import { vectorService } from "./vectorService.js";
import { dbService } from "./dbService.js";
import { feedbackService } from "./feedbackService.js";
import { openai } from "../lib/openai.js";

// Khởi tạo rateLimitService cache khi module được load (1 lần duy nhất)
(async () => {
  try {
    console.log("[aiService] ⚙️ Khởi tạo rateLimitService...");
    await rateLimitService.init();
    console.log("[aiService] ✅ rateLimitService cache initialized thành công");
  } catch (err) {
    console.error("[aiService] 💥 Lỗi khi khởi tạo rateLimitService:", err?.message || err);
  }
})();

export const aiService = {
  async processQuestion({ question, userIp, uid = null }) {
    const normalized = question?.trim()?.toLowerCase();
    if (!normalized) throw new Error("Câu hỏi trống hoặc không hợp lệ.");

    console.log(`\n[aiService] 🚀 Bắt đầu xử lý câu hỏi từ IP: ${userIp} | uid: ${uid}`);
    console.log(`[aiService] Nội dung: "${normalized}"`);

    console.time('[aiService] total_time');

    try {
      // 1️⃣ Giới hạn (dùng wrapper check — mặc định xử lý IP)
      await rateLimitService.check(userIp, null);
      console.log("[aiService] ✅ Rate limit OK");

      // 2️⃣ Kiểm tra cache vector
      let similar = null;
      try {
        similar = await vectorService.findSimilar(normalized);
      } catch (err) {
        console.warn("[aiService] ⚠️ vectorService.findSimilar lỗi:", err?.message || err);
      }

      if (similar) {
        console.log("[aiService] 🧠 Tìm thấy câu tương tự trong vector cache.");
        console.timeEnd('[aiService] total_time');
        return { ...similar, source: "vector-cache" };
      }

      // 3️⃣ Gọi OpenAI Q&A và tạo embedding song song
      console.log("[aiService] 🔄 Gọi song song OpenAI Q&A + Embedding...");
      const [completion, embeddingRes] = await Promise.allSettled([
        openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: normalized }],
        }),
        openai.embeddings.create({
          model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
          input: normalized,
        }),
      ]);

      // Xử lý kết quả Q&A
      let answer = "(Không có phản hồi)";
      if (completion.status === "fulfilled") {
        answer =
          completion.value?.choices?.[0]?.message?.content?.trim() ||
          "(Không có phản hồi)";
        console.log("[aiService] ✅ Nhận phản hồi từ OpenAI");
      } else {
        console.error(
          "[aiService] ❌ Lỗi gọi OpenAI:",
          completion.reason?.message || completion.reason
        );
      }

      // Xử lý kết quả embedding
      let embedding = null;
      if (embeddingRes.status === "fulfilled") {
        embedding = embeddingRes.value?.data?.[0]?.embedding || null;
        console.log("[aiService] ✅ Embedding tạo thành công");
      } else {
        console.warn(
          "[aiService] ⚠️ Không thể tạo embedding:",
          embeddingRes.reason?.message || embeddingRes.reason
        );
      }

      // 4️⃣ Lưu song song QA + vector embedding
      console.log("[aiService] 💾 Lưu dữ liệu song song (QA + embedding)");
      await Promise.allSettled([
        dbService.saveQA({ question: normalized, answer, embedding, userIp, uid }),
        vectorService.saveEmbedding(normalized, embedding),
      ]);

      console.timeEnd('[aiService] total_time');
      return { answer, source: "openai" };
    } catch (err) {
      console.error("[aiService] 💥 Pipeline lỗi:", err?.message || err);
      console.timeEnd('[aiService] total_time');
      throw err;
    }
  },
};

