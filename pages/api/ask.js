// pages/api/ask.js
// Main endpoint: receives question, calls aiService pipeline
import { aiService } from '../../services/aiService.js';
import { rateLimitService } from '../../services/rateLimitService.js';
import { authService } from '../../services/authService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, uid } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    console.log('[ask.js] ▶️ Handler called | uid:', uid, '| IP:', userIp);

    // =========================
    // 1️⃣ Check free quota logic
    // =========================
    let userData = null;

    if (uid) {
      console.log('[ask.js] 🔍 Fetching user data from Firestore (authService.getUser)');
      userData = await authService.getUser(uid);
    }

    // 💡 Dòng bổ sung quan trọng: gọi check() từ rateLimitService
    console.log('[ask.js] 🚦 Running rate limit check...');
    await rateLimitService.check(userIp, userData);
    console.log('[ask.js] ✅ Rate limit passed, continue to AI service');

    // =========================
    // 2️⃣ Tiếp tục pipeline cũ
    // =========================
    const result = await aiService.processQuestion({ question, userIp, uid });
    res.status(200).json(result);
    console.log('[ask.js] ✅ Response sent successfully');

  } catch (err) {
    console.error('[ask.js] 💥 Error caught:', err?.message || err);
    if (err.message === 'limit_exceeded') {
      console.warn('[ask.js] ❌ Free quota exceeded');
      return res.status(429).json({
        error: 'limit_exceeded',
        message: 'Bạn đã vượt quá 3 câu hỏi miễn phí hôm nay. Vui lòng đăng nhập hoặc đợi đến ngày mai.',
      });
    }
    res.status(500).json({ error: 'internal_error', message: err?.message || String(err) });
  }
}

