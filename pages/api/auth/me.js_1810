import { authService } from "@/services/authService";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { uid } = req.body;
  try {
    const user = await authService.getUser(uid);
    res.status(200).json(user || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

