import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import auth from "./auth.js";
import items from "./items.js";
import categories from "./categories.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://restaurant-plum-five-43.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", auth);
app.use("/api/items", items);
app.use("/api/categories", categories);

app.listen(process.env.PORT || 5000, () =>
  console.log("API running on http://localhost:5000")
);
