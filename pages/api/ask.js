// pages/api/ask.js
// Main endpoint: receives question, calls aiService pipeline
import { aiService } from '../../services/aiService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const result = await aiService.processQuestion({ question, userIp });
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'limit_exceeded') {
      return res.status(429).json({ error: 'limit_exceeded', message: 'Bạn đã vượt quá 3 câu hỏi miễn phí hôm nay.' });
    }
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
}
