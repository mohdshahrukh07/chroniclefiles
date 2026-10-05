import User from "../models/user.ts";
import { connectToDatabase } from "../lib/mongodb.ts";

// command to run this script:
//npm run seed:admin

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const initialPassword = process.env.ADMIN_PASSWORD;

  if (!username) {
    throw new Error("ADMIN_USERNAME is not set in .env.local.");
  }

  if (!initialPassword) {
    throw new Error("ADMIN_PASSWORD is not set in .env.local.");
  }

  const database = await connectToDatabase();

  try {
    await User.init();

    const passwordHash = await User.hashPassword(initialPassword);
    const result = await User.updateOne(
      { username },
      {
        $set: {
          passwordHash,
          role: "admin",
        },
      },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    const action = result.upsertedCount > 0 ? "created" : "updated";
    console.log(`Admin user ${action}: ${username}`);
  } finally {
    await database.disconnect();
  }
}

seedAdmin().catch((error) => {
  console.error("Admin user seed failed.", error);
  process.exitCode = 1;
});
