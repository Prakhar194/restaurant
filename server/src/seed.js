import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import fs from "fs";
import path from "path";

const categories = [
  "Momos",
  "Spl. Momos",
  "Veg. Chowmein",
  "Non-Veg. Chowmein",
  "Potato",
  "Chinese Veg Dry / Gravy",
  "Maggi",
  "Roll",
  "Veg Fried Rice",
  "Non-Veg Fried Rice",
  "Beverages"
];

const menu = [
  ["Veg. Momos", "Momos", 40, 60],
  ["Paneer Momos", "Momos", 50, 70],
  ["Chicken Momos", "Momos", 50, 70],
  ["Chilli Momos", "Momos", 60, 100],
  ["Butter Momos", "Momos", 70, 100],

  ["Kurkure Veg Momos", "Spl. Momos", 60, 110],
  ["Kurkure Paneer Momos", "Spl. Momos", 70, 120],
  ["Kurkure Chicken Momos", "Spl. Momos", 80, 130],

  ["Veg Chowmein", "Veg. Chowmein", 50, 80],
  ["Veg Amul Butter Chowmein", "Veg. Chowmein", 60, 90],
  ["Paneer Chowmein", "Veg. Chowmein", 70, 100],
  ["Paneer Butter Chowmein", "Veg. Chowmein", 70, 110],
  ["Singapuri Chowmein", "Veg. Chowmein", 80, 110],
  ["Hakka Noodles", "Veg. Chowmein", 60, 100],
  ["Chilli Garlic Chowmein", "Veg. Chowmein", 60, 100],

  ["Egg Chowmein", "Non-Veg. Chowmein", 60, 100],
  ["Egg Paneer Chowmein", "Non-Veg. Chowmein", 80, 110],
  ["Chicken Chowmein", "Non-Veg. Chowmein", 70, 100],
  ["Chicken Singapuri Chowmein", "Non-Veg. Chowmein", 90, 130],
  ["Chicken Egg Mix Chowmein", "Non-Veg. Chowmein", 80, 120],
  ["Chicken Chilli Garlic Chowmein", "Non-Veg. Chowmein", 70, 100],

  ["Chilli Potato", "Potato", 70, 100],
  ["Honey Chilli Potato", "Potato", 80, 120],
  ["French Fries", "Potato", null, 50],

  ["Chilli Manchurian", "Chinese Veg Dry / Gravy", 70, 120],
  ["Chilli Paneer", "Chinese Veg Dry / Gravy", 80, 150],
  ["Chilli Chaap", "Chinese Veg Dry / Gravy", 80, 130],
  ["Veg Paneer Manchurian (Dry)", "Chinese Veg Dry / Gravy", 90, 150],
  ["Veg Paneer Manchurian (Gravy)", "Chinese Veg Dry / Gravy", 90, 150],

  ["Paneer Maggi", "Maggi", null, 80],
  ["Egg Maggi", "Maggi", null, 70],
  ["Chicken Maggi", "Maggi", null, 90],
  ["Spl. Maggi", "Maggi", null, 100],

  ["Veg Spring Roll", "Roll", null, 50],
  ["Paneer Roll", "Roll", null, 70],
  ["Egg Roll", "Roll", null, 40],
  ["Chicken Spring Roll", "Roll", null, 70],
  ["Spl. Egg Chicken Roll", "Roll", null, 90],

  ["Veg Fried Rice", "Veg Fried Rice", 60, 80],
  ["Veg Paneer Fried Rice", "Veg Fried Rice", 70, 110],
  ["Veg Paneer Triple Fried Rice", "Veg Fried Rice", 70, 120],
  ["Veg Amul Butter Fried Rice", "Veg Fried Rice", 70, 110],
  ["Veg Mix Fried Rice", "Veg Fried Rice", 80, 110],
  ["Veg Chilli Garlic Fried Rice", "Veg Fried Rice", 70, 100],
  ["Veg Singapuri Fried Rice", "Veg Fried Rice", 80, 110],

  ["Chicken Fried Rice", "Non-Veg Fried Rice", 70, 120],
  ["Egg Fried Rice", "Non-Veg Fried Rice", 60, 100],
  ["Chicken Egg Mix Fried Rice", "Non-Veg Fried Rice", 80, 120],
  ["Chicken Chilli Garlic Fried Rice", "Non-Veg Fried Rice", 70, 100],
  ["Chicken Singapuri Fried Rice", "Non-Veg Fried Rice", 80, 120],

  ["Cold Drinks", "Beverages", null, null],
  ["Water Bottle", "Beverages", null, null],
  ["Ice Cubes", "Beverages", null, null]
];

function imageSvg(name, category) {
  const safe = name
    .replace(/&/g, "and")
    .replace(/</g, "")
    .replace(/>/g, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="100%" height="100%" fill="#171717"/>
  <circle cx="400" cy="250" r="155" fill="#292524"/>
  <text x="400" y="245" text-anchor="middle" fill="#f5c451" font-size="38" font-family="Arial" font-weight="bold">${safe.slice(0, 25)}</text>
  <text x="400" y="300" text-anchor="middle" fill="white" font-size="22" font-family="Arial">${category}</text>
  <text x="400" y="525" text-anchor="middle" fill="#aaa" font-size="18" font-family="Arial">
    Replace with real food image in Admin
  </text>
</svg>`;
}

async function seed() {
  // Check required environment variables
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD are required in .env"
    );
  }

  // Clear existing data
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.admin.deleteMany();

  // Create categories
  const categoryMap = {};

  for (let i = 0; i < categories.length; i++) {
    categoryMap[categories[i]] = await prisma.category.create({
      data: {
        name: categories[i],
        sortOrder: i
      }
    });
  }

  // Create uploads directory
  const uploadDir = path.resolve("uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  // Create menu items
  for (const [name, category, half, full] of menu) {
    const file =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".svg";

    fs.writeFileSync(
      path.join(uploadDir, file),
      imageSvg(name, category)
    );

    await prisma.item.create({
      data: {
        name,
        categoryId: categoryMap[category].id,
        halfPrice: half,
        fullPrice: full,
        image: `/uploads/${file}`
      }
    });
  }

  // Create admin using credentials from .env
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD,
    10
  );

  await prisma.admin.create({
    data: {
      username: process.env.ADMIN_USERNAME,
      passwordHash
    }
  });

  console.log("Seed complete.");
  console.log(`Admin username: ${process.env.ADMIN_USERNAME}`);
  console.log("Admin password: [hidden]");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });