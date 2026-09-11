import { Router } from "express";
import { prisma } from "./db.js";
import { requireAdmin } from "./middleware-auth.js";

const router = Router();

router.get("/", async (_, res) => {
  res.json(await prisma.category.findMany({ orderBy: { sortOrder: "asc" } }));
});

router.post("/", requireAdmin, async (req, res) => {
  if (!req.body.name?.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }
  const category = await prisma.category.create({
    data: { name: req.body.name.trim() }
  });
  res.status(201).json(category);
});

export default router;
