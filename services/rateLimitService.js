// services/rateLimitService.js
// Implements simple IP-based rate limiting for free-tier control
import fs from 'fs';
const LIMIT_FILE = './data/limits.json';
const LIMIT_COUNT = parseInt(process.env.FREE_LIMIT_PER_IP || '3');

export const rateLimitService = {
  async checkIp(ip) {
    const today = new Date().toISOString().slice(0, 10);
    if (!fs.existsSync(LIMIT_FILE)) fs.writeFileSync(LIMIT_FILE, '{}');
    const data = JSON.parse(fs.readFileSync(LIMIT_FILE));

    const record = data[ip] || { date: today, count: 0 };
    if (record.date !== today) record.count = 0;

    if (record.count >= LIMIT_COUNT) {
      throw new Error('limit_exceeded');
    }

    record.date = today;
    record.count++;
    data[ip] = record;
    fs.writeFileSync(LIMIT_FILE, JSON.stringify(data, null, 2));
  },
};
