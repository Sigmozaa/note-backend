import express from "express";
import { generateNotesFromLink } from "../utils/gemini.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { videoURL } = req.body;

  if (!videoURL) {
    return res.status(400).json({ error: "Brak 'videoURL' w zapytaniu." });
  }

  try {
    console.log(`1/2: 🎥 Otrzymano URL: ${videoURL}`);

    console.log("2/2: 🤖 Wysyłanie linku do Gemini i generowanie notatek...");

    const notes = await generateNotesFromLink(videoURL);

    console.log("✅ Notatki wygenerowane pomyślnie!");
    res.status(200).json({ notes: notes });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

export default router;
