import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data/limits.json");

export async function checkLimit(ip) {
  let limits = {};

  // Đọc dữ liệu cũ
  try {
    if (fs.existsSync(dataPath)) {
      limits = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    }
  } catch (err) {
    console.error("Không đọc được file giới hạn:", err);
  }

  const today = new Date().toISOString().split("T")[0];
  const limitPerIP = parseInt(process.env.FREE_LIMIT_PER_IP || "3");

  // Nếu IP chưa tồn tại
  if (!limits[ip]) {
    limits[ip] = { date: today, count: 1 };
  } else {
    // Nếu IP đã có, kiểm tra ngày
    if (limits[ip].date === today) {
      if (limits[ip].count >= limitPerIP) {
        return false;
      }
      limits[ip].count += 1;
    } else {
      // Reset sang ngày mới
      limits[ip] = { date: today, count: 1 };
    }
  }

  // Lưu lại dữ liệu
  try {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(limits, null, 2));
  } catch (err) {
    console.error("Không lưu được file giới hạn:", err);
  }

  return true;
}

