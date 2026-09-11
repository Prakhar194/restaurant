import { Router } from "express";
import multer from "multer";
import { prisma } from "./db.js";
import { requireAdmin } from "./middleware-auth.js";
import cloudinary from "./cloudinary.js";

const router = Router();

// Store uploaded image temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (_, file, cb) => {
    cb(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
    );
  },
});

// Upload image to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "foodify",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

// PUBLIC MENU
router.get("/", async (req, res) => {
  const {
    category = "all",
    sort = "default",
    search = "",
  } = req.query;

  const where = {
    isAvailable: true,

    ...(category !== "all"
      ? {
          category: {
            name: category,
          },
        }
      : {}),

    ...(search
      ? {
          name: {
            contains: search,
          },
        }
      : {}),
  };

  let orderBy = [
    { sortOrder: "asc" },
    { name: "asc" },
  ];

  if (sort === "price-low") {
    orderBy = [{ fullPrice: "asc" }];
  }

  if (sort === "price-high") {
    orderBy = [{ fullPrice: "desc" }];
  }

  if (sort === "name") {
    orderBy = [{ name: "asc" }];
  }

  res.json(
    await prisma.item.findMany({
      where,
      include: {
        category: true,
      },
      orderBy,
    })
  );
});

// ADMIN MENU
router.get("/admin/all", requireAdmin, async (_, res) => {
  res.json(
    await prisma.item.findMany({
      include: {
        category: true,
      },
      orderBy: [
        {
          category: {
            sortOrder: "asc",
          },
        },
        {
          sortOrder: "asc",
        },
      ],
    })
  );
});

// ADD ITEM + IMAGE
router.post(
  "/",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file || !req.body.name || !req.body.categoryId) {
        return res.status(400).json({
          message: "Name, category and image are required",
        });
      }

      // Upload image to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer);

      const item = await prisma.item.create({
        data: {
          name: req.body.name,

          description:
            req.body.description || null,

          halfPrice:
            req.body.halfPrice === ""
              ? null
              : Number(req.body.halfPrice),

          fullPrice:
            req.body.fullPrice === ""
              ? null
              : Number(req.body.fullPrice),

          categoryId: Number(req.body.categoryId),

          // Save Cloudinary URL
          image: result.secure_url,

          isAvailable:
            req.body.isAvailable !== "false",
        },

        include: {
          category: true,
        },
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Add item error:", error);

      res.status(500).json({
        message: "Failed to upload image or create item",
      });
    }
  }
);

// EDIT ITEM / CHANGE PRICE / REPLACE IMAGE
router.put(
  "/:id",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    const id = Number(req.params.id);

    try {
      const data = {};

      if (req.body.name !== undefined) {
        data.name = req.body.name;
      }

      if (req.body.description !== undefined) {
        data.description =
          req.body.description || null;
      }

      if (req.body.halfPrice !== undefined) {
        data.halfPrice =
          req.body.halfPrice === ""
            ? null
            : Number(req.body.halfPrice);
      }

      if (req.body.fullPrice !== undefined) {
        data.fullPrice =
          req.body.fullPrice === ""
            ? null
            : Number(req.body.fullPrice);
      }

      if (req.body.categoryId !== undefined) {
        data.categoryId =
          Number(req.body.categoryId);
      }

      if (req.body.isAvailable !== undefined) {
        data.isAvailable =
          req.body.isAvailable === "true";
      }

      // Replace image if a new one was uploaded
      if (req.file) {
        const result = await uploadToCloudinary(
          req.file.buffer
        );

        data.image = result.secure_url;
      }

      const item = await prisma.item.update({
        where: {
          id,
        },

        data,

        include: {
          category: true,
        },
      });

      res.json(item);
    } catch (error) {
      console.error("Update item error:", error);

      res.status(404).json({
        message: "Item not found",
      });
    }
  }
);

// DELETE ITEM
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.item.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.json({
      message: "Item deleted",
    });
  } catch {
    res.status(404).json({
      message: "Item not found",
    });
  }
});

export default router;
