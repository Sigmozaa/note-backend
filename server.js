import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import generateRouter from "./routes/generate.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmpDir = path.join(__dirname, "tmp");
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("📁 Usunięto niepotrzebny folder /tmp.");
}

app.use("/generate", generateRouter);

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}. Gotowy do generowania!`);
});
