// services/aiService.js
// ✅ Phiên bản tối ưu chính thức: xử lý Q&A song song (OpenAI + Embedding)
// ✅ Đã loại bỏ double rate-limit (check quota chỉ còn ở /pages/api/ask.js)
// ✅ Tối ưu log, lỗi, và lưu trữ song song Firestore + local

import { vectorService } from "./vectorService.js";
import { dbService } from "./dbService.js";
import { openai } from "../lib/openai.js";

/**
 * aiService
 * - Nhận câu hỏi từ API (đã qua rate-limit check)
 * - Tìm câu tương tự từ vectorService
 * - Nếu không có, gọi OpenAI Q&A + Embedding song song
 * - Lưu kết quả ra Firestore và local (qua dbService + vectorService)
 */
export const aiService = {
  async processQuestion({ question, userIp, uid = null }) {
    const normalized = question?.trim()?.toLowerCase();
    if (!normalized) throw new Error("Câu hỏi trống hoặc không hợp lệ.");

    console.log(`\n[aiService] 🚀 Bắt đầu xử lý câu hỏi | IP: ${userIp} | UID: ${uid}`);
    console.log(`[aiService] 🔸 Nội dung: "${normalized}"`);

    console.time("[aiService] total_time");

    try {
      // 1️⃣ Kiểm tra cache / câu tương tự
      let similar = null;
      try {
        similar = await vectorService.findSimilar(normalized);
      } catch (err) {
        console.warn("[aiService] ⚠️ vectorService.findSimilar lỗi:", err?.message || err);
      }

      if (similar) {
        console.log("[aiService] 🧠 Tìm thấy câu tương tự trong vector cache.");
        console.timeEnd("[aiService] total_time");
        return { ...similar, source: "vector-cache" };
      }

      // 2️⃣ Gọi OpenAI Q&A và tạo embedding song song
      console.log("[aiService] 🔄 Gọi song song OpenAI (chat + embedding)...");
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

      // ✅ Xử lý kết quả Q&A
      let answer = "(Không có phản hồi)";
      if (completion.status === "fulfilled") {
        answer =
          completion.value?.choices?.[0]?.message?.content?.trim() ||
          "(Không có phản hồi)";
        console.log("[aiService] ✅ Nhận phản hồi từ OpenAI");
      } else {
        console.error(
          "[aiService] ❌ Lỗi gọi OpenAI Chat:",
          completion.reason?.message || completion.reason
        );
      }

      // ✅ Xử lý kết quả embedding
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

      // 3️⃣ Lưu song song QA + Embedding
      console.log("[aiService] 💾 Lưu dữ liệu (QA + embedding) song song...");
      await Promise.allSettled([
        dbService.saveQA({ question: normalized, answer, embedding, userIp, uid }),
        vectorService.saveEmbedding(normalized, embedding),
      ]);

      console.timeEnd("[aiService] total_time");
      return { answer, source: "openai" };

    } catch (err) {
      console.error("[aiService] 💥 Pipeline lỗi:", err?.message || err);
      console.timeEnd("[aiService] total_time");
      throw err;
    }
  },
};

