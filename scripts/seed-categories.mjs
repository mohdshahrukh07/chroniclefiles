import mongoose from "mongoose";
import Category from "../models/category.ts";
import { connectToDatabase } from "../lib/mongodb.ts";

const categoryNames = [
  "News",
  "Technology",
  "Education",
  "Entertainment",
  "Lifestyle",
  "Business",
  "Science",
  "Health",
  "Sports",
  "Travel",
  "Finance",
  "Gaming",
  "Reviews",
  "How-To",
  "Opinion",
];

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedCategories() {
  const database = await connectToDatabase();

  try {
    await Category.init();

    let createdCount = 0;
    let existingCount = 0;

    for (const name of categoryNames) {
      const slug = createSlug(name);
      const result = await Category.updateOne(
        { slug },
        {
          $setOnInsert: {
            name,
            slug,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          runValidators: true,
          timestamps: false,
        },
      ).exec();

      if (result.upsertedCount > 0) {
        createdCount += 1;
      } else {
        existingCount += 1;
      }
    }

    console.log(
      `Category seed complete: ${createdCount} created, ${existingCount} already present.`,
    );
  } finally {
    await database.disconnect();
  }
}

seedCategories().catch((error) => {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`Category seed failed (${errorName}).`);
  if (mongoose.connection.readyState !== 0) {
    void mongoose.disconnect();
  }
  process.exitCode = 1;
});
