import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "./db.js";
import { requireAdmin } from "./middleware-auth.js";

const router = Router();
const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  }
});

// PUBLIC MENU
router.get("/", async (req, res) => {
  const { category = "all", sort = "default", search = "" } = req.query;

  const where = {
    isAvailable: true,
    ...(category !== "all" ? { category: { name: category } } : {}),
    ...(search ? { name: { contains: search } } : {})
  };

  let orderBy = [{ sortOrder: "asc" }, { name: "asc" }];
  if (sort === "price-low") orderBy = [{ fullPrice: "asc" }];
  if (sort === "price-high") orderBy = [{ fullPrice: "desc" }];
  if (sort === "name") orderBy = [{ name: "asc" }];

  res.json(await prisma.item.findMany({
    where,
    include: { category: true },
    orderBy
  }));
});

// ADMIN MENU
router.get("/admin/all", requireAdmin, async (_, res) => {
  res.json(await prisma.item.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
  }));
});

// ADD ITEM + IMAGE
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  if (!req.file || !req.body.name || !req.body.categoryId) {
    return res.status(400).json({
      message: "Name, category and image are required"
    });
  }

  const item = await prisma.item.create({
    data: {
      name: req.body.name,
      description: req.body.description || null,
      halfPrice: req.body.halfPrice === "" ? null : Number(req.body.halfPrice),
      fullPrice: req.body.fullPrice === "" ? null : Number(req.body.fullPrice),
      categoryId: Number(req.body.categoryId),
      image: `/uploads/${req.file.filename}`,
      isAvailable: req.body.isAvailable !== "false"
    },
    include: { category: true }
  });

  res.status(201).json(item);
});

// EDIT ITEM / CHANGE PRICE / REPLACE IMAGE
router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  const id = Number(req.params.id);
  const data = {};

  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description || null;
  if (req.body.halfPrice !== undefined)
    data.halfPrice = req.body.halfPrice === "" ? null : Number(req.body.halfPrice);
  if (req.body.fullPrice !== undefined)
    data.fullPrice = req.body.fullPrice === "" ? null : Number(req.body.fullPrice);
  if (req.body.categoryId !== undefined) data.categoryId = Number(req.body.categoryId);
  if (req.body.isAvailable !== undefined) data.isAvailable = req.body.isAvailable === "true";
  if (req.file) data.image = `/uploads/${req.file.filename}`;

  try {
    res.json(await prisma.item.update({
      where: { id },
      data,
      include: { category: true }
    }));
  } catch {
    res.status(404).json({ message: "Item not found" });
  }
});

// DELETE ITEM
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.item.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Item deleted" });
  } catch {
    res.status(404).json({ message: "Item not found" });
  }
});

export default router;
