// lib/openai.js
// Wrapper cho OpenAI SDK chính thức

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

