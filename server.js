

import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json()); // Needed for chat input

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/* -------------------- 🌱 PLANT CHECK ROUTE -------------------- */
app.post("/check-plant", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: base64Image } },
      {
        text: `
You are an agricultural expert.
1. If plant is healthy → reply only: "✅ Plant is healthy. No action needed."
2. If diseased → reply ONLY in this format:

Disease: <name>
Remedies:
1. Step 1
2. Step 2
3. Step 3
Supplements: Neem Oil (Amazon), Sulfur Spray (Flipkart)

No long explanations, no warnings, keep answer farmer-friendly.
        `
      }
    ]);

    res.json({
      status: "success",
      message: result.response.text()
    });

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

/* -------------------- 💬 CHAT ROUTE -------------------- */
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const chatResult = await model.generateContent([
      {
        text: `You are a helpful agriculture chatbot. Keep answers short and easy.
Farmer: ${userMessage}`
      }
    ]);

    res.json({
      status: "success",
      reply: chatResult.response.text()
    });
  } catch (error) {
    console.error("❌ Chat Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

/* -------------------- START SERVER -------------------- */
app.listen(5000, () =>
  console.log("✅ Server running for Crop & Chat at http://localhost:5000")
);